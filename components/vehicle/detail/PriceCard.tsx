"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import type { TaxBreakdown } from "@/lib/tax-engine";
import { I } from "./icons";
import { npr, psToKw, monthlyEmi, EMI_RATE, EMI_YEARS } from "./format";

/**
 * Inline EMI calculator kept from the original hero. Task T11 replaces this
 * with a dedicated modal — until then it stays as the reference shows it.
 */
function EmiCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(40);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const down = price * (downPct / 100);
  const loan = price - down;
  const emi = monthlyEmi(loan);
  const totalPayable = emi * EMI_YEARS * 12;

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">EMI Calculator</span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold tracking-tight text-blue-600">{npr(emi)}</span>
          <span className="text-xs font-semibold text-slate-400">/mo</span>
        </div>
        <button
          onClick={() => setShowBreakdown((s) => !s)}
          aria-expanded={showBreakdown}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showBreakdown ? "Hide Breakdown" : "View Breakdown"}
        </button>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-500">
        {downPct}% down ({npr(down)}) · {EMI_YEARS}yr @ {EMI_RATE}%
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-[11px] font-bold text-slate-400">20%</span>
        <input
          type="range"
          min={20}
          max={80}
          step={5}
          value={downPct}
          onChange={(e) => setDownPct(Number(e.target.value))}
          aria-label="Down payment percentage"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
        />
        <span className="text-[11px] font-bold text-slate-400">80%</span>
      </div>

      <div className={`grid transition-all duration-200 motion-reduce:transition-none ${showBreakdown ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <dl className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 text-xs font-semibold">
            {[
              ["Down payment", npr(down)],
              ["Loan amount", npr(loan)],
              ["Total interest", npr(totalPayable - loan)],
              ["Total payable", npr(totalPayable + down)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-blue-950">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
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
        <EmiCalculator price={v.price} />
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
