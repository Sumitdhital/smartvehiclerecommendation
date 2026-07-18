import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";

// Admin → user feedback. Resolves the owner of a listing/vehicle and inserts a
// row into public.notifications (type 'admin_feedback'), which reaches the
// owner's notification bell instantly via Supabase realtime.
//
// POST body: { target: 'used_listing' | 'rental_listing' | 'vehicle', id, title, body }

type Target = "used_listing" | "rental_listing" | "vehicle";

const TARGETS: Record<Target, { table: string; ownerColumn: string }> = {
  used_listing: { table: "used_listings", ownerColumn: "user_id" },
  rental_listing: { table: "used_listings", ownerColumn: "user_id" },
  vehicle: { table: "vehicles", ownerColumn: "owner_id" },
};

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const target = body.target as Target;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";

  if (!target || !(target in TARGETS)) {
    return NextResponse.json({ error: "Invalid target." }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "Missing target id." }, { status: 400 });
  }
  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  const { table, ownerColumn } = TARGETS[target];
  const supabase = getSupabaseAdmin();

  const { data: row, error: lookupError } = await supabase
    .from(table)
    .select(ownerColumn)
    .eq("id", id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const ownerId = (row as unknown as Record<string, unknown>)[ownerColumn];
  if (!ownerId || typeof ownerId !== "string") {
    return NextResponse.json(
      { error: "This listing has no registered owner to notify." },
      { status: 404 }
    );
  }

  const { error: insertError } = await supabase.from("notifications").insert({
    user_id: ownerId,
    type: "admin_feedback",
    title,
    body: message,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
