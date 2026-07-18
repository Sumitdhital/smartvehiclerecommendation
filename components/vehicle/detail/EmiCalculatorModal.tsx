"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { getVehiclesCached } from "@/lib/vehicles-db";
import {
  npr,
  computeEmi,
  EMI_RATE,
  EMI_MIN_RATE,
  EMI_MAX_RATE,
  EMI_RATE_STEP,
  EMI_MIN_DOWN_PCT,
  EMI_MAX_DOWN_PCT,
  EMI_DEFAULT_DOWN_PCT,
  EMI_MIN_YEARS,
  EMI_MAX_YEARS,
  EMI_YEARS,
} from "./format";
import { EmiBreakdownModal } from "./EmiBreakdownModal";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The vehicle whose price seeds the calculator (also its selected variant). */
  vehicle: ExtendedVehicle;
}

/** Card label used for each variant, e.g. "Atto 1 Dynamic". */
function variantLabel(v: ExtendedVehicle): string {
  const variant = (v.variant || "").trim();
  return variant ? `${v.model} ${variant}` : v.model;
}

const rateLabel = (r: number) => (Number.isInteger(r) ? String(r) : r.toFixed(1));

/**
 * Interactive EMI calculator modal (see screenshot2). Sources sibling variants
 * from the shared catalog (same brand + model), lets the buyer tweak interest
 * rate / down payment / tenure, and hands the same inputs to the breakdown modal.
 */
export function EmiCalculatorModal({ open, onClose, vehicle }: Props) {
  const [variants, setVariants] = useState<ExtendedVehicle[]>([vehicle]);
  const [selectedId, setSelectedId] = useState(vehicle.id);
  const [rate, setRate] = useState(EMI_RATE);
  const [downPct, setDownPct] = useState(EMI_DEFAULT_DOWN_PCT);
  const [years, setYears] = useState(EMI_YEARS);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset the selected variant whenever the modal is (re)opened for a vehicle.
  useEffect(() => {
    if (!open) return;
    setSelectedId(vehicle.id);
  }, [open, vehicle.id]);

  // Pull every catalog row sharing this vehicle's brand + model as its variants.
  useEffect(() => {
    let alive = true;
    getVehiclesCached().then((all) => {
      if (!alive) return;
      const brand = vehicle.brand.toLowerCase();
      const model = vehicle.model.toLowerCase();
      const siblings = all.filter(
        (v) => v.brand.toLowerCase() === brand && v.model.toLowerCase() === model
      );
      // Guarantee the current vehicle is present + de-duplicated by id.
      const byId = new Map<string, ExtendedVehicle>();
      for (const v of [vehicle, ...siblings]) if (!byId.has(v.id)) byId.set(v.id, v);
      setVariants(Array.from(byId.values()));
    });
    return () => {
      alive = false;
    };
  }, [vehicle]);

  // Close on Escape; focus the dialog when it opens.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const selected = variants.find((v) => v.id === selectedId) ?? vehicle;
  const calc = useMemo(
    () => computeEmi(selected.price, downPct, rate, years),
    [selected.price, downPct, rate, years]
  );

  if (!open) return null;

  const stepRate = (dir: 1 | -1) =>
    setRate((r) => {
      const next = Math.round((r + dir * EMI_RATE_STEP) * 10) / 10;
      return Math.min(EMI_MAX_RATE, Math.max(EMI_MIN_RATE, next));
    });

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        onMouseDown={onClose}
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none duration-150 animate-in fade-in zoom-in-95 motion-reduce:animate-none"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`EMI Calculator for ${vehicle.brand} ${vehicle.model}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5 sm:p-6">
            <h3 className="text-lg font-extrabold tracking-tight text-blue-950 sm:text-xl">
              EMI Calculator - {vehicle.brand} {vehicle.model}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mt-1 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 pb-6 sm:px-6">
            <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
              {/* EMI headline */}
              <p className="text-xs font-semibold text-slate-400">EMI Monthly Payment</p>
              <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {npr(calc.emi)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">Down Payment ({downPct}%)</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{npr(calc.down)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Total Interest</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{npr(calc.totalInterest)}</p>
                </div>
              </div>

              <div className="my-5 border-t border-slate-100" />

              {/* Variant selector */}
              <p className="text-sm font-bold text-slate-900">Select Variant</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {variants.map((v) => {
                  const active = v.id === selectedId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedId(v.id)}
                      aria-pressed={active}
                      className={`rounded-xl px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-2 border-slate-900 bg-slate-50"
                          : "border border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{variantLabel(v)}</div>
                      <div className="mt-0.5 text-xs font-medium text-slate-400">{npr(v.price)}</div>
                    </button>
                  );
                })}
              </div>

              {/* Interest rate stepper */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-900">Interest Rate</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => stepRate(-1)}
                      aria-label="Decrease interest rate"
                      className="flex h-9 w-10 items-center justify-center rounded-l-xl text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      disabled={rate <= EMI_MIN_RATE}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-slate-900">{rateLabel(rate)}</span>
                    <button
                      type="button"
                      onClick={() => stepRate(1)}
                      aria-label="Increase interest rate"
                      className="flex h-9 w-10 items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      disabled={rate >= EMI_MAX_RATE}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-sm font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Down payment slider */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Down Payment</span>
                  <span className="text-sm font-bold text-slate-900">{downPct}%</span>
                </div>
                <input
                  type="range"
                  min={EMI_MIN_DOWN_PCT}
                  max={EMI_MAX_DOWN_PCT}
                  step={5}
                  value={downPct}
                  onChange={(e) => setDownPct(Number(e.target.value))}
                  aria-label="Down payment percentage"
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                />
              </div>

              {/* Loan period slider */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Loan Period</span>
                  <span className="text-sm font-bold text-slate-900">{years} Years</span>
                </div>
                <input
                  type="range"
                  min={EMI_MIN_YEARS}
                  max={EMI_MAX_YEARS}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  aria-label="Loan period in years"
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                />
              </div>

              {/* CTA → breakdown */}
              <button
                type="button"
                onClick={() => setShowBreakdown(true)}
                className="mt-7 w-full rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
              >
                View Full Payment Breakdown
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmiBreakdownModal
        open={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        price={selected.price}
        downPct={downPct}
        rate={rate}
        years={years}
      />
    </>
  );
}
