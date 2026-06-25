"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { calculateNepalOnRoadPrice } from "@/lib/tax-engine";

const SPEC_ROWS = [
  { label: "Type", key: "type" },
  { label: "Fuel", key: "fuel" },
  { label: "Engine (CC/kW)", key: "engine_cc" },
  { label: "Horsepower (bhp)", key: "horsepower" },
  { label: "Torque (Nm)", key: "torque" },
  { label: "Mileage (km/l or km range)", key: "mileage" },
  { label: "Seating", key: "seating_capacity" },
  { label: "Transmission", key: "transmission" },
  { label: "Ground Clearance (mm)", key: "ground_clearance" },
  { label: "Boot Space (L)", key: "boot_space" },
  { label: "Safety Rating", key: "safety_rating" },
];

function parseFeatures(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return [raw]; }
  }
  return [];
}

export default function ComparePage() {
  const { compareVehicles, removeFromCompare, clearCompare, searchFilters } = useAppStore();
  const router = useRouter();

  // Redirect to home if no search has been done
  useEffect(() => {
    if (!searchFilters.budget) {
      router.replace("/");
    }
  }, [searchFilters.budget, router]);

  if (!searchFilters.budget) return null;

  if (compareVehicles.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">No Vehicles Selected for Comparison</h2>
        <p className="text-slate-500 mb-8">Add vehicles from the search results to compare their specs side-by-side.</p>
        <Button onClick={() => router.push("/results")} className="bg-indigo-600 hover:bg-indigo-700">Back to Results</Button>
      </div>
    );
  }

  const vehiclesWithTax = compareVehicles.map((v) => ({
    ...v,
    taxData: calculateNepalOnRoadPrice({
      category: v.type === "Electric" ? "EV" : "ICE_" + v.type,
      engineCc: v.engine_cc || 0,
      basePriceNPR: v.price,
    }),
  }));

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Compare Vehicles</h1>
            <p className="text-slate-500">Side-by-side specification and tax comparison</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={clearCompare}>Clear All</Button>
            <Button onClick={() => router.push("/results")} className="bg-indigo-600 hover:bg-indigo-700">Back to Results</Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-6 bg-slate-50 w-48 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-sm">Specs</span>
                </th>
                {vehiclesWithTax.map((v) => (
                  <th key={v.id} className="p-6 min-w-[240px] border-r border-slate-100 last:border-0 align-top relative">
                    <button
                      onClick={() => removeFromCompare(v.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                      </svg>
                    </button>
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mb-1">{v.brand}</p>
                    <h3 className="text-xl font-bold text-slate-900 pr-8">{v.model}</h3>
                    <p className="text-sm text-slate-500 mb-4">{v.variant}</p>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Est. On-Road Price</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {"NPR " + Math.round(v.taxData.totalOnRoadPrice).toLocaleString()}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SPEC_ROWS.map((row) => (
                <tr key={row.key} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 bg-slate-50 font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {row.label}
                  </td>
                  {vehiclesWithTax.map((v) => (
                    <td key={v.id + "-" + row.key} className="p-4 border-r border-slate-100 last:border-0 text-slate-600">
                      {v[row.key] !== undefined && v[row.key] !== null ? String(v[row.key]) : "N/A"}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 bg-slate-50 font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top">
                  Key Features
                </td>
                {vehiclesWithTax.map((v) => (
                  <td key={v.id + "-features"} className="p-4 border-r border-slate-100 last:border-0 align-top">
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {parseFeatures(v.key_features).map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 bg-slate-50 font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Base (Ex-Showroom)
                </td>
                {vehiclesWithTax.map((v) => (
                  <td key={v.id + "-base"} className="p-4 border-r border-slate-100 last:border-0 text-slate-500 font-mono text-sm">
                    {"NPR " + v.price.toLocaleString()}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 bg-slate-50 font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Customs Duty
                </td>
                {vehiclesWithTax.map((v) => (
                  <td key={v.id + "-customs"} className="p-4 border-r border-slate-100 last:border-0 text-slate-500 font-mono text-sm">
                    {"NPR " + Math.round(v.taxData.customsDuty).toLocaleString()}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 bg-slate-50 font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Excise Duty
                </td>
                {vehiclesWithTax.map((v) => (
                  <td key={v.id + "-excise"} className="p-4 border-r border-slate-100 last:border-0 text-slate-500 font-mono text-sm">
                    {"NPR " + Math.round(v.taxData.exciseDuty).toLocaleString()}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 bg-slate-50 font-medium text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  VAT (13%)
                </td>
                {vehiclesWithTax.map((v) => (
                  <td key={v.id + "-vat"} className="p-4 border-r border-slate-100 last:border-0 text-slate-500 font-mono text-sm">
                    {"NPR " + Math.round(v.taxData.vat).toLocaleString()}
                  </td>
                ))}
              </tr>

              <tr className="bg-emerald-50">
                <td className="p-4 bg-emerald-50 font-bold text-slate-900 sticky left-0 z-10 border-r border-emerald-100">
                  Total On-Road
                </td>
                {vehiclesWithTax.map((v) => (
                  <td key={v.id + "-total"} className="p-4 border-r border-emerald-100 last:border-0 text-emerald-700 font-bold font-mono">
                    {"NPR " + Math.round(v.taxData.totalOnRoadPrice).toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
