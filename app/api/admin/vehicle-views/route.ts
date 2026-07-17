import { NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { recordAdminView, listAdminViews } from "@/lib/admin-vehicle-views";

// Recent admin views for the dashboard.
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const data = await listAdminViews();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load views." },
      { status: 500 }
    );
  }
}

// Record an admin view (called when an admin opens a vehicle in the panel).
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
  const vehicleName = typeof body.vehicleName === "string" ? body.vehicleName : "";
  if (!vehicleId || !vehicleName) {
    return NextResponse.json(
      { error: "vehicleId and vehicleName are required." },
      { status: 400 }
    );
  }

  await recordAdminView({
    adminId: admin.id,
    adminEmail: admin.email,
    vehicleId,
    vehicleName,
  });
  return NextResponse.json({ ok: true });
}
