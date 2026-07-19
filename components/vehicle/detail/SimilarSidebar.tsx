import React from "react";
import Link from "next/link";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { npr } from "./format";

/**
 * "You might also like" rail — the similar-price recommendations computed in
 * app/vehicle/[id]/page.tsx. Stacks below the main content on mobile.
 */
export function SimilarSidebar({ items }: { items: ExtendedVehicle[] }) {
  if (items.length === 0) return null;
  return (
    <aside>
      <h2 className="text-lg font-extrabold tracking-tight text-blue-950">You might also like</h2>
      <div className="mt-4 space-y-4">
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/vehicle/${s.id}`}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex h-20 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1.5">
              <img src={s.images[0]} alt={`${s.brand} ${s.model}`} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-400">{s.brand}</div>
              <div className="truncate text-sm font-extrabold text-blue-950">{s.model}</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{npr(s.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
