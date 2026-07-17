// lib/admin-vehicle-views.ts — server-only data layer for admin car views.
// Rows live in public.admin_vehicle_views. Admins use the custom admin_session
// cookie (not Supabase Auth), so these are written/read exclusively with the
// service-role client, which bypasses RLS.

import { getSupabaseAdmin } from "./supabase";

export interface AdminVehicleView {
  id: string;
  admin_id: string;
  admin_email: string;
  vehicle_id: string;
  vehicle_name: string;
  viewed_at: string;
}

export interface RecordAdminViewInput {
  adminId: string;
  adminEmail: string;
  vehicleId: string;
  vehicleName: string;
}

/** Upsert an admin's view of a vehicle, bumping viewed_at on repeat. Best-effort. */
export async function recordAdminView(input: RecordAdminViewInput): Promise<void> {
  const name = input.vehicleName.trim();
  if (!input.adminId || !input.vehicleId || !name) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("admin_vehicle_views").upsert(
      {
        admin_id: input.adminId,
        admin_email: input.adminEmail,
        vehicle_id: input.vehicleId,
        vehicle_name: name,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "admin_id,vehicle_id" }
    );
  } catch {
    // Best-effort — never block a page or request.
  }
}

/** Most recently viewed vehicles across all admins, newest first. */
export async function listAdminViews(limit = 50): Promise<AdminVehicleView[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_vehicle_views")
    .select("id, admin_id, admin_email, vehicle_id, vehicle_name, viewed_at")
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminVehicleView[];
}
