// lib/used-listings.ts — data layer for the used-car marketplace.
// Combines the seeded demo listings (vehicles-db) with community listings
// stored in the Supabase `used_listings` table.

import { supabase } from "./supabase";
import { getUsedListings } from "./vehicles-db";

/** Sell = one-time asking price; rent = price per day. */
export type ListingType = "sell" | "rent";

/** Normalized shape rendered by the marketplace cards. */
export interface UsedCardData {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  kmDriven: number;
  condition: string;
  /** Asking price for 'sell', per-day rate for 'rent'. */
  askingPrice: number;
  listingType: ListingType;
  fuel: string;
  location: string;
  sellerType: string;
  sellerName?: string;
  sellerPhone?: string;
  isEV: boolean;
  imageUrl?: string;
  source: "seed" | "community";
  /** True once the seller (or an admin) marks the car as sold. */
  sold: boolean;
  /** Owner of a community listing — used to show self-service controls. */
  ownerId?: string;
}

/** Row shape of public.used_listings. */
interface DbUsedListing {
  id: string;
  user_id: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_variant: string | null;
  year: number;
  km_driven: number;
  condition: string;
  asking_price: number;
  original_price: number | null;
  fuel: string;
  transmission: string | null;
  color: string | null;
  location: string;
  seller_name: string | null;
  seller_phone: string | null;
  seller_type: string | null;
  description: string | null;
  is_ev: boolean;
  battery_health: number | null;
  features: string[] | null;
  images: string[] | null;
  listing_type: ListingType;
  sold: boolean | null;
  created_at: string;
}

/** Input collected by the "List your car" form. */
export interface NewListingInput {
  brand: string;
  model: string;
  variant?: string;
  year: number;
  kmDriven: number;
  condition: string;
  /** Asking price for 'sell', per-day rate for 'rent'. */
  askingPrice: number;
  listingType: ListingType;
  originalPrice?: number;
  fuel: string;
  transmission?: string;
  color?: string;
  location: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerType: string;
  description?: string;
  isEV: boolean;
  batteryHealth?: number;
  images: string[];
}

/** Seeded demo listings, normalized. Seed images are placeholders, so the
 *  cards render the brand watermark instead (same as the old home section). */
export function seedListingsAsCards(): UsedCardData[] {
  return getUsedListings().map((u) => ({
    id: `seed-${u.id}`,
    brand: u.vehicleBrand,
    model: u.vehicleModel,
    variant: u.vehicleVariant,
    year: u.year,
    kmDriven: u.kmDriven,
    condition: u.condition,
    askingPrice: u.askingPrice,
    listingType: "sell",
    fuel: u.fuel,
    location: u.location,
    sellerType: u.sellerType,
    sellerName: u.sellerName,
    sellerPhone: u.sellerPhone,
    isEV: u.isEV,
    imageUrl: undefined,
    source: "seed",
    sold: false,
  }));
}

function rowToCard(r: DbUsedListing): UsedCardData {
  const images = Array.isArray(r.images) ? r.images : [];
  return {
    id: r.id,
    brand: r.vehicle_brand,
    model: r.vehicle_model,
    variant: r.vehicle_variant ?? undefined,
    year: r.year,
    kmDriven: r.km_driven,
    condition: r.condition,
    askingPrice: Number(r.asking_price),
    listingType: r.listing_type === "rent" ? "rent" : "sell",
    fuel: r.fuel,
    location: r.location,
    sellerType: r.seller_type ?? "Individual",
    sellerName: r.seller_name ?? undefined,
    sellerPhone: r.seller_phone ?? undefined,
    isEV: r.is_ev,
    imageUrl: images[0],
    // Admin-seeded rows have no owner; only user-posted rows get the
    // "Just listed" treatment on the cards.
    source: r.user_id ? "community" : "seed",
    sold: Boolean(r.sold),
    ownerId: r.user_id ?? undefined,
  };
}

/** All community listings, newest first. */
export async function fetchCommunityListings(): Promise<UsedCardData[]> {
  const { data, error } = await supabase
    .from("used_listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DbUsedListing[]).map(rowToCard);
}

/** Uploads photos to the public `listing-photos` bucket; returns public URLs. */
export async function uploadListingPhotos(files: File[], userId: string): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userId}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage
      .from("listing-photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/** Inserts a listing owned by the signed-in user (RLS enforces ownership). */
export async function createListing(input: NewListingInput, userId: string): Promise<void> {
  const { error } = await supabase.from("used_listings").insert({
    user_id: userId,
    vehicle_brand: input.brand,
    vehicle_model: input.model,
    vehicle_variant: input.variant || null,
    year: input.year,
    km_driven: input.kmDriven,
    condition: input.condition,
    asking_price: input.askingPrice,
    listing_type: input.listingType,
    original_price: input.originalPrice ?? null,
    fuel: input.fuel,
    transmission: input.transmission || null,
    color: input.color || null,
    location: input.location,
    seller_name: input.sellerName || null,
    seller_phone: input.sellerPhone || null,
    seller_type: input.sellerType,
    description: input.description || null,
    is_ev: input.isEV,
    battery_health: input.batteryHealth ?? null,
    features: [],
    images: input.images,
  });
  if (error) throw new Error(error.message);
}

/** Marks a community listing sold/available. RLS restricts this to the owner. */
export async function setListingSold(id: string, sold: boolean): Promise<void> {
  const { error } = await supabase.from("used_listings").update({ sold }).eq("id", id);
  if (error) throw new Error(error.message);
}
