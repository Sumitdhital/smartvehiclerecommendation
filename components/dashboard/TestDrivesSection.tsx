"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchTestDrives, type TestDriveRow } from "@/lib/dashboard";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
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

function MadeCard({ b }: { b: TestDriveRow }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <p className="text-sm font-extrabold text-slate-900">{b.vehicleLabel}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">
        {fmtDate(b.preferredDate)} · {b.timeSlot}
      </p>
      {b.message && <p className="mt-2 text-xs font-medium text-slate-500">“{b.message}”</p>}
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Requested {fmtDate(b.createdAt)}
      </p>
    </div>
  );
}

function ReceivedCard({ b }: { b: TestDriveRow }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{b.vehicleLabel}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {fmtDate(b.preferredDate)} · {b.timeSlot}
          </p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
          Test drive
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs font-bold text-slate-600">
        <span>{b.fullName}</span>
        {b.phone && (
          <a href={`tel:${b.phone}`} className="text-blue-600 hover:underline">
            📞 {b.phone}
          </a>
        )}
      </div>
      {b.message && <p className="mt-2 text-xs font-medium text-slate-500">“{b.message}”</p>}
    </div>
  );
}

export function TestDrivesSection({ userId }: { userId: string }) {
  const [data, setData] = useState<{ made: TestDriveRow[]; received: TestDriveRow[] } | null>(null);

  useEffect(() => {
    fetchTestDrives(userId)
      .then(setData)
      .catch(() => setData({ made: [], received: [] }));
  }, [userId]);

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
      <section className="flex flex-col gap-3">
        <SectionHeading title="Requests I made" count={data.made.length} />
        {data.made.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.made.map((b) => (
              <MadeCard key={b.id} b={b} />
            ))}
          </div>
        ) : (
          <EmptyHint>
            You haven&apos;t booked any test drives yet.{" "}
            <Link href="/" className="font-bold text-blue-600 hover:underline">
              Browse cars →
            </Link>
          </EmptyHint>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading title="Requests received" count={data.received.length} />
        {data.received.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.received.map((b) => (
              <ReceivedCard key={b.id} b={b} />
            ))}
          </div>
        ) : (
          <EmptyHint>No one has requested a test drive on your listings yet.</EmptyHint>
        )}
      </section>
    </div>
  );
}
