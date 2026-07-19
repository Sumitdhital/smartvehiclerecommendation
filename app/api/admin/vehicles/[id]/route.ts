import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { VEHICLE_COLUMNS, pick } from "@/lib/admin-data";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const row = pick(body, VEHICLE_COLUMNS);
  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: "No editable fields provided." }, { status: 400 });
  }
  row.updated_at = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("vehicles").update(row).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
