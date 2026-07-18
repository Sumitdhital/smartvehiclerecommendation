import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { ADMIN_COLUMNS, pick } from "@/lib/admin-data";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const row = pick(body, ADMIN_COLUMNS) as Record<string, unknown> & { email?: string };
  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: "No editable fields provided." }, { status: 400 });
  }
  if (typeof row.email === "string") row.email = row.email.trim().toLowerCase();
  row.updated_at = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admins")
    .update(row)
    .eq("id", id)
    .select("id, name, email, password, created_at")
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "An admin with that email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const { id } = await params;

  if (id === session.id) {
    return NextResponse.json({ error: "You can't delete the account you're signed in with." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { count } = await supabase.from("admins").select("id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: "At least one admin must remain." }, { status: 400 });
  }

  const { error } = await supabase.from("admins").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
