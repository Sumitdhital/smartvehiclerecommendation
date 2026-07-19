import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { VEHICLES, USED_LISTINGS } from "@/lib/vehicles-db";
import { vehicleToRow, usedToRow } from "@/lib/admin-data";

// Loads the static catalog into the database. Idempotent for vehicles
// (upsert on slug); used listings are only seeded when the table is empty.
export async function POST() {
  if (!(await requireAdmin())) return unauthorized();
  const supabase = getSupabaseAdmin();

  // Vehicles — upsert on slug so re-running won't create duplicates.
  const vehicleRows = VEHICLES.map(vehicleToRow);
  const { error: vErr, count: vCount } = await supabase
    .from("vehicles")
    .upsert(vehicleRows, { onConflict: "slug", count: "exact" });
  if (vErr) return NextResponse.json({ error: `Vehicles: ${vErr.message}` }, { status: 500 });

  // Used listings — no natural key, so only seed into an empty table.
  const { count: existingUsed } = await supabase
    .from("used_listings")
    .select("id", { count: "exact", head: true });

  let usedInserted = 0;
  if ((existingUsed ?? 0) === 0) {
    const usedRows = USED_LISTINGS.map(usedToRow);
    const { error: uErr } = await supabase.from("used_listings").insert(usedRows);
    if (uErr) return NextResponse.json({ error: `Used listings: ${uErr.message}` }, { status: 500 });
    usedInserted = usedRows.length;
  }

  return NextResponse.json({
    ok: true,
    vehicles: vCount ?? vehicleRows.length,
    usedListingsInserted: usedInserted,
    usedListingsSkipped: (existingUsed ?? 0) > 0,
  });
}
