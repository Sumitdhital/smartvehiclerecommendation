import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { attachSessionCookie } from "@/lib/admin-auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, name, email, password")
    .eq("email", email)
    .maybeSingle();

  // Plaintext password comparison (per requirement).
  if (error || !admin || admin.password !== password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ id: admin.id, name: admin.name, email: admin.email });
  return attachSessionCookie(res, { id: admin.id, email: admin.email, name: admin.name });
}
