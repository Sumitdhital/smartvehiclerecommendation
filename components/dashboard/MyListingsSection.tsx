"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchMyListings,
  fetchMyVehicles,
  deleteListing,
  type MyListing,
} from "@/lib/dashboard";
import { setListingSold } from "@/lib/used-listings";
import type { ExtendedVehicle } from "@/lib/vehicles-db";

const npr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

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

export function MyListingsSection({
  userId,
  isDealer,
}: {
  userId: string;
  isDealer: boolean;
}) {
  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [vehicles, setVehicles] = useState<ExtendedVehicle[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchMyListings(userId).then(setListings).catch(() => setListings([]));
    if (isDealer) {
      fetchMyVehicles(userId).then(setVehicles).catch(() => setVehicles([]));
    } else {
      setVehicles([]);
    }
  }, [userId, isDealer]);

  const sellListings = (listings ?? []).filter((l) => l.listingType === "sell");
  const rentListings = (listings ?? []).filter((l) => l.listingType === "rent");

  const handleToggleSold = async (l: MyListing) => {
    setBusy(l.id);
    const next = !l.sold;
    setListings((prev) => (prev ? prev.map((x) => (x.id === l.id ? { ...x, sold: next } : x)) : prev));
    try {
      await setListingSold(l.id, next);
    } catch {
      // Revert on failure.
      setListings((prev) => (prev ? prev.map((x) => (x.id === l.id ? { ...x, sold: !next } : x)) : prev));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (l: MyListing) => {
    if (!window.confirm(`Delete your ${l.year} ${l.brand} ${l.model} listing? This can't be undone.`)) {
      return;
    }
    setBusy(l.id);
    const snapshot = listings;
    setListings((prev) => (prev ? prev.filter((x) => x.id !== l.id) : prev));
    try {
      await deleteListing(l.id);
    } catch {
      setListings(snapshot ?? null);
    } finally {
      setBusy(null);
    }
  };

  const listingRow = (l: MyListing) => (
    <div
      key={l.id}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-grow items-center gap-3">
        <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          {l.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.imageUrl} alt={`${l.brand} ${l.model}`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {l.brand}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-extrabold text-slate-900">
              {l.year} {l.brand} {l.model}
            </p>
            {l.sold && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                Sold
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] font-bold text-slate-400">{l.location}</p>
          <p className="mt-0.5 text-sm font-black text-blue-600">
            {npr(l.askingPrice)}
            {l.listingType === "rent" && <span className="text-xs font-bold text-slate-400"> /day</span>}
          </p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {l.listingType === "sell" && (
          <button
            onClick={() => handleToggleSold(l)}
            disabled={busy === l.id}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {l.sold ? "Mark available" : "Mark sold"}
          </button>
        )}
        <button
          onClick={() => handleDelete(l)}
          disabled={busy === l.id}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );

  const loading = listings === null || (isDealer && vehicles === null);

  return (
    <div className="flex flex-col gap-8">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {isDealer && (
          <Link
            href="/dealer/new-car"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 motion-reduce:hover:translate-y-0"
          >
            + List a new car
          </Link>
        )}
        <Link
          href="/used/new"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          + List used car
        </Link>
        <Link
          href="/rentals/new"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          + List rental
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          ))}
        </div>
      ) : (
        <>
          {/* Dealer: catalog cars owned */}
          {isDealer && (
            <section className="flex flex-col gap-3">
              <SectionHeading title="My new cars" count={vehicles?.length ?? 0} />
              {vehicles && vehicles.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {vehicles.map((v) => (
                    <Link
                      key={v.id}
                      href={`/vehicle/${v.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                        {v.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {v.brand}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {v.brand} {v.model}
                        </p>
                        {v.variant && (
                          <p className="truncate text-[11px] font-bold text-slate-400">{v.variant}</p>
                        )}
                        <p className="mt-0.5 text-sm font-black text-blue-600">{npr(v.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyHint>
                  You haven&apos;t listed any new cars yet.{" "}
                  <Link href="/dealer/new-car" className="font-bold text-blue-600 hover:underline">
                    List one →
                  </Link>
                </EmptyHint>
              )}
            </section>
          )}

          {/* Used (sell) listings */}
          <section className="flex flex-col gap-3">
            <SectionHeading title="My used listings" count={sellListings.length} />
            {sellListings.length > 0 ? (
              <div className="flex flex-col gap-3">{sellListings.map(listingRow)}</div>
            ) : (
              <EmptyHint>
                No used cars listed for sale.{" "}
                <Link href="/used/new" className="font-bold text-blue-600 hover:underline">
                  List one →
                </Link>
              </EmptyHint>
            )}
          </section>

          {/* Rental listings */}
          <section className="flex flex-col gap-3">
            <SectionHeading title="My rental listings" count={rentListings.length} />
            {rentListings.length > 0 ? (
              <div className="flex flex-col gap-3">{rentListings.map(listingRow)}</div>
            ) : (
              <EmptyHint>
                No cars listed for rent.{" "}
                <Link href="/rentals/new" className="font-bold text-blue-600 hover:underline">
                  List one →
                </Link>
              </EmptyHint>
            )}
          </section>
        </>
      )}
    </div>
  );
}
