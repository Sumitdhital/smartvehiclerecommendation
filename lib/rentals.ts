// lib/rentals.ts — data layer for rental requests on rent-type used_listings.
// Inserting a row triggers a DB notification to the listing owner
// (trg_notify_owner_on_rental_request), self-suppressed when the requester
// is also the owner.

import { supabase } from "./supabase";

export interface RentalRequestInput {
  listingId: string;
  fullName: string;
  phone: string;
  /** yyyy-mm-dd */
  startDate: string;
  /** yyyy-mm-dd */
  endDate: string;
  message?: string;
}

/** Inserts a rental request owned by the signed-in user (RLS enforces requester_id). */
export async function createRentalRequest(input: RentalRequestInput, userId: string): Promise<void> {
  const { error } = await supabase.from("rental_requests").insert({
    listing_id: input.listingId,
    requester_id: userId,
    full_name: input.fullName,
    phone: input.phone,
    start_date: input.startDate,
    end_date: input.endDate,
    message: input.message || null,
  });
  if (error) throw new Error(error.message);
}
