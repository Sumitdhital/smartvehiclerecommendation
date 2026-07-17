import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Creates an account server-side with the service-role key. The user is created
// already-confirmed, so signup works instantly without depending on the
// (rate-limited) default confirmation email. The client signs in right after.
export async function POST(req: Request) {
  let body: { email?: string; password?: string; fullName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and a password to continue." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Use at least 6 characters for your password." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const msg = error.message || "";
    if (/already|exists|registered|duplicate/i.test(msg)) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 }
      );
    }
    if (/valid email|invalid/i.test(msg)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    return NextResponse.json({ error: msg || "Could not create your account." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
