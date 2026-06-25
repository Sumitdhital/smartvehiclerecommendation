import { getSupabaseAdmin } from "@/lib/supabase";
import { calculateNepalOnRoadPrice } from "@/lib/tax-engine";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VehicleActionButtons, VehiclePageGuard } from "@/components/vehicle-action-buttons";
import React from "react";

export const revalidate = 3600;

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !vehicle) {
    notFound();
  }

  const taxData = calculateNepalOnRoadPrice({
    category: vehicle.type === "Electric" ? "EV" : "ICE_" + vehicle.type,
    engineCc: vehicle.engine_cc || 0,
    basePriceNPR: vehicle.price,
  });

  const parsedFeatures: string[] = Array.isArray(vehicle.key_features)
    ? vehicle.key_features
    : typeof vehicle.key_features === "string"
    ? JSON.parse(vehicle.key_features)
    : [];

  const engineLabel = vehicle.fuel === "Electric" ? "kW" : "cc";
  const mileageLabel = vehicle.fuel === "Electric" ? "km" : "km/l";

  return (
    <VehiclePageGuard>
      <main className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <Link href="/results" className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-2">
            &larr; Back to Results
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-semibold tracking-wide mb-4">
                  {vehicle.brand}
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{vehicle.model}</h1>
                <p className="text-xl text-slate-300">{vehicle.variant}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 text-center min-w-[250px]">
                <p className="text-slate-300 text-sm uppercase tracking-wider mb-1">On-Road Price (NPR)</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {Math.round(taxData.totalOnRoadPrice).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left: Specs */}
              <div className="lg:col-span-2 space-y-10">
                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4">Key Specifications</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <SpecItem label="Type" value={vehicle.type} />
                    <SpecItem label="Fuel" value={vehicle.fuel} />
                    <SpecItem label="Engine / Motor" value={vehicle.engine_cc + " " + engineLabel} />
                    <SpecItem label="Power" value={vehicle.horsepower + " bhp"} />
                    <SpecItem label="Torque" value={vehicle.torque + " Nm"} />
                    <SpecItem label="Transmission" value={vehicle.transmission} />
                    <SpecItem label="Mileage / Range" value={vehicle.mileage + " " + mileageLabel} />
                    <SpecItem label="Ground Clearance" value={vehicle.ground_clearance + " mm"} />
                    <SpecItem label="Seating" value={vehicle.seating_capacity + " Persons"} />
                    <SpecItem label="Boot Space" value={vehicle.boot_space + " Liters"} />
                    <SpecItem label="Safety Rating" value={vehicle.safety_rating + " Stars"} />
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4">Highlighted Features</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-700">
                        <svg className="text-emerald-500 w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Right: Tax Breakdown & Actions */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4 text-lg">Nepal Tax Breakdown</h3>
                  <div className="space-y-3 text-sm">
                    <TaxRow label="Base Price (Ex-Showroom)" amount={taxData.basePrice} />
                    <TaxRow label="Customs Duty" amount={taxData.customsDuty} />
                    <TaxRow label="Excise Duty" amount={taxData.exciseDuty} />
                    <div className="border-b border-slate-200 pb-3">
                      <TaxRow label="VAT (13%) + Road Tax" amount={taxData.vat + taxData.roadTax} />
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-base pt-1">
                      <span>Total On-Road</span>
                      <span className="text-emerald-600">{"NPR " + Math.round(taxData.totalOnRoadPrice).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <VehicleActionButtons vehicle={vehicle} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </VehiclePageGuard>
  );
}

function SpecItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function TaxRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium">{"NPR " + Math.round(amount).toLocaleString()}</span>
    </div>
  );
}
