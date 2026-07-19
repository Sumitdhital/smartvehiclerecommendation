// lib/test-drive.ts — data layer for test-drive bookings.
// A booking on a community listing triggers a notification to the listing
// owner (Postgres trigger). Catalog / seed bookings carry no listingId.

import { supabase } from "./supabase";

export const TIME_SLOTS = [
  "Morning (9–12)",
  "Afternoon (12–4)",
  "Evening (4–7)",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export interface TestDriveInput {
  vehicleLabel: string;
  /** Only set for community used listings — drives the owner notification. */
  listingId?: string;
  /** Only set for catalog/new-car bookings — drives the vehicle owner notification. */
  vehicleId?: string;
  fullName: string;
  phone: string;
  preferredDate: string; // yyyy-mm-dd
  timeSlot: string;
  message?: string;
}

/** Inserts a booking owned by the signed-in user (RLS enforces booker_id). */
export async function createTestDriveBooking(
  input: TestDriveInput,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("test_drive_bookings").insert({
    booker_id: userId,
    listing_id: input.listingId ?? null,
    vehicle_id: input.vehicleId ?? null,
    vehicle_label: input.vehicleLabel,
    full_name: input.fullName,
    phone: input.phone,
    preferred_date: input.preferredDate,
    time_slot: input.timeSlot,
    message: input.message || null,
  });
  if (error) throw new Error(error.message);
}
