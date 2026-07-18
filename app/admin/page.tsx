"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface AdminView {
  id: string;
  admin_email: string;
  vehicle_id: string;
  vehicle_name: string;
  viewed_at: string;
}

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

interface Counts {
  vehicles: number | null;
  used: number | null;
  admins: number | null;
}

const CARDS = [
  {
    key: "vehicles" as const,
    label: "Vehicles",
    href: "/admin/vehicles",
    blurb: "New vehicle catalog",
    accent: "text-blue-600 bg-blue-50",
  },
  {
    key: "used" as const,
    label: "Used listings",
    href: "/admin/used-listings",
    blurb: "Second-hand marketplace",
    accent: "text-emerald-600 bg-emerald-50",
  },
  {
    key: "admins" as const,
    label: "Admins",
    href: "/admin/admins",
    blurb: "Panel access accounts",
    accent: "text-violet-600 bg-violet-50",
  },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts>({ vehicles: null, used: null, admins: null });
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const [seedError, setSeedError] = useState("");
  const [views, setViews] = useState<AdminView[] | null>(null);

  const loadCounts = async () => {
    const endpoints: [keyof Counts, string][] = [
      ["vehicles", "/api/admin/vehicles"],
      ["used", "/api/admin/used-listings"],
      ["admins", "/api/admin/admins"],
    ];
    await Promise.all(
      endpoints.map(async ([key, url]) => {
        try {
          const res = await fetch(url, { cache: "no-store" });
          const json = await res.json();
          const n = res.ok && Array.isArray(json.data) ? json.data.length : null;
          setCounts((c) => ({ ...c, [key]: n }));
        } catch {
          setCounts((c) => ({ ...c, [key]: null }));
        }
      })
    );
  };

  useEffect(() => {
    loadCounts();
    fetch("/api/admin/vehicle-views", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setViews(Array.isArray(j.data) ? j.data : []))
      .catch(() => setViews([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seed = async () => {
    setSeeding(true);
    setSeedMsg("");
    setSeedError("");
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Seeding failed.");
      setSeedMsg(
        `Synced ${json.vehicles} vehicles. ` +
          (json.usedListingsSkipped
            ? "Used listings already present — skipped."
            : `Inserted ${json.usedListingsInserted} used listings.`)
      );
      await loadCounts();
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : "Seeding failed.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage the vehicle catalog, used listings and admin accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
          >
            <span className={`inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg ${card.accent}`}>
              {card.label}
            </span>
            <p className="text-3xl font-black text-slate-900 mt-3">
              {counts[card.key] === null ? "—" : counts[card.key]}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">{card.blurb}</p>
            <span className="inline-block text-xs font-bold text-blue-600 mt-3 group-hover:underline">
              Manage →
            </span>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-black text-slate-900 tracking-tight">Seed from catalog</h2>
        <p className="text-sm text-slate-500 font-medium mt-1 max-w-xl">
          Load the built-in static catalog into the database. Vehicles are upserted by slug (safe to
          re-run); used listings are only added when the table is empty.
        </p>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={seed}
            disabled={seeding}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {seeding ? "Seeding…" : "Seed from catalog"}
          </button>
          {seedMsg && <span className="text-xs font-bold text-emerald-600">{seedMsg}</span>}
          {seedError && <span className="text-xs font-bold text-red-600">{seedError}</span>}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-black text-slate-900 tracking-tight">Recently viewed vehicles</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Cars opened by admins — from the public car pages and this panel.
        </p>

        {views === null ? (
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : views.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-400">No vehicles viewed yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-slate-100">
            {views.map((view) => (
              <li key={view.id} className="flex items-center gap-3 py-3">
                <Link
                  href={`/vehicle/${view.vehicle_id}`}
                  className="min-w-0 flex-grow truncate text-sm font-bold text-slate-800 hover:text-blue-600 hover:underline"
                >
                  {view.vehicle_name}
                </Link>
                <span className="flex-shrink-0 text-xs font-semibold text-slate-400">{view.admin_email}</span>
                <span className="flex-shrink-0 text-xs font-medium text-slate-400">{timeAgo(view.viewed_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
