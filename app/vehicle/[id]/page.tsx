import { getVehicleByIdAsync, getVehiclesAsync } from "@/lib/vehicles-db";
import { calculateNepalOnRoadPrice } from "@/lib/tax-engine";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import VehicleDetail from "@/components/vehicle/VehicleDetail";
import { getAdminSession } from "@/lib/admin-auth";
import { recordAdminView } from "@/lib/admin-vehicle-views";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // id may be a real vehicles.id uuid or a slug — resolve either to the DB row
  // so downstream bookings use the canonical vehicles.id uuid.
  const vehicle = await getVehicleByIdAsync(id);

  if (!vehicle) {
    notFound();
  }

  // If an admin (custom cookie session) is viewing, log it to the admin panel.
  // recordAdminView is best-effort and swallows its own errors.
  const adminSession = await getAdminSession();
  if (adminSession) {
    await recordAdminView({
      adminId: adminSession.id,
      adminEmail: adminSession.email,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.variant}`,
    });
  }

  const taxData = calculateNepalOnRoadPrice({
    category: vehicle.fuel === "Electric" ? "EV" : "ICE_" + vehicle.type,
    engineCc: vehicle.batteryKwh || 0,
    basePriceNPR: vehicle.price,
  });

  // Rivals: same fuel type, same brand first, then closest by price.
  const similar = (await getVehiclesAsync())
    .filter((x) => x.id !== vehicle.id && x.fuel === vehicle.fuel)
    .sort(
      (a, b) =>
        (a.brand === vehicle.brand ? 0 : 1) - (b.brand === vehicle.brand ? 0 : 1) ||
        Math.abs(a.price - vehicle.price) - Math.abs(b.price - vehicle.price)
    )
    .slice(0, 4);

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col">
      <SiteHeader active="find" />

      <div className="flex-grow">
        <VehicleDetail vehicle={vehicle} tax={taxData} similar={similar} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-12 w-full text-center flex flex-col gap-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">EV Price List</Link>
          <Link href="/" className="hover:text-blue-600 transition-colors">Electric Cars</Link>
          <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare EVs</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">EMI Calculator</Link>
          <Link href="/used" className="hover:text-blue-600 transition-colors">Used EVs</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Brands</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">About</Link>
        </div>
        <div className="text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          Copyright © 2026 SaaS Nepal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
