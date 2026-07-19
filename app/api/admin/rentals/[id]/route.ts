import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { RENTAL_COLUMNS, pick } from "@/lib/admin-data";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const row = pick(body, RENTAL_COLUMNS);
  // Keep rentals on this surface: never let an edit flip the listing type.
  row.listing_type = "rent";
  row.updated_at = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("used_listings")
    .update(row)
    .eq("id", id)
    .eq("listing_type", "rent")
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Rental not found." }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("used_listings")
    .delete()
    .eq("id", id)
    .eq("listing_type", "rent");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
