"use client";

import React, { useState } from "react";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { Card, CardTitle, StarRow } from "./primitives";
import { hashString } from "./format";

export interface SeedReview {
  name: string;
  rating: number;
  date: string;
  body: string;
  helpful: number;
}

// Static local pool — no DB. buildReviews picks a stable subset per vehicle so
// the rating shown in the hero pill and here always agree.
const REVIEW_POOL: SeedReview[] = [
  { name: "Aditya Bhandari", rating: 5, date: "August 7, 2025", helpful: 3, body: "Absolutely loving it! Been driving it for a while now, and I couldn't be happier. It's the perfect electric car for city roads and even handles our hilly terrain surprisingly well. The design is modern and stylish, and the interior feels premium — especially for the price point. The range is more than enough for daily commutes around Kathmandu, Lalitpur, and beyond. Highly recommended to anyone considering the switch." },
  { name: "Binod Baral", rating: 5, date: "July 3, 2025", helpful: 2, body: "Charging is easy and affordable, and the running cost is a fraction of what I paid for petrol. Great value for money. The service experience has been smooth so far." },
  { name: "Sunita Gurung", rating: 4, date: "June 21, 2025", helpful: 1, body: "Comfortable and quiet on the highway. Ground clearance is reassuring for our roads. I docked a star only because the touchscreen can feel a little laggy at times, but overall a solid family choice." },
  { name: "Prakash Thapa", rating: 5, date: "May 14, 2025", helpful: 4, body: "Spacious cabin, punchy performance, and the safety kit is genuinely useful in city traffic. My family feels safe, and the boot easily swallows a weekend's luggage." },
  { name: "Rita Shrestha", rating: 4, date: "April 2, 2025", helpful: 2, body: "Good all-rounder. Efficient, well-equipped, and the after-sales network is improving. Would have liked a slightly bigger battery, but the range works fine for daily use." },
];

/** Deterministically pick 2–3 reviews for a vehicle from the shared pool. */
export function buildReviews(v: ExtendedVehicle): SeedReview[] {
  const h = hashString(v.id);
  const count = 2 + (h % 2); // 2 or 3 reviews
  const start = h % REVIEW_POOL.length;
  const picked: SeedReview[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(REVIEW_POOL[(start + i) % REVIEW_POOL.length]);
  }
  return picked;
}

/** Average rating across a review set, rounded to one decimal. */
export function averageRating(reviews: SeedReview[]): number {
  if (reviews.length === 0) return 0;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

function ReviewCard({ r }: { r: SeedReview }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const helpful = r.helpful + (vote === "up" ? 1 : 0);
  return (
    <div className="border-b border-slate-100 py-5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {initials(r.name)}
        </span>
        <div>
          <div className="text-sm font-extrabold text-blue-950">{r.name}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <StarRow rating={r.rating} />
            <span className="text-xs font-medium text-slate-400">{r.date}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{r.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
        <span>{helpful} people found this review helpful</span>
        <span className="flex items-center gap-2">
          Was this review helpful?
          <button
            onClick={() => setVote((v) => (v === "up" ? null : "up"))}
            aria-pressed={vote === "up"}
            className={`rounded-full border px-2.5 py-1 transition-colors ${
              vote === "up" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => setVote((v) => (v === "down" ? null : "down"))}
            aria-pressed={vote === "down"}
            className={`rounded-full border px-2.5 py-1 transition-colors ${
              vote === "down" ? "border-red-300 bg-red-50 text-red-600" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            No
          </button>
        </span>
      </div>
    </div>
  );
}

export function Reviews({ reviews }: { reviews: SeedReview[] }) {
  const avg = averageRating(reviews);
  const total = reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <Card className="p-5 sm:p-7">
      <CardTitle title="Customer Reviews & Ratings" />

      <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div className="text-center sm:pr-6">
          <div className="text-4xl font-extrabold tracking-tight text-blue-950">{avg.toFixed(1)}</div>
          <div className="mt-1 flex justify-center">
            <StarRow rating={avg} className="h-4 w-4" />
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-400">of 5 · {total} reviews</div>
        </div>

        <div className="space-y-1.5">
          {dist.map((d) => (
            <div key={d.star} className="flex items-center gap-3">
              <span className="w-3 text-xs font-bold text-slate-500">{d.star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${total ? (d.n / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-4 text-right text-xs font-semibold text-slate-400">{d.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-2">
        {reviews.map((r, i) => (
          <ReviewCard key={r.name + i} r={r} />
        ))}
      </div>
    </Card>
  );
}
