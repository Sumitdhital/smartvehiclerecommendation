import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { USED_COLUMNS, USED_REQUIRED, pick, missingRequired } from "@/lib/admin-data";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const supabase = getSupabaseAdmin();
  // Sell-only surface — rent-type listings are managed under /admin/rentals.
  const { data, error } = await supabase
    .from("used_listings")
    .select("*")
    .neq("listing_type", "rent")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const row = pick(body, USED_COLUMNS);

  const missing = missingRequired(row, USED_REQUIRED);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("used_listings").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
