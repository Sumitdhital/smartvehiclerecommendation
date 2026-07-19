"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { npr, computeEmi } from "./format";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Selected variant price the schedule is computed from. */
  price: number;
  downPct: number;
  rate: number;
  years: number;
}

const COLORS = {
  down: "#1e293b", // slate-800
  interest: "#dc2626", // red-600
  loan: "#2563eb", // blue-600
};

/**
 * Pure-SVG donut: three arcs whose sweep is proportional to each segment's
 * share of the total payment. No chart library — segments are drawn with
 * stroke-dasharray on a rotated circle, with a small white gap between them.
 */
function Donut({ down, interest, loan }: { down: number; interest: number; loan: number }) {
  const total = down + interest + loan || 1;
  const segments = [
    { value: down, color: COLORS.down },
    { value: loan, color: COLORS.loan },
    { value: interest, color: COLORS.interest },
  ];

  const r = 40;
  const c = 2 * Math.PI * r;
  const gap = 2; // small white separation between arcs, in path units

  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-40 w-40" role="img" aria-label="Payment breakdown chart">
      {segments.map((s, i) => {
        const frac = s.value / total;
        const len = Math.max(0, frac * c - gap);
        const dashOffset = -offset * c;
        offset += frac;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={14}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
          />
        );
      })}
    </svg>
  );
}

/**
 * EMI payment breakdown modal (see screenshot1). Recomputes the amortization
 * from the calculator's inputs so its figures reconcile exactly, renders the
 * donut split + a color-dot legend, and a year-wise amortization table.
 */
export function EmiBreakdownModal({ open, onClose, price, downPct, rate, years }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const calc = useMemo(
    () => computeEmi(price, downPct, rate, years),
    [price, downPct, rate, years]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const legend = [
    { label: "Down Payment", color: COLORS.down, text: "text-slate-800" },
    { label: "Interest", color: COLORS.interest, text: "text-red-600" },
    { label: "Loan Amount", color: COLORS.loan, text: "text-blue-600" },
  ];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none duration-150 animate-in fade-in zoom-in-95 motion-reduce:animate-none"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="EMI Payment Breakdown"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6">
          <h3 className="text-lg font-extrabold tracking-tight text-blue-950 sm:text-xl">
            EMI Payment Breakdown
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
          {/* Summary + donut */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-400">Monthly Payment</p>
              <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-blue-950">{npr(calc.emi)}</p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Down Payment</p>
                  <p className="mt-0.5 text-lg font-bold text-blue-950">{npr(calc.down)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Interest</p>
                  <p className="mt-0.5 text-lg font-bold text-blue-950">{npr(calc.totalInterest)}</p>
                </div>
              </div>

              <div className="my-5 border-t border-slate-100" />

              <p className="text-sm font-medium text-slate-400">Total Payment for {years} years</p>
              <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-blue-950">{npr(calc.totalPayment)}</p>
            </div>

            {/* Donut + legend */}
            <div className="flex items-center justify-center gap-5">
              <div className="flex h-44 w-44 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200">
                <Donut down={calc.down} interest={calc.totalInterest} loan={calc.loan} />
              </div>
              <ul className="space-y-2.5">
                {legend.map((l) => (
                  <li key={l.label} className="flex items-center gap-2">
                    <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className={`text-sm font-semibold ${l.text}`}>{l.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Year-wise breakdown */}
          <p className="mt-8 text-base font-bold text-slate-900">Year-wise Breakdown</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Total Payment</th>
                  <th className="px-4 py-3">Loan Amount</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {calc.rows.map((row, i) => (
                  <tr
                    key={row.year}
                    className={`text-sm font-medium text-blue-900/80 ${i % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                  >
                    <td className="px-4 py-3.5 font-bold text-blue-700">{row.year}</td>
                    <td className="px-4 py-3.5">{npr(row.totalPayment)}</td>
                    <td className="px-4 py-3.5">{npr(row.principal)}</td>
                    <td className="px-4 py-3.5">{npr(row.interest)}</td>
                    <td className="px-4 py-3.5">{npr(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
