"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import type { TaxBreakdown } from "@/lib/tax-engine";
import { BookTestDriveModal } from "@/components/vehicle/BookTestDriveModal";
import { recordView } from "@/lib/search-history";

import { I } from "./detail/icons";
import { Gallery, HeroCard } from "./detail/Gallery";
import { PriceCard } from "./detail/PriceCard";
import { SimilarSidebar } from "./detail/SimilarSidebar";
import { SpecChips } from "./detail/SpecChips";
import { TabNav } from "./detail/TabNav";
import { OverviewSection, SpecTables } from "./detail/SpecTables";
import { FeatureGrid } from "./detail/FeatureGrid";
import { Reviews, buildReviews, averageRating } from "./detail/Reviews";
import { CompareStrip } from "./detail/CompareStrip";
import { Faqs, buildFaqs } from "./detail/Faqs";

/**
 * Composer for the vehicle detail page. Owns the test-drive modal state and the
 * signed-in "viewed" logging; every visual block lives in components/vehicle/detail/*.
 * Recommendations (`similar`) are computed server-side in app/vehicle/[id]/page.tsx.
 */
export default function VehicleDetail({
  vehicle,
  tax,
  similar,
}: {
  vehicle: ExtendedVehicle;
  tax: TaxBreakdown;
  similar: ExtendedVehicle[];
}) {
  const v = vehicle;
  const isEV = v.fuel === "Electric";

  // Log a "viewed" entry for signed-in users (no-ops when logged out; admins
  // are logged server-side in app/vehicle/[id]/page.tsx instead).
  useEffect(() => {
    recordView(v.id, `${v.brand} ${v.model} ${v.variant}`);
  }, [v.id, v.brand, v.model, v.variant]);

  const [showTestDrive, setShowTestDrive] = useState(false);

  const reviews = useMemo(() => buildReviews(v), [v]);
  const rating = averageRating(reviews);
  const faqs = useMemo(() => buildFaqs(v, tax), [v, tax]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <I.chevronR className="h-3 w-3" />
        <Link href={isEV ? "/?fuel=ev" : "/?fuel=petrol"} className="hover:text-blue-600">
          {isEV ? "Electric Cars" : "Petrol Cars"}
        </Link>
        <I.chevronR className="h-3 w-3" />
        <span className="text-slate-600">{v.brand} {v.model}</span>
      </nav>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl">
        {v.brand} {v.model} Price in Nepal
      </h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ══════════ main column ══════════ */}
        <div className="min-w-0 space-y-8">
          {/* HERO */}
          <HeroCard>
            <div className="grid md:grid-cols-2">
              <Gallery
                vehicle={v}
                rating={rating}
                reviewCount={reviews.length}
                onBookTestDrive={() => setShowTestDrive(true)}
              />
              <PriceCard vehicle={v} tax={tax} />
            </div>
          </HeroCard>

          {/* HIGHLIGHT CHIPS */}
          <SpecChips vehicle={v} />

          {/* TABS */}
          <TabNav />

          {/* OVERVIEW */}
          <OverviewSection vehicle={v} />

          {/* SPECIFICATIONS */}
          <SpecTables vehicle={v} />

          {/* FEATURES */}
          <FeatureGrid vehicle={v} />

          {/* REVIEWS */}
          <Reviews reviews={reviews} />

          {/* COMPARE */}
          <CompareStrip vehicle={v} rivals={similar.slice(0, 3)} />

          {/* FAQ */}
          <Faqs items={faqs} />
        </div>

        {/* ══════════ right rail ══════════ */}
        <div className="lg:sticky lg:top-20">
          <SimilarSidebar items={similar} />
        </div>
      </div>

      <BookTestDriveModal
        open={showTestDrive && !v.sold}
        onClose={() => setShowTestDrive(false)}
        vehicleLabel={`${v.brand} ${v.model} ${v.variant}`.trim()}
        vehicleId={v.id}
      />
    </main>
  );
}
