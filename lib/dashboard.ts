// lib/dashboard.ts — data helpers for the user dashboard (/dashboard).
// Every query runs through the anon client with the signed-in user's session,
// so Row-Level Security scopes the results:
//   - used_listings: public read; owner update/delete (mark-sold / delete)
//   - test_drive_bookings: booker reads own + owner reads bookings on their
//     listing/vehicle (T8 policies) → partitioned into made / received here
//   - rental_requests: requester reads own + listing owner reads/updates theirs
// New helpers live here so the shared libs stay lean; existing helpers
// (setListingSold, getVehiclesCached) are reused rather than duplicated.

import { supabase } from "./supabase";
import { getVehiclesCached, type ExtendedVehicle } from "./vehicles-db";
import type { ListingType } from "./used-listings";

/* ─────────────────────────────── My listings ────────────────────────────── */

/** A used/rental listing owned by the signed-in user. */
export interface MyListing {
  id: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  /** Asking price for 'sell', per-day rate for 'rent'. */
  askingPrice: number;
  listingType: ListingType;
  location: string;
  imageUrl?: string;
  sold: boolean;
  createdAt: string;
}

interface MyListingRow {
  id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_variant: string | null;
  year: number;
  asking_price: number | string;
  listing_type: ListingType;
  location: string;
  images: string[] | null;
  sold: boolean | null;
  created_at: string;
}

/** Community used + rental listings owned by `userId`, newest first. */
export async function fetchMyListings(userId: string): Promise<MyListing[]> {
  const { data, error } = await supabase
    .from("used_listings")
    .select(
      "id, vehicle_brand, vehicle_model, vehicle_variant, year, asking_price, listing_type, location, images, sold, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as MyListingRow[]).map((r) => ({
    id: r.id,
    brand: r.vehicle_brand,
    model: r.vehicle_model,
    variant: r.vehicle_variant ?? undefined,
    year: r.year,
    askingPrice: Number(r.asking_price),
    listingType: r.listing_type === "rent" ? "rent" : "sell",
    location: r.location,
    imageUrl: Array.isArray(r.images) ? r.images[0] : undefined,
    sold: Boolean(r.sold),
    createdAt: r.created_at,
  }));
}

/** Permanently deletes a community listing. RLS restricts this to the owner. */
export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from("used_listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Catalog vehicles owned by the signed-in dealer (via vehicles.owner_id). */
export async function fetchMyVehicles(userId: string): Promise<ExtendedVehicle[]> {
  const all = await getVehiclesCached();
  return all.filter((v) => v.ownerId === userId);
}

/* ────────────────────────────── Test drives ─────────────────────────────── */

export interface TestDriveRow {
  id: string;
  vehicleLabel: string;
  fullName: string;
  phone: string;
  preferredDate: string;
  timeSlot: string;
  message?: string;
  createdAt: string;
  bookerId: string;
  listingId?: string;
  vehicleId?: string;
}

interface BookingDbRow {
  id: string;
  booker_id: string;
  listing_id: string | null;
  vehicle_id: string | null;
  vehicle_label: string;
  full_name: string;
  phone: string;
  preferred_date: string;
  time_slot: string;
  message: string | null;
  created_at: string;
}

/**
 * Test-drive bookings visible to the user, split into:
 *   made     — bookings the user placed (booker_id = me)
 *   received — bookings on the user's own listings / vehicles (visible only
 *              because of the T8 owner-select policies)
 */
export async function fetchTestDrives(
  userId: string
): Promise<{ made: TestDriveRow[]; received: TestDriveRow[] }> {
  const { data, error } = await supabase
    .from("test_drive_bookings")
    .select(
      "id, booker_id, listing_id, vehicle_id, vehicle_label, full_name, phone, preferred_date, time_slot, message, created_at"
    )
    .order("created_at", { ascending: false });
  if (error || !data) return { made: [], received: [] };
  const rows: TestDriveRow[] = (data as BookingDbRow[]).map((r) => ({
    id: r.id,
    vehicleLabel: r.vehicle_label,
    fullName: r.full_name,
    phone: r.phone,
    preferredDate: r.preferred_date,
    timeSlot: r.time_slot,
    message: r.message ?? undefined,
    createdAt: r.created_at,
    bookerId: r.booker_id,
    listingId: r.listing_id ?? undefined,
    vehicleId: r.vehicle_id ?? undefined,
  }));
  return {
    made: rows.filter((r) => r.bookerId === userId),
    received: rows.filter((r) => r.bookerId !== userId),
  };
}

/* ──────────────────────────── Rental requests ───────────────────────────── */

export type RentalStatus = "pending" | "approved" | "declined";

export interface RentalRow {
  id: string;
  listingId: string;
  listingLabel: string;
  fullName: string;
  phone: string;
  startDate: string;
  endDate: string;
  message?: string;
  status: RentalStatus;
  createdAt: string;
  requesterId: string;
}

interface RentalDbRow {
  id: string;
  listing_id: string;
  requester_id: string;
  full_name: string;
  phone: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: RentalStatus;
  created_at: string;
}

interface ListingLabelRow {
  id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_variant: string | null;
  year: number;
}

/**
 * Rental requests visible to the user, split into:
 *   made     — requests the user submitted (requester_id = me), with status
 *   received — requests on the user's own rent listings (owner-select RLS)
 */
export async function fetchRentalRequests(
  userId: string
): Promise<{ made: RentalRow[]; received: RentalRow[] }> {
  const { data, error } = await supabase
    .from("rental_requests")
    .select(
      "id, listing_id, requester_id, full_name, phone, start_date, end_date, message, status, created_at"
    )
    .order("created_at", { ascending: false });
  if (error || !data) return { made: [], received: [] };
  const rows = data as RentalDbRow[];

  // Resolve a human label for each referenced listing (used_listings is public read).
  const ids = Array.from(new Set(rows.map((r) => r.listing_id)));
  const labels = new Map<string, string>();
  if (ids.length > 0) {
    const { data: listings } = await supabase
      .from("used_listings")
      .select("id, vehicle_brand, vehicle_model, vehicle_variant, year")
      .in("id", ids);
    for (const l of (listings ?? []) as ListingLabelRow[]) {
      const variant = l.vehicle_variant ? ` ${l.vehicle_variant}` : "";
      labels.set(l.id, `${l.year} ${l.vehicle_brand} ${l.vehicle_model}${variant}`.trim());
    }
  }

  const mapped: RentalRow[] = rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingLabel: labels.get(r.listing_id) ?? "Rental listing",
    fullName: r.full_name,
    phone: r.phone,
    startDate: r.start_date,
    endDate: r.end_date,
    message: r.message ?? undefined,
    status: r.status,
    createdAt: r.created_at,
    requesterId: r.requester_id,
  }));

  return {
    made: mapped.filter((r) => r.requesterId === userId),
    received: mapped.filter((r) => r.requesterId !== userId),
  };
}

/**
 * Approve or decline a rental request. RLS (rental_requests_owner_update)
 * restricts this to the listing owner; the status change fires the
 * notify_requester_on_rental_decision trigger that alerts the requester.
 */
export async function setRentalStatus(
  id: string,
  status: "approved" | "declined"
): Promise<void> {
  const { error } = await supabase.from("rental_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
