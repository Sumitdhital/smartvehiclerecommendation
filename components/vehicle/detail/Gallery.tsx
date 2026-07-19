"use client";

import React, { useState } from "react";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { Card, StarRow } from "./primitives";
import { I } from "./icons";

/**
 * Left half of the hero: large gallery image, a rating pill, the primary
 * "Book a Test Drive" button, and a horizontally-scrolling thumbnail strip.
 * Gracefully collapses the strip/arrows when the vehicle has a single image.
 */
export function Gallery({
  vehicle: v,
  rating,
  reviewCount,
  onBookTestDrive,
}: {
  vehicle: ExtendedVehicle;
  rating: number;
  reviewCount: number;
  onBookTestDrive: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const count = v.images.length;
  const active = Math.min(idx, count - 1);

  const step = (dir: number) => setIdx((i) => Math.max(0, Math.min(count - 1, i + dir)));

  return (
    <div className="flex flex-col">
      <div className="relative flex flex-col bg-slate-50 p-5">
        {/* rating pill — top-right over the image */}
        <div className="absolute right-5 top-5 z-10 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <span className="text-sm font-extrabold text-slate-900">{rating.toFixed(1)}</span>
          <StarRow rating={rating} />
          <span className="text-xs font-semibold text-slate-400">({reviewCount})</span>
        </div>

        <div
          className="flex flex-1 items-center justify-center py-4 outline-none"
          tabIndex={0}
          role="group"
          aria-label={`${v.brand} ${v.model} photo ${active + 1} of ${count}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
          }}
        >
          <img
            src={v.images[active]}
            alt={`${v.brand} ${v.model}`}
            className="max-h-56 max-w-full object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.18)]"
          />
        </div>

        {v.sold ? (
          <div className="inline-flex w-fit flex-col gap-0.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm">
            <span className="font-bold text-slate-500">Sold</span>
            <span className="text-xs font-semibold text-slate-400">Test drives are unavailable for this car.</span>
          </div>
        ) : (
          <button
            onClick={onBookTestDrive}
            className="inline-flex w-fit items-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
          >
            <I.calendar className="h-4 w-4" /> Book a Test Drive
          </button>
        )}
      </div>

      {/* thumbnail strip */}
      <div className="border-t border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Photos · {count}
          </span>
          {count > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => step(-1)}
                disabled={active === 0}
                aria-label="Previous photo"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <I.chevronL className="h-4 w-4" />
              </button>
              <button
                onClick={() => step(1)}
                disabled={active >= count - 1}
                aria-label="Next photo"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <I.chevronR className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {count > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {v.images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setIdx(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === active}
                className={`h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition-colors ${
                  i === active ? "border-blue-600" : "border-transparent hover:border-slate-300"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Local wrapper so the hero can nest gallery + price card inside one Card. */
export function HeroCard({ children }: { children: React.ReactNode }) {
  return <Card className="overflow-hidden">{children}</Card>;
}
