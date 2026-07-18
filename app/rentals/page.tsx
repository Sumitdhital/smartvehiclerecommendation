"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { UsedCard } from "@/components/used/UsedCard";
import { RentalRequestModal } from "@/components/rentals/RentalRequestModal";
import { fetchCommunityListings, UsedCardData } from "@/lib/used-listings";
import { recordSearch } from "@/lib/search-history";
import { supabase } from "@/lib/supabase";

function RentalsMarketplace() {
  const searchParams = useSearchParams();
  const [community, setCommunity] = useState<UsedCardData[] | null>(null);
  // ?q= prefills the search box, e.g. from /history
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [posted, setPosted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [requestItem, setRequestItem] = useState<UsedCardData | null>(null);

  // Identify the signed-in user so owners can manage their own listings.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id);
    });
  }, []);

  // Load community listings from Supabase (public read).
  useEffect(() => {
    fetchCommunityListings()
      .then(setCommunity)
      .catch(() => setCommunity([]));
    // Success banner after publishing a listing (/rentals?posted=1).
    if (typeof window !== "undefined") {
      setPosted(new URLSearchParams(window.location.search).get("posted") === "1");
    }
  }, []);

  // Save the search to the user's history once they pause typing. Rentals
  // share the used_listings table, so they're recorded under the same
  // "used" source (the DB source check constraint has no "rentals" value).
  useEffect(() => {
    const t = setTimeout(() => recordSearch(searchTerm, "used"), 1500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    const all = community ?? [];
    const t = searchTerm.trim().toLowerCase();
    return all.filter(
      (i) =>
        i.listingType === "rent" &&
        (!t || `${i.brand} ${i.model} ${i.variant ?? ""} ${i.location}`.toLowerCase().includes(t))
    );
  }, [community, searchTerm]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader active="rentals" />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Title + CTA */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-500">
              Rentals
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Rent a car in Nepal
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Rent directly from owners by the day — or list your own car for rent in a minute.{" "}
              <Link href="/used" className="font-bold text-blue-600 hover:underline">
                Looking to buy used? →
              </Link>
            </p>
          </div>
          <Link
            href="/rentals/new"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:bg-orange-600 motion-reduce:hover:translate-y-0"
          >
            + List your car for rent
          </Link>
        </div>

        {/* Success banner after publishing */}
        {posted && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
          >
            ✓ Your rental listing is live. Renters can now see it below.
          </div>
        )}

        {/* Search bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
          <input
            id="rentals-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by brand, model, or city…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <span className="hidden whitespace-nowrap px-2 text-xs font-bold text-slate-400 sm:block">
            {filtered.length} listing{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Grid */}
        {community === null ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-white"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">No rentals match your search</p>
            <p className="mt-2 text-sm text-slate-500">
              Try a different brand or city — or be the first to list one.
            </p>
            <Link
              href="/rentals/new"
              className="mt-4 inline-block rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-600"
            >
              List your car for rent
            </Link>
          </div>
        ) : (
          <div
            id="rentals-listings-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((item) => (
              <UsedCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                onRequestRent={setRequestItem}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 w-full border-t border-slate-100 bg-white py-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
          Copyright © 2026 SaaS Nepal. All rights reserved.
        </div>
      </footer>

      <RentalRequestModal
        open={requestItem !== null}
        onClose={() => setRequestItem(null)}
        vehicleLabel={requestItem ? `${requestItem.year} ${requestItem.brand} ${requestItem.model}` : ""}
        listingId={requestItem?.id ?? ""}
      />
    </div>
  );
}

export default function RentalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-lg text-slate-400">
          Loading…
        </div>
      }
    >
      <RentalsMarketplace />
    </Suspense>
  );
}
