import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { ADMIN_COLUMNS, ADMIN_REQUIRED, pick, missingRequired } from "@/lib/admin-data";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admins")
    .select("id, name, email, password, created_at")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const row = pick(body, ADMIN_COLUMNS) as { name?: string; email?: string; password?: string };

  const missing = missingRequired(row, ADMIN_REQUIRED);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }
  if (row.email) row.email = row.email.trim().toLowerCase();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admins")
    .insert(row)
    .select("id, name, email, password, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "An admin with that email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
