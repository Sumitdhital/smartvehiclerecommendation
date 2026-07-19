"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// CarsDropdown: a hover-activated dropdown menu with EV / Petrol options
function CarsDropdown({ activeFuel }: { activeFuel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className={`flex items-center gap-1 font-semibold transition-colors ${
        activeFuel ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
      }`}>
        <span>Cars</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 py-1.5">
          <Link
            href="/?fuel=ev"
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeFuel === 'ev' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
            }`}
          >
            <span className="text-base">⚡</span> EV
            {activeFuel === 'ev' && <span className="ml-auto text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5">active</span>}
          </Link>
          <Link
            href="/?fuel=petrol"
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeFuel === 'petrol' ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
            }`}
          >
            <span className="text-base">⛽</span> Petrol
            {activeFuel === 'petrol' && <span className="ml-auto text-[10px] bg-orange-500 text-white rounded-full px-1.5 py-0.5">active</span>}
          </Link>
          <Link
            href="/?fuel=diesel"
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeFuel === 'diesel' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700'
            }`}
          >
            <span className="text-base">🛢️</span> Diesel
            {activeFuel === 'diesel' && <span className="ml-auto text-[10px] bg-amber-600 text-white rounded-full px-1.5 py-0.5">active</span>}
          </Link>
          <div className="my-1 border-t border-slate-100" />
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <span className="text-base">🚗</span> All Cars
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Shared sticky header for every page. `active` highlights the current nav
 * link; `activeFuel` highlights the matching entry in the Cars dropdown and is
 * only meaningful on the home page, which owns the fuel filter.
 */
export function SiteHeader({
  active,
  activeFuel = "",
}: {
  active?: "find" | "used" | "rentals" | "compare";
  activeFuel?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { compareVehicles } = useAppStore();

  const navLink = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`transition-colors ${
        active === key ? "text-blue-600" : "hover:text-blue-600"
      }`}
    >
      {label}
    </Link>
  );

  const mobileLink = (href: string, label: string, className = "") => (
    <Link
      href={href}
      onClick={() => setMobileMenuOpen(false)}
      className={`px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors ${className}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-black text-2xl text-blue-600 tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
            </svg>
            <span>SaaS Nepal</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navLink("/", "find", "Find cars")}
            {navLink("/used", "used", "Used car")}
            {navLink("/rentals", "rentals", "Rentals")}
            <CarsDropdown activeFuel={activeFuel} />
            {navLink("/compare", "compare", "Compare")}
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
              <span>Tools</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {compareVehicles.length > 0 && (
            <Link
              href="/compare"
              className="bg-blue-600 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all hidden sm:flex items-center gap-1.5"
              id="view-compare-btn"
            >
              <span>View Compare</span>
              <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black">
                {compareVehicles.length}
              </span>
            </Link>
          )}
          <NotificationBell />
          <Link
            href="/used/new"
            className="hidden sm:inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-md shadow-blue-500/20"
          >
            + List your car
          </Link>
          <UserMenu signInClassName="border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold px-4 sm:px-5 py-2 rounded-xl text-sm transition-all duration-200" />

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-2 -mr-1 text-slate-600 hover:text-blue-600 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-slate-100 bg-white px-4 sm:px-6 py-4 flex flex-col gap-1 text-sm font-semibold text-slate-700 shadow-sm">
          {mobileLink("/", "Find cars")}
          {mobileLink("/used", "Used car")}
          {mobileLink("/rentals", "Rentals")}

          {/* Cars — fuel type filters (same filter as the sidebar) */}
          <div className="mt-1 px-3 pt-2 pb-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Cars</div>
          <div className="grid grid-cols-2 gap-2 px-1">
            {[
              { label: "⚡ EV", href: "/?fuel=ev", key: "ev", active: "bg-blue-50 text-blue-600 border-blue-200" },
              { label: "⛽ Petrol", href: "/?fuel=petrol", key: "petrol", active: "bg-orange-50 text-orange-600 border-orange-200" },
              { label: "🛢️ Diesel", href: "/?fuel=diesel", key: "diesel", active: "bg-amber-50 text-amber-700 border-amber-200" },
              { label: "🚗 All Cars", href: "/", key: "", active: "bg-slate-100 text-slate-700 border-slate-200" },
            ].map((item) => (
              <Link
                key={item.key || "all"}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl border text-center transition-colors ${
                  activeFuel === item.key
                    ? item.active
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {mobileLink("/compare", "Compare", "mt-1")}
          <div className="px-3 py-2.5 rounded-xl text-slate-400">Tools</div>
          {mobileLink("/used/new", "+ List your car", "sm:hidden text-blue-600")}
        </nav>
      )}
    </header>
  );
}
