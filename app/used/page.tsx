"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { UsedCard } from "@/components/used/UsedCard";
import { seedListingsAsCards, fetchCommunityListings, UsedCardData } from "@/lib/used-listings";
import { recordSearch } from "@/lib/search-history";
import { supabase } from "@/lib/supabase";

function UsedMarketplace() {
  const searchParams = useSearchParams();
  const [community, setCommunity] = useState<UsedCardData[] | null>(null);
  // ?q= prefills the search box, e.g. from /history
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [posted, setPosted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

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
    // Success banner after publishing a listing (/used?posted=1).
    if (typeof window !== "undefined") {
      setPosted(new URLSearchParams(window.location.search).get("posted") === "1");
    }
  }, []);

  const seed = useMemo(() => seedListingsAsCards(), []);
  // The DB is the source of truth (the admin panel seeds/manages it); the
  // bundled demo listings only fill in when it has no rows (or is unreachable).
  const all = useMemo(
    () => (community && community.length > 0 ? community : seed),
    [community, seed]
  );

  // Save the search to the user's history once they pause typing.
  useEffect(() => {
    const t = setTimeout(() => recordSearch(searchTerm, "used"), 1500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return all.filter(
      (i) =>
        i.listingType === "sell" &&
        (!t || `${i.brand} ${i.model} ${i.variant ?? ""} ${i.location}`.toLowerCase().includes(t))
    );
  }, [all, searchTerm]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader active="used" />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Title + CTA */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
              Marketplace
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Used cars for sale in Nepal
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Buy directly from owners and verified dealers — or list your own in a minute.{" "}
              <Link href="/rentals" className="font-bold text-blue-600 hover:underline">
                Looking to rent instead? →
              </Link>
            </p>
          </div>
          <Link
            href="/used/new"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 motion-reduce:hover:translate-y-0"
          >
            + List your car
          </Link>
        </div>

        {/* Success banner after publishing */}
        {posted && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
          >
            ✓ Your listing is live. Buyers can now see it below.
          </div>
        )}

        {/* Search bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
          <input
            id="used-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by brand, model, or city…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            <p className="text-lg font-bold text-slate-700">No listings match your search</p>
            <p className="mt-2 text-sm text-slate-500">
              Try a different brand or city — or be the first to list one.
            </p>
            <Link
              href="/used/new"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              List your car
            </Link>
          </div>
        ) : (
          <div
            id="used-listings-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((item) => (
              <UsedCard key={item.id} item={item} currentUserId={currentUserId} />
            ))}
          </div>
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

export default function UsedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-lg text-slate-400">
          Loading…
        </div>
      }
    >
      <UsedMarketplace />
    </Suspense>
  );
}
