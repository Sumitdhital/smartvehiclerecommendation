import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";

// Admin notifications are read/written only here, with the service-role key —
// the admin_notifications table is RLS-locked to everything else.

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id, type, title, body, read, created_at")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count all unread (not just the latest 12) so the badge is accurate.
  const { count, error: countError } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const notifications = (data ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    read: r.read,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ notifications, unreadCount: count ?? 0 });
}

export async function POST() {
  if (!(await requireAdmin())) return unauthorized();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
