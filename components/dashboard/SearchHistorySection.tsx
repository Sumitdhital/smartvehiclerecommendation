"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { listHistory, type SearchHistoryEntry } from "@/lib/search-history";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Where re-running a history entry should go — mirrors app/history/page.tsx. */
function hrefFor(entry: SearchHistoryEntry): string {
  if (entry.source === "view") return `/vehicle/${entry.vehicle_id}`;
  if (entry.source === "used") return `/used?q=${encodeURIComponent(entry.query)}`;
  return `/?q=${encodeURIComponent(entry.query)}`;
}

const SOURCE_LABEL: Record<SearchHistoryEntry["source"], string> = {
  view: "Viewed",
  used: "Used cars",
  new: "New cars",
};

const SOURCE_STYLE: Record<SearchHistoryEntry["source"], string> = {
  view: "bg-emerald-50 text-emerald-700",
  used: "bg-amber-50 text-amber-700",
  new: "bg-blue-50 text-blue-700",
};

/** Compact search-history list with re-run links. Full management lives at /history. */
export function SearchHistorySection() {
  const [entries, setEntries] = useState<SearchHistoryEntry[] | null>(null);

  useEffect(() => {
    listHistory(20)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border border-slate-100 bg-white" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm font-medium text-slate-400">
        Searches you make while signed in will show up here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={hrefFor(entry)}
              className="group flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <span className="truncate text-sm font-bold text-slate-800">{entry.query}</span>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${SOURCE_STYLE[entry.source]}`}
              >
                {SOURCE_LABEL[entry.source]}
              </span>
              <span className="ml-auto flex-shrink-0 text-xs font-medium text-slate-400">
                {timeAgo(entry.created_at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/history" className="self-start text-xs font-bold text-blue-600 hover:underline">
        Manage full search history →
      </Link>
    </div>
  );
}
