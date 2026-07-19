"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAppStore } from "@/lib/store";
import { getVehiclesAsync, applyVehicleFilters, ExtendedVehicle } from "@/lib/vehicles-db";
import { calculateNepalOnRoadPrice } from "@/lib/tax-engine";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserMenu } from "@/components/auth/UserMenu";
import cardStyles from "./car-card.module.css";

// Simple custom inline SVG components for icons to ensure zero dependency mismatch issues
const BatteryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 mr-1.5">
    <rect width="16" height="10" x="2" y="7" rx="2" ry="2"/>
    <line x1="22" x2="22" y1="11" y2="13"/>
  </svg>
);

const RangeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 mr-1.5">
    <path d="m12 14 4-4"/>
    <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
  </svg>
);

const StarIcon = ({ filled = true }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#EAB308" : "none"} stroke="#EAB308" strokeWidth="2" className="mr-1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const CalcIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
    <rect width="16" height="20" x="4" y="2" rx="2"/>
    <line x1="8" x2="16" y1="6" y2="6"/>
    <line x1="16" x2="16" y1="14" y2="18"/>
    <path d="M16 10h.01"/>
    <path d="M12 10h.01"/>
    <path d="M8 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M8 14h.01"/>
    <path d="M12 18h.01"/>
    <path d="M8 18h.01"/>
  </svg>
);

const CompareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
    <rect width="8" height="18" x="2" y="3" rx="1"/>
    <rect width="8" height="18" x="14" y="3" rx="1"/>
  </svg>
);

