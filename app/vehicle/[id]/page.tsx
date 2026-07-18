import { getVehicleByIdAsync, getVehiclesAsync, type ExtendedVehicle } from "@/lib/vehicles-db";
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

  // "You might also like" recommendations: vehicles within ±20% of this price,
  // same category prioritised, then same body type, then closest by price.
  // Exclude self; cap at 5. If the ±20% band is thin, widen to the nearest-priced
  // rivals so the rail always has options.
  const all = await getVehiclesAsync();
  const band = vehicle.price * 0.2;
  const nearestByPrice = (a: ExtendedVehicle, b: ExtendedVehicle) =>
    Math.abs(a.price - vehicle.price) - Math.abs(b.price - vehicle.price);

  const rank = (a: ExtendedVehicle, b: ExtendedVehicle) => {
    const cat = (a.category === vehicle.category ? 0 : 1) - (b.category === vehicle.category ? 0 : 1);
    if (cat !== 0) return cat;
    const type = (a.type === vehicle.type ? 0 : 1) - (b.type === vehicle.type ? 0 : 1);
    if (type !== 0) return type;
    return nearestByPrice(a, b);
  };

  const inBand = all
    .filter((x) => x.id !== vehicle.id && Math.abs(x.price - vehicle.price) <= band)
    .sort(rank);

  let similar = inBand.slice(0, 5);
  if (similar.length < 4) {
    const picked = new Set(similar.map((s) => s.id));
    const fillers = all
      .filter((x) => x.id !== vehicle.id && !picked.has(x.id))
      .sort(nearestByPrice);
    similar = [...similar, ...fillers].slice(0, 5);
  }

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
