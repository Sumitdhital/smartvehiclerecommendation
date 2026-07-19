import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { RENTAL_COLUMNS, RENTAL_REQUIRED, pick, missingRequired } from "@/lib/admin-data";

// Rentals are `used_listings` rows with listing_type = 'rent'. This surface
// filters to those rows and forces listing_type on create so the two admin
// surfaces (used / rentals) never overlap.

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("used_listings")
    .select("*")
    .eq("listing_type", "rent")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const row = pick(body, RENTAL_COLUMNS);
  row.listing_type = "rent";

  const missing = missingRequired(row, RENTAL_REQUIRED);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("used_listings").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
