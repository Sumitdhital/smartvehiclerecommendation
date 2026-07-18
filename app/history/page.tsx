"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import {
  SearchHistoryEntry,
  listHistory,
  deleteHistoryEntry,
  clearHistory,
} from "@/lib/search-history";

/** "5m ago" / "3h ago" / "2d ago" style timestamp. */
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

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<SearchHistoryEntry[] | null>(null);

  // Only signed-in users have a search history.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/history");
        return;
      }
      listHistory()
        .then(setEntries)
        .catch(() => setEntries([]));
    });
  }, [router]);

  const handleDelete = async (id: string) => {
    setEntries((prev) => (prev ? prev.filter((e) => e.id !== id) : prev));
    try {
      await deleteHistoryEntry(id);
    } catch {
      // Refresh from the server if the delete failed.
      listHistory().then(setEntries).catch(() => {});
    }
  };

  const handleClearAll = async () => {
    setEntries([]);
    try {
      await clearHistory();
    } catch {
      listHistory().then(setEntries).catch(() => {});
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-grow flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
              Your account
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Search history
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Tap a search to run it again, or a viewed car to reopen it.
            </p>
          </div>
          {entries !== null && entries.length > 0 && (
            <button
              onClick={handleClearAll}
              className="whitespace-nowrap rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Clear all
            </button>
          )}
        </div>

        {entries === null ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl border border-slate-100 bg-white" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">No searches yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Searches you make while signed in will show up here.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              Browse vehicles
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                <Link
                  href={
                    entry.source === "view"
                      ? `/vehicle/${entry.vehicle_id}`
                      : entry.source === "used"
                        ? `/used?q=${encodeURIComponent(entry.query)}`
                        : `/?q=${encodeURIComponent(entry.query)}`
                  }
                  className="flex min-w-0 flex-grow items-center gap-3"
                >
                  {entry.source === "view" ? (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5m-18 0h18m-18 0v4m18-4v4M6 17v2m12-2v2M6.5 13.5h.01M17.5 13.5h.01" />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                  <span className="truncate text-sm font-bold text-slate-800">{entry.query}</span>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      entry.source === "view"
                        ? "bg-emerald-50 text-emerald-700"
                        : entry.source === "used"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {entry.source === "view"
                      ? "Viewed"
                      : entry.source === "used"
                        ? "Used cars"
                        : "New cars"}
                  </span>
                  <span className="ml-auto flex-shrink-0 text-xs font-medium text-slate-400">
                    {timeAgo(entry.created_at)}
                  </span>
                </Link>
                <button
                  onClick={() => handleDelete(entry.id)}
                  aria-label={`Delete search "${entry.query}"`}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="mt-12 w-full border-t border-slate-100 bg-white py-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
          Copyright © 2026 SaaS Nepal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
