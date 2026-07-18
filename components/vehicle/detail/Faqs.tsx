import React from "react";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import type { TaxBreakdown } from "@/lib/tax-engine";
import { Card, CardTitle } from "./primitives";
import { I } from "./icons";
import { npr } from "./format";

export interface FaqItem { q: string; a: string }

/** Generates FAQ entries from the vehicle's real data + tax-engine on-road price. */
export function buildFaqs(v: ExtendedVehicle, tax: TaxBreakdown): FaqItem[] {
  const isEV = v.fuel === "Electric";
  const acChargeHrs = isEV && v.batteryKwh ? Math.ceil(v.batteryKwh / 7) : null;

  return [
    { q: `What is the price of ${v.brand} ${v.model} in Nepal?`, a: `The ${v.brand} ${v.model} ${v.variant} is priced at ${npr(v.price)} in Nepal. The estimated on-road price including customs, excise, VAT and road tax comes to ${npr(tax.totalOnRoadPrice)}.` },
    v.safetyRating ? { q: `What is the safety rating of the ${v.brand} ${v.model}?`, a: `The ${v.model} carries a ${v.safetyRating}-star safety rating${v.totalAirbags ? ` and comes with ${v.totalAirbags} airbags as standard` : ""}.` } : null,
    v.totalAirbags ? { q: `How many airbags are offered in the ${v.brand} ${v.model}?`, a: `The ${v.model} is equipped with ${v.totalAirbags} airbags.` } : null,
    { q: `What is the ground clearance of the ${v.brand} ${v.model}?`, a: `The ${v.model} offers ${v.groundClearance} mm of ground clearance — ${v.groundClearance >= 180 ? "well suited" : "adequate"} for Nepal's mixed road conditions.` },
    v.dimensions ? { q: `What are the dimensions of the ${v.brand} ${v.model}?`, a: `The ${v.model} measures ${v.dimensions.replaceAll("x", "×")} (L × W × H).` } : null,
    { q: `What is the seating capacity of the ${v.brand} ${v.model}?`, a: `The ${v.model} seats ${v.seatingCapacity} people${v.bootSpace ? ` and offers ${v.bootSpace} litres of boot space` : ""}.` },
    v.driveType ? { q: `What is the drive type of the ${v.brand} ${v.model}?`, a: `The ${v.model} comes with a ${v.driveType} drivetrain paired with a ${v.transmission.toLowerCase()} transmission.` } : null,
    isEV && v.rangeKm ? { q: `What is the driving range of the ${v.brand} ${v.model} EV?`, a: `The ${v.model} delivers a claimed range of ${v.rangeKm} km on a full charge of its ${v.batteryKwh} kWh battery pack.` } : null,
    isEV && v.batteryKwh ? { q: `What is the battery capacity of the ${v.brand} ${v.model}?`, a: `The ${v.model} packs a ${v.batteryKwh} kWh battery.` } : null,
    isEV && acChargeHrs ? { q: `How long does it take to charge the ${v.brand} ${v.model}?`, a: `On a 7 kW home AC charger a full charge takes roughly ${acChargeHrs} hours. DC fast charging via CCS2 at a public station is significantly quicker.` } : null,
    !isEV && v.mileage ? { q: `What is the mileage of the ${v.brand} ${v.model}?`, a: `The ${v.model} returns a claimed fuel economy of around ${v.mileage} km/l.` } : null,
  ].filter(Boolean) as FaqItem[];
}

export function Faqs({ items }: { items: FaqItem[] }) {
  return (
    <Card className="p-5 sm:p-7">
      <CardTitle title="FAQs" />
      <div className="space-y-3">
        {items.map((it) => (
          <details key={it.q} className="group rounded-xl border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <I.chevronR className="h-3.5 w-3.5 flex-shrink-0 text-blue-950 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
              <span className="text-sm font-bold text-blue-950 sm:text-base">{it.q}</span>
            </summary>
            <p className="px-5 pb-4 pl-[3.1rem] text-sm font-medium leading-relaxed text-slate-600">{it.a}</p>
          </details>
        ))}
      </div>
    </Card>
  );
}
