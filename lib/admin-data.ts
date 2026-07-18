// Shared column whitelists + seed mappers for admin CRUD.
import { ExtendedVehicle } from "./vehicles-db";
import { UsedListing } from "./types";

// Columns the admin may write. Anything else in a request body is ignored.
export const VEHICLE_COLUMNS = [
  "brand", "model", "variant", "type", "fuel", "category", "price",
  "battery_kwh", "range_km", "horsepower", "torque", "torque_label", "mileage",
  "engine_cc", "seating_capacity", "transmission", "ground_clearance", "boot_space",
  "safety_rating", "total_airbags", "dimensions", "drive_type", "brand_slug", "slug",
  "is_ev", "is_featured", "year_launched", "used_count", "description",
  "key_features", "colors", "images", "image_url",
] as const;

export const VEHICLE_REQUIRED = ["brand", "model", "variant", "type", "fuel", "seating_capacity", "transmission", "price"];

export const USED_COLUMNS = [
  "vehicle_brand", "vehicle_model", "vehicle_variant", "year", "km_driven", "condition",
  "asking_price", "original_price", "fuel", "transmission", "color", "location",
  "seller_name", "seller_type", "description", "images", "battery_health", "features",
  "is_ev", "posted_at", "listing_type", "sold",
] as const;

export const USED_REQUIRED = ["vehicle_brand", "vehicle_model", "asking_price"];

// Rental listings are `used_listings` rows with listing_type = 'rent'. They share
// the used-listings column shape; listing_type is forced to 'rent' server-side so
// the rentals admin surface can reuse the same writable-column whitelist.
export const RENTAL_COLUMNS = USED_COLUMNS;
export const RENTAL_REQUIRED = USED_REQUIRED;

export const ADMIN_COLUMNS = ["name", "email", "password"] as const;
export const ADMIN_REQUIRED = ["name", "email", "password"];

// Keep only whitelisted keys whose value was actually supplied.
export function pick(body: Record<string, unknown>, columns: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    if (body[col] !== undefined) out[col] = body[col];
  }
  return out;
}

// Return the list of required fields missing from a create payload.
export function missingRequired(row: Record<string, unknown>, required: string[]): string[] {
  return required.filter((k) => row[k] === undefined || row[k] === null || row[k] === "");
}

// ── Seed mappers: static catalog objects → DB rows ──────────────────────────
export function vehicleToRow(v: ExtendedVehicle) {
  return {
    brand: v.brand,
    model: v.model,
    variant: v.variant,
    type: v.type,
    fuel: v.fuel,
    category: v.category,
    price: v.price,
    battery_kwh: v.batteryKwh ?? null,
    range_km: v.rangeKm ?? null,
    horsepower: v.horsepower ?? null,
    torque: v.torque ?? null,
    torque_label: v.torqueLabel ?? null,
    seating_capacity: v.seatingCapacity,
    transmission: v.transmission,
    ground_clearance: v.groundClearance ?? null,
    boot_space: v.bootSpace ?? null,
    safety_rating: v.safetyRating ?? null,
    total_airbags: v.totalAirbags ?? null,
    dimensions: v.dimensions ?? null,
    drive_type: v.driveType ?? null,
    brand_slug: v.brandSlug,
    slug: v.slug,
    is_ev: v.isEV,
    is_featured: v.isFeatured,
    year_launched: v.yearLaunched,
    used_count: v.usedCount ?? 0,
    description: v.description,
    key_features: v.keyFeatures ?? [],
    colors: v.colors ?? [],
    images: v.images ?? [],
    image_url: v.images?.[0] ?? null,
  };
}

export function usedToRow(u: UsedListing) {
  return {
    vehicle_brand: u.vehicleBrand,
    vehicle_model: u.vehicleModel,
    vehicle_variant: u.vehicleVariant,
    year: u.year,
    km_driven: u.kmDriven,
    condition: u.condition,
    asking_price: u.askingPrice,
    original_price: u.originalPrice,
    fuel: u.fuel,
    transmission: u.transmission,
    color: u.color,
    location: u.location,
    seller_name: u.sellerName,
    seller_type: u.sellerType,
    description: u.description,
    images: u.images ?? [],
    battery_health: u.batteryHealth ?? null,
    features: u.features ?? [],
    is_ev: u.isEV,
    posted_at: u.postedAt,
  };
}
