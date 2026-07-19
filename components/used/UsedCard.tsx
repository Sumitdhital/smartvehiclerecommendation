"use client";

import React, { useState } from "react";
import type { UsedCardData } from "@/lib/used-listings";
import { BookTestDriveModal } from "@/components/vehicle/BookTestDriveModal";

interface UsedCardProps {
  item: UsedCardData;
  currentUserId?: string;
  /** When set, rent-type community listings show a "Request to Rent" button
   *  that calls back into the parent (e.g. /rentals) to open the request modal. */
  onRequestRent?: (item: UsedCardData) => void;
}

/** Marketplace listing card — same visual language as the old home section,
 *  with real photo support for community listings. */
export function UsedCard({ item, onRequestRent }: UsedCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(false);

  // Only community listings have an owner to notify; seed rows do not.
  const notifyListingId = item.source === "community" ? item.id : undefined;
  const vehicleLabel = `${item.year} ${item.brand} ${item.model}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all hover:border-slate-200 hover:shadow-md">
      {/* Photo */}
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-100">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={`${item.year} ${item.brand} ${item.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute h-8 w-16 rounded-full bg-blue-500/10 blur-md" />
            <span className="text-2xl font-extrabold uppercase tracking-widest text-slate-400">
              {item.brand}
            </span>
          </>
        )}
        <span className="absolute left-3 top-3 rounded bg-slate-900/60 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-md">
          {item.sellerType}
        </span>
        <span className="absolute right-3 top-3 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
          {item.condition}
        </span>
        {item.listingType === "rent" && (
          <span className="absolute bottom-3 right-3 rounded bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
            For Rent
          </span>
        )}
        {item.source === "community" && (
          <span className="absolute bottom-3 left-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
            Just listed
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-grow flex-col gap-3 p-4">
        <div>
          <h4 className="line-clamp-1 text-sm font-extrabold text-slate-900">
            {item.year} {item.brand} {item.model}
          </h4>
          <p className="mt-0.5 text-[11px] font-bold text-slate-400">
            {item.kmDriven.toLocaleString()} km • {item.location}
          </p>
        </div>

        <div className="mt-auto">
          <p className="text-sm font-black text-blue-600">
            Rs. {item.askingPrice.toLocaleString("en-NP")}
            {item.listingType === "rent" && (
              <span className="text-xs font-bold text-slate-400"> /day</span>
            )}
          </p>
          {item.sellerPhone ? (
            showPhone ? (
              <a
                href={`tel:${item.sellerPhone}`}
                className="mt-3 block w-full rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                📞 {item.sellerPhone}
              </a>
            ) : (
              <button
                onClick={() => setShowPhone(true)}
                className="mt-3 block w-full rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                Show contact
              </button>
            )
          ) : (
            <div className="mt-3 w-full rounded-xl border border-slate-100 bg-slate-50 py-2 text-center text-xs font-bold text-slate-400">
              {item.sellerName ? `Sold by ${item.sellerName}` : "Contact unavailable"}
            </div>
          )}

          {item.listingType === "sell" && item.sold && (
            <div className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50 py-2 text-center text-xs font-bold text-slate-400">
              Sold — no test drives
            </div>
          )}

          {item.listingType === "sell" && !item.sold && (
            <button
              onClick={() => setShowTestDrive(true)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
              </svg>
              Book Test Drive
            </button>
          )}

          {item.listingType === "rent" && onRequestRent && item.source === "community" && (
            <button
              onClick={() => onRequestRent(item)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
              Request to Rent
            </button>
          )}
        </div>
      </div>

      <BookTestDriveModal
        open={showTestDrive && !item.sold}
        onClose={() => setShowTestDrive(false)}
        vehicleLabel={vehicleLabel}
        listingId={notifyListingId}
      />
    </div>
  );
}
