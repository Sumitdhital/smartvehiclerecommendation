"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchRentalRequests,
  setRentalStatus,
  type RentalRow,
  type RentalStatus,
} from "@/lib/dashboard";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STATUS_STYLE: Record<RentalStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-600",
};

function StatusChip({ status }: { status: RentalStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm font-medium text-slate-400">
      {children}
    </div>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500">
        {count}
      </span>
    </div>
  );
}

export function RentalsSection({ userId }: { userId: string }) {
  const [data, setData] = useState<{ made: RentalRow[]; received: RentalRow[] } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchRentalRequests(userId)
      .then(setData)
      .catch(() => setData({ made: [], received: [] }));
  }, [userId]);

  const decide = async (r: RentalRow, status: "approved" | "declined") => {
    setBusy(r.id);
    const prev = data;
    setData((d) =>
      d
        ? { ...d, received: d.received.map((x) => (x.id === r.id ? { ...x, status } : x)) }
        : d
    );
    try {
      await setRentalStatus(r.id, status);
    } catch {
      setData(prev); // revert on failure
    } finally {
      setBusy(null);
    }
  };

  if (data === null) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-white" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Requests the user submitted */}
      <section className="flex flex-col gap-3">
        <SectionHeading title="Requests I made" count={data.made.length} />
        {data.made.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.made.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-extrabold text-slate-900">{r.listingLabel}</p>
                  <StatusChip status={r.status} />
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                </p>
                {r.message && <p className="mt-2 text-xs font-medium text-slate-500">“{r.message}”</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint>
            You haven&apos;t requested any rentals yet.{" "}
            <Link href="/rentals" className="font-bold text-blue-600 hover:underline">
              Browse rentals →
            </Link>
          </EmptyHint>
        )}
      </section>

      {/* Requests on the user's rent listings */}
      <section className="flex flex-col gap-3">
        <SectionHeading title="Requests received" count={data.received.length} />
        {data.received.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.received.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-extrabold text-slate-900">{r.listingLabel}</p>
                      <StatusChip status={r.status} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-600">
                      <span>{r.fullName}</span>
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="text-blue-600 hover:underline">
                          📞 {r.phone}
                        </a>
                      )}
                    </div>
                    {r.message && <p className="mt-2 text-xs font-medium text-slate-500">“{r.message}”</p>}
                  </div>

                  {r.status === "pending" ? (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        onClick={() => decide(r, "approved")}
                        disabled={busy === r.id}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(r, "declined")}
                        disabled={busy === r.id}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {r.status === "approved" ? "You approved this" : "You declined this"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint>No rental requests on your listings yet.</EmptyHint>
        )}
      </section>
    </div>
  );
}
