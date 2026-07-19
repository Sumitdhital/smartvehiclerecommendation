"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import type { TaxBreakdown } from "@/lib/tax-engine";
import { I } from "./icons";
import { npr, psToKw, monthlyEmi, EMI_DEFAULT_DOWN_PCT, EMI_RATE, EMI_YEARS } from "./format";
import { EmiCalculatorModal } from "./EmiCalculatorModal";

/**
 * Compact EMI teaser on the price card — a "from Rs. X/mo" line plus a button
 * that opens the full reference EMI calculator modal (Task T11). The monthly
 * figure uses the calculator's defaults (40% down, 8.5% over 5 years).
 */
function EmiTeaser({ vehicle }: { vehicle: ExtendedVehicle }) {
  const [open, setOpen] = useState(false);

  const loan = vehicle.price * (1 - EMI_DEFAULT_DOWN_PCT / 100);
  const emi = monthlyEmi(loan);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">EMI starting from</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-extrabold tracking-tight text-blue-600">{npr(emi)}</span>
            <span className="text-xs font-semibold text-slate-400">/mo</span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
            {EMI_DEFAULT_DOWN_PCT}% down · {EMI_YEARS}yr @ {EMI_RATE}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100"
        >
          Open EMI Calculator
        </button>
      </div>

      <EmiCalculatorModal open={open} onClose={() => setOpen(false)} vehicle={vehicle} />
    </div>
  );
}

/**
 * Right half of the hero: brand + model, big NPR price, the tax-engine on-road
 * estimate, the EMI calculator, and a quick spec chip row (battery/motor/range
 * for EVs; fuel/power/range for ICE).
 */
export function PriceCard({ vehicle: v, tax }: { vehicle: ExtendedVehicle; tax: TaxBreakdown }) {
  const isEV = v.fuel === "Electric";
  const motorKw = isEV ? psToKw(v.horsepower) : null;

  const chips = isEV
    ? [
        { icon: I.battery, label: "Battery", value: `${v.batteryKwh} kWh` },
        { icon: I.bolt, label: "Motor", value: `${motorKw} kW` },
        { icon: I.range, label: "Range", value: `${v.rangeKm} km` },
      ]
    : [
        { icon: I.bolt, label: "Fuel", value: v.fuel },
        { icon: I.gauge, label: "Power", value: `${v.horsepower} PS` },
        { icon: I.range, label: "Range", value: v.rangeKm ? `${v.rangeKm} km` : "—" },
      ];

  return (
    <div className="p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-500">{v.brand}</span>
        {v.usedCount ? (
          <Link
            href="/used"
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
          >
            <I.car className="h-3.5 w-3.5" />
            {v.usedCount} Used {isEV ? "EVs" : "Cars"} for sale
            <I.chevronR className="h-3 w-3" />
          </Link>
        ) : null}
      </div>

      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl">{v.model}</h2>
      <div className="mt-3 text-3xl font-extrabold tracking-tight text-blue-950 sm:text-4xl">{npr(v.price)}</div>
      <p className="mt-1.5 text-xs font-medium text-slate-500">
        Est. on-road <span className="font-bold text-slate-700">{npr(tax.totalOnRoadPrice)}</span>
        <span className="text-slate-400"> · incl. customs, excise, VAT &amp; road tax</span>
      </p>

      <div className="mt-5">
        <EmiTeaser vehicle={v} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {chips.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <s.icon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">{s.label}</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