// CarsDropdown: a hover-activated dropdown menu with EV / Petrol options
function CarsDropdown({ activeFuel }: { activeFuel: string }) {
  const [open, setOpen] = React.useState(false);
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

// VehiclePhoto: renders the vehicle's primary image, falling back to a
// branded text placeholder when there's no image or it fails to load.
function VehiclePhoto({ vehicle }: { vehicle: ExtendedVehicle }) {
  const [imgError, setImgError] = useState(false);
  const src = vehicle.images && vehicle.images[0];

  if (!src || imgError) {
    return (
      <div className={cardStyles.fallback}>
        {vehicle.brand}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${vehicle.brand} ${vehicle.model}`}
      className={cardStyles.photo}
      onError={() => setImgError(true)}
    />
  );
}

function HomeContent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const { compareVehicles, addToCompare, removeFromCompare, clearCompare } = useAppStore();

  // Fuel filter from URL (?fuel=ev|petrol)
  const fuelFilter = searchParams.get('fuel') || '';

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [discountFilter, setDiscountFilter] = useState(false);
  const [maxPriceLimit, setMaxPriceLimit] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"detailed" | "compact">("detailed");

  // Mobile navigation menu (shown below the lg breakpoint)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // EMI Calculator Modal State
  const [selectedEmiVehicle, setSelectedEmiVehicle] = useState<ExtendedVehicle | null>(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState(40);
  const [tenureYears, setTenureYears] = useState(7);
  const [interestRate, setInterestRate] = useState(8.5);

  // Dropdown brands & models lists
  const BRANDS = ["BYD", "Tata", "Citroen", "KIA", "XPENG", "Wuling", "Seres", "BAW", "Avatr", "MG", "Toyota", "Honda", "Suzuki", "Hyundai"];
  const MODELS_BY_BRAND: Record<string, string[]> = {
    "BYD": ["Dolphin", "Atto 1", "Atto 2", "Atto 3", "Seal"],
    "Tata": ["Tiago EV", "Nexon EV", "Punch EV"],
    "Citroen": ["E-C3"],
    "KIA": ["EV9", "Sonet"],
    "XPENG": ["G6"],
    "Wuling": ["Bingo"],
    "Seres": ["Seres 3"],
    "BAW": ["E7 Pro"],
    "Avatr": ["Avatr 11"],
    "MG": ["ZS EV", "MG4 EV"],
    "Toyota": ["Fortuner"],
    "Honda": ["City"],
    "Suzuki": ["Swift"],
    "Hyundai": ["Creta"]
  };

  const currentModels = brandFilter ? MODELS_BY_BRAND[brandFilter] || [] : [];

  // Full catalog, loaded once from Supabase on mount.
  const [allVehicles, setAllVehicles] = useState<ExtendedVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    let active = true;
    getVehiclesAsync()
      .then((list) => {
        if (active) setAllVehicles(list);
      })
      .finally(() => {
        if (active) setLoadingVehicles(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter vehicles list dynamically (client-side, reusing the shared internals)
  const filteredVehicles = applyVehicleFilters(allVehicles, {
    searchTerm,
    brand: brandFilter,
    model: modelFilter,
    budgetMax: maxPriceLimit,
    sortBy: sortBy as any,
    showDiscountedOnly: discountFilter,
    fuelFilter,
  });

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setBrandFilter("");
    setModelFilter("");
    setDiscountFilter(false);
    setMaxPriceLimit(undefined);
    if (fuelFilter) router.push("/");
  };

  // Compare Checkbox Handler
  const handleCompareCheck = (vehicle: ExtendedVehicle, checked: boolean) => {
    if (checked) {
      if (compareVehicles.length >= 4) {
        alert("You can compare up to 4 vehicles. Remove one first.");
        return;
      }
      addToCompare(vehicle);
    } else {
      removeFromCompare(vehicle.id);
    }
  };

  // EMI calculation helper
  const calculateEMI = (price: number) => {
    const loanAmount = price * (1 - downPaymentPercent / 100);
    const r = (interestRate / 12) / 100;
    const n = tenureYears * 12;
    if (r === 0) return Math.round(loanAmount / n);
    const emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col justify-between">
      {/* 1. Header (Sticky Navbar) */}
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
              <Link href="/" className="text-blue-600 hover:text-blue-700 transition-colors">Find cars</Link>
              <Link href="/used" className="hover:text-blue-600 transition-colors">Used car</Link>
              <Link href="/rentals" className="hover:text-blue-600 transition-colors">Rentals</Link>
              {/* Cars dropdown */}
              <CarsDropdown activeFuel={fuelFilter} />
              <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare</Link>
              <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                <span>Tools</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {compareVehicles.length > 0 && (
              <Link
                href="/compare"
                className="bg-blue-600 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                id="view-compare-btn"
              >
                <span>View Compare</span>
                <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black">
                  {compareVehicles.length}
                </span>
              </Link>
            )}
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
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors">Find cars</Link>
            <Link href="/used" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors">Used car</Link>
            <Link href="/rentals" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors">Rentals</Link>

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
                    fuelFilter === item.key
                      ? item.active
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <Link href="/compare" onClick={() => setMobileMenuOpen(false)} className="mt-1 px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors">Compare</Link>
            <div className="px-3 py-2.5 rounded-xl text-slate-400">Tools</div>
          </nav>
        )}
      </header>

      {/* 2. Main Page Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow flex flex-col gap-8">
        
        {/* Title Block */}
        <div className="text-center py-4">
          <h1 className="text-3xl sm:text-4xl font-black text-blue-950 tracking-tight" id="main-page-title">
            Electric car price in Nepal
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-2">
            Search for prices of all electric cars available in Nepal.
          </p>
        </div>

        {/* Ad Placeholder — reserved advertising slot */}
        <div className="w-full min-h-[136px] md:min-h-[152px] bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 text-center sm:text-left">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Advertisement</span>
            <h3 className="text-lg md:text-xl font-black text-slate-700 tracking-tight mt-0.5">Ad space available</h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Feature your dealership or EV offer here. <span className="text-blue-600 font-bold">Get in touch to advertise.</span>
            </p>
          </div>
        </div>

        {/* Filters and List Core Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* A. Left Sidebar Filters */}
          <aside className="w-full lg:w-72 lg:flex-shrink-0 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-6 lg:sticky lg:top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Search Filters</h3>
              <button 
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
              >
                Clear
              </button>
            </div>

            {/* Filter: Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <SearchIcon />
                </span>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Filter: Brands Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Brands</label>
              <select 
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setModelFilter(""); // reset model when brand changes
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">Select a Brand</option>
                {BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Filter: Models Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Models</label>
              <select 
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                disabled={!brandFilter}
                className={`w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer ${!brandFilter ? 'opacity-60 cursor-not-allowed' : ''}`}
                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">{!brandFilter ? "Select a Brand first" : "Select a Model"}</option>
                {currentModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Filter: Show Discounted EVs Toggle */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-bold text-slate-700">Show Discounted EVs</span>
              <button 
                onClick={() => setDiscountFilter(!discountFilter)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none ${discountFilter ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'}`}
              >
                <span className="bg-white w-4.5 h-4.5 rounded-full shadow-sm"></span>
              </button>
            </div>

            {/* Sidebar Promo Cards */}
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <Link href="#" className="border border-slate-100 bg-slate-50 hover:bg-slate-100/60 p-3.5 rounded-xl flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-sm">
                    📢
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">Advertise with us</span>
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 transition-colors">&rarr;</span>
              </Link>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2.5">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Follow us</span>
                <div className="flex items-center gap-3">
                  <a href="#" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm text-sm">🎵</a>
                  <a href="#" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm text-sm">📷</a>
                  <a href="#" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm text-sm">👤</a>
                </div>
              </div>
            </div>
          </aside>

          {/* B. Right Main Listings Area */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
            
            {/* Top Sort / View Pill Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200/60 p-3 rounded-2xl shadow-sm">
              
              {/* Category Pills (Budget options) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-grow min-w-0">
                {[
                  { label: "All Budgets", value: undefined },
                  { label: "Under Rs. 20L", value: 2000000 },
                  { label: "Under Rs. 30L", value: 3000000 },
                  { label: "Under Rs. 40L", value: 4000000 },
                  { label: "Under Rs. 50L", value: 5000000 },
                  { label: "Under Rs. 60L", value: 6000000 }
                ].map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => setMaxPriceLimit(pill.value)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${maxPriceLimit === pill.value ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'}`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Active Fuel Filter Badge */}
              {fuelFilter && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  fuelFilter === 'ev'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : fuelFilter === 'diesel'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}>
                  <span>{fuelFilter === 'ev' ? '⚡ EV Only' : fuelFilter === 'diesel' ? '🛢️ Diesel Only' : '⛽ Petrol Only'}</span>
                  <Link href="/" className="ml-1 hover:opacity-70 transition-opacity" title="Clear filter">✕</Link>
                </div>
              )}

              {/* Controls (Sort + View toggles) */}
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700 appearance-none pr-8 cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23475569' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem', backgroundRepeat: 'no-repeat' }}
                >
                  <option value="rating">Top Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="range-desc">Highest Range</option>
                </select>

                {/* View switcher */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/30">
                  <button 
                    onClick={() => setViewMode("detailed")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === "detailed" ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    📝 <span className="hidden sm:inline">Detailed</span>
                  </button>
                  <button 
                    onClick={() => setViewMode("compact")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === "compact" ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    🎛️ <span className="hidden sm:inline">Compact</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Vehicle Grid */}
            {loadingVehicles ? (
              <div className={`grid gap-6 ${viewMode === "compact" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={cardStyles.card} aria-hidden="true">
                    <div className="h-full w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100">
                      <div className="h-40 w-full rounded-t-2xl bg-slate-200/70" />
                      <div className="flex flex-col gap-2 p-4">
                        <div className="h-4 w-2/3 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-200/80" />
                        <div className="mt-2 h-5 w-1/3 rounded bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-lg font-bold text-slate-700">No vehicles found matching filters</p>
                <p className="text-sm text-slate-500 mt-2">Try adjusting your pricing limit or search keywords.</p>
                <button 
                  onClick={handleClearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors mt-4"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === "compact" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
                {filteredVehicles.map((vehicle) => {
                  const isCompared = compareVehicles.some(v => v.id === vehicle.id);
                  const monthlyEmi = calculateEMI(vehicle.price);
                  const primarySpec = vehicle.isEV
                    ? `${vehicle.rangeKm ?? "--"} km range`
                    : vehicle.engineCc
                    ? `${vehicle.engineCc} cc`
                    : vehicle.fuel;

                  return (
                    <div key={vehicle.id} className={cardStyles.card}>
                      {/* Slide 1: photo (visible at rest) */}
                      <div className={`${cardStyles.slide} ${cardStyles.slide1}`}>
                        <VehiclePhoto vehicle={vehicle} />

                        {/* Top overlay: compare checkbox + rating */}
                        <div className={cardStyles.topbar}>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-extrabold text-slate-700 select-none bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm">
                            <input
                              type="checkbox"
                              checked={isCompared}
                              onChange={(e) => handleCompareCheck(vehicle, e.target.checked)}
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 accent-blue-600 cursor-pointer"
                            />
                            <span className="flex items-center gap-0.5"><CompareIcon /> Compare</span>
                          </label>

                          <div className="flex items-center bg-white/90 backdrop-blur-sm border border-yellow-200 px-2 py-1 rounded-lg shadow-sm">
                            <StarIcon />
                            <span className="text-[11px] font-black text-slate-700">5.0</span>
                          </div>
                        </div>

                        {/* Caption: model + price, visible at rest */}
                        <div className={cardStyles.caption}>
                          <p className={cardStyles.captionModel}>{vehicle.brand} {vehicle.model}</p>
                          <p className={cardStyles.captionPrice}>Rs. {vehicle.price.toLocaleString("en-NP")}</p>
                        </div>
                      </div>

                      {/* Slide 2: detail panel that slides up on hover */}
                      <div className={`${cardStyles.slide} ${cardStyles.slide2}`}>
                        <div className={cardStyles.content}>
                          <h3>{vehicle.brand} {vehicle.model}</h3>
                          <p className={cardStyles.variant}>{vehicle.variant || "Standard"}</p>

                          <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500">
                            <span>{primarySpec}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span>{vehicle.seatingCapacity} Seats</span>
                            <span className="text-slate-300">&bull;</span>
                            <span>{vehicle.transmission}</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                            <p className="text-sm font-black text-slate-900 leading-tight">
                              Rs. {vehicle.price.toLocaleString("en-NP")}
                            </p>
                            <p className="text-[11px] font-bold text-blue-600 leading-tight">
                              EMI from Rs. {monthlyEmi.toLocaleString("en-NP")}/mo
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCompareCheck(vehicle, !isCompared)}
                              className={`flex-1 text-center font-extrabold text-xs py-2 rounded-xl border transition-colors ${
                                isCompared
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {isCompared ? "Added ✓" : "Compare"}
                            </button>
                            <Link
                              href={`/vehicle/${vehicle.id}`}
                              className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 rounded-xl transition-colors"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. EMI Calculator Modal Popup */}
      {selectedEmiVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col p-6 gap-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedEmiVehicle(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50"
            >
              &times;
            </button>

            {/* Title Header */}
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Interactive calculator</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">EMI Calculator</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {selectedEmiVehicle.brand} {selectedEmiVehicle.model} ({selectedEmiVehicle.variant || "Standard"})
              </p>
            </div>

            {/* Price Info Banner */}
            <div className="bg-blue-50 border border-blue-100/70 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Price (Ex-Showroom)</span>
                <span className="text-lg font-black text-blue-950 mt-0.5 block">
                  Rs. {selectedEmiVehicle.price.toLocaleString("en-NP")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Est. On-Road Price</span>
                <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                  Rs. {Math.round(calculateNepalOnRoadPrice({
                    category: 'EV',
                    engineCc: selectedEmiVehicle.batteryKwh || 0,
                    basePriceNPR: selectedEmiVehicle.price
                  }).totalOnRoadPrice).toLocaleString("en-NP")}
                </span>
              </div>
            </div>

            {/* Inputs sliders */}
            <div className="flex flex-col gap-4">
              {/* Downpayment Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Down Payment ({downPaymentPercent}%)</span>
                  <span className="text-blue-600">Rs. {(selectedEmiVehicle.price * downPaymentPercent / 100).toLocaleString("en-NP")}</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="90" 
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                />
              </div>

              {/* Loan Tenure Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Loan Period / Tenure</span>
                  <span className="text-blue-600">{tenureYears} Years ({tenureYears * 12} Months)</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                />
              </div>

              {/* Interest Rate Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Interest Rate</span>
                  <span className="text-blue-600">{interestRate}% per annum</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="15" 
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Calculations Output */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Monthly EMI Installment</span>
                <span className="text-3xl font-black text-blue-600 block mt-1" id="calculated-emi-val">
                  Rs. {calculateEMI(selectedEmiVehicle.price).toLocaleString("en-NP")}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block mt-1">Calculated on Ex-Showroom base</span>
              </div>
              <button 
                onClick={() => setSelectedEmiVehicle(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-500/20"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer Layout */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-12 w-full text-center flex flex-col gap-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-semibold text-slate-500">
          <Link href="#" className="hover:text-blue-600 transition-colors">EV Price List</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Electric Cars</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Electric Scooters</Link>
          <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare EVs</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">EMI Calculator</Link>
          <Link href="/used" className="hover:text-blue-600 transition-colors">Used EVs</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Brands</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Charging Stations</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">News</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Community</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">About</Link>
        </div>

        <div className="text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          Copyright © 2026 SaaS Nepal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default function EVNepalHome() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 text-lg">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

