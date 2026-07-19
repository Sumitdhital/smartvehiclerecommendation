"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { Card, CardTitle } from "./primitives";
import { npr, psToKw, monthlyEmi } from "./format";

function CompareColumn({ car }: { car: ExtendedVehicle }) {
  const isEV = car.fuel === "Electric";
  const rows: [string, React.ReactNode][] = [
    ["Price:", <span key="p" className="text-base font-extrabold text-blue-600">{npr(car.price)}</span>],
    ["EMI:", `${npr(monthlyEmi(car.price * 0.6))}/month`],
    ...(isEV && car.batteryKwh ? [["Battery Capacity:", `${car.batteryKwh} kWh`] as [string, React.ReactNode]] : []),
    ["Range:", car.rangeKm ? `${car.rangeKm} Km` : "N/A"],
    ["Motor Power:", isEV ? `${psToKw(car.horsepower)} kW` : `${car.horsepower} PS`],
    ["Torque:", car.torqueLabel ?? `${car.torque} Nm`],
    ["Ground Clearance:", `${car.groundClearance} mm`],
    ["Boot Space:", car.bootSpace ? `${car.bootSpace} Liters` : "N/A"],
    ["Safety Rating:", car.safetyRating ? `${car.safetyRating} Star` : "N/A"],
    ["Dimensions:", car.dimensions ? car.dimensions.replaceAll("x", "×") : "N/A"],
    ["Drive Type:", car.driveType ?? "N/A"],
    ["Seating Capacity:", `${car.seatingCapacity} People`],
    ["Total Airbags:", car.totalAirbags ?? "N/A"],
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-extrabold tracking-tight text-blue-950">{car.brand} {car.model}</h3>
      <div className="flex h-36 items-center justify-center py-2">
        <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="max-h-full max-w-full object-contain" />
      </div>
      <dl>
        {rows.map(([k, val]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
            <dt className="text-xs font-medium text-slate-500">{k}</dt>
            <dd className="text-right text-sm font-bold text-slate-800">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * "Compare <name> with similar cars" — this vehicle against a similar-price
 * recommendation, with a tab row to swap the rival. Links to the /compare tool.
 */
export function CompareStrip({ vehicle, rivals }: { vehicle: ExtendedVehicle; rivals: ExtendedVehicle[] }) {
  const [idx, setIdx] = useState(0);
  if (rivals.length === 0) return null;
  const rival = rivals[Math.min(idx, rivals.length - 1)];

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CardTitle title={`Compare ${vehicle.brand} ${vehicle.model} with similar cars`} />
        <Link href="/compare" className="text-sm font-bold text-blue-600 hover:text-blue-700">
          Full comparison →
        </Link>
      </div>
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rivals.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              i === idx ? "bg-white text-blue-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            vs {r.brand} {r.model}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CompareColumn car={vehicle} />
        <CompareColumn car={rival} />
      </div>
    </Card>
  );
}
