"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAppStore } from "@/lib/store";
import { getVehicles, getVehicleById, getPopularComparisons, getAllComparisons, ExtendedVehicle } from "@/lib/vehicles-db";
import { calculateNepalOnRoadPrice } from "@/lib/tax-engine";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";

// Custom icons
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
    <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1">
    <line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 shrink-0">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// Deterministic soft tint per brand so placeholder cards stay distinguishable but cohesive.
function brandHue(brand: string) {
  let h = 0;
  for (let i = 0; i < brand.length; i++) h = (h * 31 + brand.charCodeAt(i)) >>> 0;
  return h % 360;
}

// Vehicle image with a branded fallback (real photos live in /images but may be absent).
function VehicleThumb({ vehicle, className = "" }: { vehicle: ExtendedVehicle; className?: string }) {
  const src = vehicle.images?.[0];
  const [failed, setFailed] = useState(false);
  const hue = brandHue(vehicle.brand);
  const showImg = Boolean(src) && !failed;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={showImg ? undefined : { background: `linear-gradient(135deg, hsl(${hue} 45% 96%), hsl(${(hue + 38) % 360} 48% 89%))` }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${vehicle.brand} ${vehicle.model}`}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <>
          <span
            className="absolute bottom-[18%] h-1/4 w-2/3 rounded-full blur-md"
            style={{ background: `hsl(${hue} 55% 70% / 0.4)` }}
          />
          <span
            className="relative font-black uppercase tracking-widest leading-none"
            style={{ color: `hsl(${hue} 34% 44%)`, opacity: 0.6 }}
          >
            {vehicle.brand}
          </span>
        </>
      )}
    </div>
  );
}

// A single selectable vehicle card used inside the picker grid.
function VehiclePickCard({
  vehicle,
  selected,
  onClick,
}: {
  vehicle: ExtendedVehicle;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={selected}
      aria-pressed={selected}
      className={`group text-left rounded-2xl border overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        selected
          ? "border-blue-300 bg-blue-50/50 cursor-default ring-1 ring-blue-200"
          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="relative">
        <VehicleThumb vehicle={vehicle} className="h-28 w-full text-xl" />
        <span className="absolute top-2 left-2 bg-white/85 backdrop-blur-sm text-[9px] font-black uppercase tracking-wider text-slate-600 px-2 py-0.5 rounded-full">
          {vehicle.fuel === "Electric" ? "EV" : vehicle.fuel} · {vehicle.type}
        </span>
        {selected && (
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckIcon /> In compare
          </span>
        )}
      </div>
      <div className="p-3">
        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{vehicle.brand}</span>
        <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate">{vehicle.model}</h4>
        <p className="text-[11px] font-bold text-slate-400 truncate">{vehicle.variant}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-black text-slate-900">Rs. {(vehicle.price / 100000).toFixed(1)}L</span>
          <span className="text-[10px] font-bold text-slate-400">{vehicle.rangeKm ? `${vehicle.rangeKm} km` : ""}</span>
        </div>
      </div>
    </button>
  );
}

// Full-screen card picker that replaces the old name-only dropdown / select.
function VehiclePickerModal({
  slotIndex,
  vehicles,
  selectedIds,
  search,
  setSearch,
  fuel,
  setFuel,
  onSelect,
  onClose,
}: {
  slotIndex: number;
  vehicles: ExtendedVehicle[];
  selectedIds: string[];
  search: string;
  setSearch: (v: string) => void;
  fuel: "all" | "ev" | "petrol";
  setFuel: (v: "all" | "ev" | "petrol") => void;
  onSelect: (index: number, id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const currentId = selectedIds[slotIndex];
  const q = search.trim().toLowerCase();
  const filtered = vehicles.filter((v) => {
    const matchesText = q === "" || `${v.brand} ${v.model} ${v.variant}`.toLowerCase().includes(q);
    const matchesFuel =
      fuel === "all" || (fuel === "ev" && v.fuel === "Electric") || (fuel === "petrol" && v.fuel === "Petrol");
    return matchesText && matchesFuel;
  });

  const fuelTabs: { key: "all" | "ev" | "petrol"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ev", label: "Electric" },
    { key: "petrol", label: "Petrol" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Select vehicle for slot ${slotIndex + 1}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Slot {slotIndex + 1}</span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Pick a car to compare</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Tap a card to add it to this slot</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center transition-all shrink-0"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-grow focus-within:border-blue-400 focus-within:bg-white transition-colors">
              <SearchIcon />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by brand, model or variant"
                className="w-full text-sm font-semibold bg-transparent border-none focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
                autoFocus
              />
            </div>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
              {fuelTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFuel(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fuel === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-extrabold text-slate-700 text-sm">No cars match your search</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Try a different name or clear the filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((v) => (
                <VehiclePickCard
                  key={v.id}
                  vehicle={v}
                  selected={selectedIds.includes(v.id) && v.id !== currentId}
                  onClick={() => onSelect(slotIndex, v.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// We wrap the main Compare page in a Suspense boundary because next.js app router uses searchParams which requires suspense client side.
function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { compareVehicles, addToCompare, removeFromCompare, clearCompare, setSearchFilters } = useAppStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"hub" | "details">("hub");
  const [allVehiclesList, setAllVehiclesList] = useState<ExtendedVehicle[]>([]);

  // Card picker states (slot the picker is open for + its search / fuel filter)
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [pickerFuel, setPickerFuel] = useState<"all" | "ev" | "petrol">("all");

  // Pagination states for all comparisons
  const [allComparisonsPage, setAllComparisonsPage] = useState(1);
  const compsPerPage = 5;

  // Initialize catalogs
  useEffect(() => {
    setAllVehiclesList(getVehicles());
  }, []);

  // Sync selection based on URL search params (?ids=id1,id2) OR fall back to Zustand compared list
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").filter(id => id.trim() !== "");
      setSelectedIds(ids);
      setActiveTab("details");
    } else if (compareVehicles.length > 0) {
      setSelectedIds(compareVehicles.map(v => v.id));
      setActiveTab("details");
    } else {
      setSelectedIds([]);
      setActiveTab("hub");
    }
  }, [searchParams, compareVehicles]);

  const handleUpdateUrl = (ids: string[]) => {
    if (ids.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?ids=${ids.join(",")}`);
    }
  };

  const handleRemoveVehicle = (id: string) => {
    const nextIds = selectedIds.filter(x => x !== id);
    setSelectedIds(nextIds);
    removeFromCompare(id);
    handleUpdateUrl(nextIds);
  };

  const handleClearAll = () => {
    setSelectedIds([]);
    clearCompare();
    handleUpdateUrl([]);
  };

  const handleSelectSlotVehicle = (index: number, id: string) => {
    const nextIds = [...selectedIds];
    nextIds[index] = id;
    const cleanIds = nextIds.filter(Boolean);
    setSelectedIds(cleanIds);
    
    // Add to Zustand store as well
    const vehicleObj = getVehicleById(id);
    if (vehicleObj) {
      addToCompare(vehicleObj);
    }
    
    setActiveDropdownIndex(null);
    setDropdownSearch("");
    handleUpdateUrl(cleanIds);
  };

  const handlePopularCompareTrigger = (name1: string, name2: string) => {
    // Find matching vehicles by name
    const v1 = allVehiclesList.find(v => `${v.brand} ${v.model}`.toLowerCase().includes(name1.toLowerCase()));
    const v2 = allVehiclesList.find(v => `${v.brand} ${v.model}`.toLowerCase().includes(name2.toLowerCase()));
    
    if (v1 && v2) {
      addToCompare(v1);
      addToCompare(v2);
      handleUpdateUrl([v1.id, v2.id]);
    } else {
      // Fallback: load random 2 matching
      const targetIds = [allVehiclesList[0]?.id, allVehiclesList[1]?.id].filter(Boolean);
      handleUpdateUrl(targetIds);
    }
  };

  // Specs rows configuration matching Image 4
  const SPEC_ROWS = [
    { label: "Price", key: "price", format: (v: ExtendedVehicle) => v.price ? `Rs. ${v.price.toLocaleString("en-NP")}` : "N/A", highlight: true },
    { 
      label: "EMI", 
      key: "emi", 
      format: (v: ExtendedVehicle) => {
        if (!v.price) return "N/A";
        // 40% down, 7 years, 8.5%
        const loan = v.price * 0.6;
        const r = (8.5 / 12) / 100;
        const n = 7 * 12;
        const emi = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return `Rs. ${Math.round(emi).toLocaleString("en-NP")}/month`;
      },
      bold: true 
    },
    { label: "Battery Capacity", key: "batteryKwh", format: (v: ExtendedVehicle) => v.batteryKwh ? `${v.batteryKwh} kWh` : "N/A" },
    { label: "Range", key: "rangeKm", format: (v: ExtendedVehicle) => v.rangeKm ? `${v.rangeKm} Km` : "N/A" },
    { label: "Motor Power", key: "horsepower", format: (v: ExtendedVehicle) => v.horsepower ? `${v.horsepower} kW` : "N/A" }, // Horsepower maps to Motor Power kW for EVs in our list
    { label: "Torque", key: "torque", format: (v: ExtendedVehicle) => v.torqueLabel ? v.torqueLabel : (v.torque ? `${v.torque} Nm` : "N/A") },
    { label: "Ground Clearance", key: "groundClearance", format: (v: ExtendedVehicle) => v.groundClearance ? `${v.groundClearance} mm` : "N/A" },
    { label: "Boot Space", key: "bootSpace", format: (v: ExtendedVehicle) => v.bootSpace ? `${v.bootSpace} Liters` : "N/A" },
    { label: "Safety Rating", key: "safetyRating", format: (v: ExtendedVehicle) => v.safetyRating ? `${v.safetyRating} Stars` : "N/A" },
    { label: "Dimensions", key: "dimensions", format: (v: ExtendedVehicle) => v.dimensions ? v.dimensions : "N/A" },
    { label: "Drive Type", key: "driveType", format: (v: ExtendedVehicle) => v.driveType ? v.driveType : "N/A" },
    { label: "Seating Capacity", key: "seatingCapacity", format: (v: ExtendedVehicle) => v.seatingCapacity ? `${v.seatingCapacity} People` : "N/A" },
    { label: "Total Airbags", key: "totalAirbags", format: (v: ExtendedVehicle) => v.totalAirbags ? String(v.totalAirbags) : "N/A" }
  ];

  // Resolve vehicles from selectedIds
  const comparedVehiclesList = selectedIds
    .map(id => getVehicleById(id))
    .filter((v): v is ExtendedVehicle => v !== undefined);

  // Paginated "All Comparisons"
  const allComparisonsList = getAllComparisons();
  const totalCompsPages = Math.ceil(allComparisonsList.length / compsPerPage);
  const activeComps = allComparisonsList.slice(
    (allComparisonsPage - 1) * compsPerPage,
    allComparisonsPage * compsPerPage
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-blue-600 tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
            </svg>
            <span>SaaS Nepal</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Find cars</Link>
            <Link href="/#used-marketplace" className="hover:text-blue-600 transition-colors">Used car</Link>
            <UserMenu signInClassName="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs transition-all" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow flex flex-col gap-8">
        
        {activeTab === "hub" || comparedVehiclesList.length === 0 ? (
          /* ========================================================================= */
          /* MODE: COMPARISON HUB (Select slots & browse popular)                       */
          /* ========================================================================= */
          <div className="flex flex-col gap-10">
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Compare Electric Vehicles</h1>
              <p className="text-slate-500 font-medium mt-2 text-sm">Select vehicles to compare their specifications side-by-side</p>
            </div>

            {/* Selection Slots Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((slotIndex) => {
                const vehicle = comparedVehiclesList[slotIndex];

                return (
                  <div 
                    key={slotIndex}
                    className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center min-h-64 relative shadow-sm hover:border-slate-300 transition-colors"
                  >
                    {vehicle ? (
                      /* Slot with Vehicle — image card */
                      <div className="w-full flex flex-col gap-4">
                        <button
                          onClick={() => handleRemoveVehicle(vehicle.id)}
                          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-red-500 bg-white/80 backdrop-blur-sm hover:bg-white p-1.5 rounded-full border border-slate-100 transition-all"
                          title="Remove"
                          id={`remove-slot-${slotIndex}`}
                        >
                          <CloseIcon />
                        </button>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Slot {slotIndex + 1}</span>
                        </div>

                        <VehicleThumb vehicle={vehicle} className="h-32 w-full rounded-2xl border border-slate-100 text-2xl" />

                        <div className="text-center">
                          <h4 className="font-extrabold text-slate-900 text-base leading-snug">{vehicle.brand} {vehicle.model}</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{vehicle.variant}</p>
                          <p className="text-sm font-black text-slate-900 mt-2">Rs. {vehicle.price.toLocaleString("en-NP")}</p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveDropdownIndex(slotIndex);
                            setDropdownSearch("");
                          }}
                          className="w-full text-center bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 font-bold text-xs py-2.5 rounded-xl transition-all"
                          id={`change-slot-${slotIndex}`}
                        >
                          Change car
                        </button>
                      </div>
                    ) : (
                      /* Slot Empty — opens the card picker */
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDropdownIndex(slotIndex);
                          setDropdownSearch("");
                        }}
                        className="w-full flex flex-col items-center text-center gap-4 py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
                        id={`select-btn-${slotIndex}`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                          <PlusIcon />
                        </div>
                        <span className="text-sm font-extrabold text-slate-600">Select Vehicle {slotIndex + 1}</span>
                        <span className="bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl group-hover:bg-blue-700 transition-colors">
                          Browse cars
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Compare Now Trigger */}
            {comparedVehiclesList.length >= 2 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => handleUpdateUrl(comparedVehiclesList.map(v => v.id))}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/25"
                  id="trigger-compare-detail"
                >
                  Compare Specifications &rarr;
                </button>
              </div>
            )}

            {/* Popular Comparisons */}
            <section className="flex flex-col gap-4 border-t border-slate-200/60 pt-10">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Popular Comparisons</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">View most compared vehicles and models in Nepal</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                {getPopularComparisons().map((pop, i) => (
                  <div 
                    key={i} 
                    onClick={() => handlePopularCompareTrigger(pop.name1, pop.name2)}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{pop.name1} vs {pop.name2}</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1.5 leading-relaxed">{pop.desc}</p>
                    </div>
                    <span className="text-blue-600 font-bold text-xs hover:underline mt-4 inline-block">&rarr; Compare Now</span>
                  </div>
                ))}
              </div>
            </section>

            {/* All EV Comparisons Table */}
            <section className="flex flex-col gap-4 border-t border-slate-200/60 pt-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">All EV Comparisons</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">Full database of electric car head-to-head match-ups</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-2">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold text-xs">
                      <th className="p-4 pl-6">Vehicle 1</th>
                      <th className="p-4">vs</th>
                      <th className="p-4">Vehicle 2</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {activeComps.map((comp) => (
                      <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div>
                            <span className="block font-bold text-slate-800">{comp.v1}</span>
                            <span className="text-[10px] text-slate-400">{comp.price1}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-extrabold">VS</td>
                        <td className="p-4">
                          <div>
                            <span className="block font-bold text-slate-800">{comp.v2}</span>
                            <span className="text-[10px] text-slate-400">{comp.price2}</span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button 
                            onClick={() => handleUpdateUrl(comp.ids)}
                            className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                          >
                            Compare
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalCompsPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <button 
                    onClick={() => setAllComparisonsPage(prev => Math.max(1, prev - 1))}
                    disabled={allComparisonsPage === 1}
                    className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold ${allComparisonsPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalCompsPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setAllComparisonsPage(i + 1)}
                      className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${allComparisonsPage === i + 1 ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => setAllComparisonsPage(prev => Math.min(totalCompsPages, prev + 1))}
                    disabled={allComparisonsPage === totalCompsPages}
                    className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold ${allComparisonsPage === totalCompsPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE: COMPARISON DETAILS (Side-by-side spec comparisons)                   */
          /* ========================================================================= */
          <div className="flex flex-col gap-6">
            
            {/* Header Control Buttons */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleClearAll();
                  }}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center"
                >
                  <BackIcon /> Back
                </button>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Compare Cars ({comparedVehiclesList.length})
                </h1>
              </div>
              <button 
                onClick={handleClearAll}
                className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-100 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all"
              >
                Clear All
              </button>
            </div>

            {/* Spec Matrix Columns container */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
              <div className="min-w-[800px] flex flex-col">
                
                {/* Column Headers (Vehicle cards) */}
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                  {/* Left Label column spacer */}
                  <div className="w-1/4 p-6 border-r border-slate-100 flex flex-col justify-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Specifications</span>
                  </div>
                  
                  {/* Vehicle columns */}
                  {comparedVehiclesList.map((vehicle, index) => (
                    <div 
                      key={vehicle.id} 
                      className="w-1/4 p-6 border-r border-slate-100 last:border-r-0 flex flex-col gap-4 relative group"
                    >
                      {/* Close button column */}
                      <button
                        onClick={() => handleRemoveVehicle(vehicle.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-white p-1 rounded-full border border-slate-200/50 transition-all opacity-70 group-hover:opacity-100"
                        title="Remove"
                        id={`remove-slot-${index}`}
                      >
                        <CloseIcon />
                      </button>

                      {/* Photo box (real image with branded fallback) */}
                      <div className="h-24 w-full rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                        <VehicleThumb vehicle={vehicle} className="h-full w-full text-xl" />
                      </div>

                      {/* Meta titles */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{vehicle.brand}</span>
                        <h3 className="font-extrabold text-slate-900 text-sm mt-0.5 leading-snug">{vehicle.model}</h3>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">{vehicle.variant}</p>
                      </div>

                      {/* Card-based swap trigger */}
                      <button
                        onClick={() => {
                          setActiveDropdownIndex(index);
                          setDropdownSearch("");
                        }}
                        className="w-full text-center bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 font-bold text-[11px] py-2 rounded-lg transition-all"
                        id={`swap-slot-${index}`}
                      >
                        Change car
                      </button>
                    </div>
                  ))}
                  
                  {/* Empty slots placeholders if compared list < 3 */}
                  {Array.from({ length: Math.max(0, 3 - comparedVehiclesList.length) }).map((_, i) => {
                    const slotIdx = comparedVehiclesList.length + i;
                    return (
                      <div key={i} className="w-1/4 p-6 border-r border-slate-100 last:border-r-0 flex flex-col items-center justify-center bg-slate-50/20 text-center gap-2">
                        <span className="text-slate-300 text-xl font-bold">+</span>
                        <button
                          onClick={() => {
                            setActiveDropdownIndex(slotIdx);
                            setDropdownSearch("");
                          }}
                          className="border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
                        >
                          Add Car
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Rows data */}
                <div className="flex flex-col divide-y divide-slate-100">
                  {SPEC_ROWS.map((row) => (
                    <div key={row.key} className="flex hover:bg-slate-50/50 transition-colors">
                      {/* Left spec name column */}
                      <div className="w-1/4 p-4 pl-6 border-r border-slate-100 bg-slate-50/10 font-bold text-slate-500 text-xs flex items-center">
                        {row.label}
                      </div>
                      
                      {/* Compared values */}
                      {comparedVehiclesList.map((vehicle) => {
                        const val = row.format(vehicle);
                        return (
                          <div 
                            key={vehicle.id} 
                            className={`w-1/4 p-4 border-r border-slate-100 last:border-r-0 text-xs flex items-center ${row.highlight ? 'text-blue-600 font-extrabold text-sm' : 'text-slate-700 font-semibold'} ${row.bold ? 'font-black text-slate-900' : ''}`}
                          >
                            {val}
                          </div>
                        );
                      })}

                      {/* Empty values fillers */}
                      {Array.from({ length: Math.max(0, 3 - comparedVehiclesList.length) }).map((_, i) => (
                        <div key={i} className="w-1/4 p-4 border-r border-slate-100 last:border-r-0 text-slate-300 italic text-xs flex items-center justify-center">
                          —
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Action button rows */}
                <div className="flex border-t border-slate-100 bg-slate-50/30">
                  <div className="w-1/4 p-4 pl-6 border-r border-slate-100 bg-slate-50/10"></div>
                  {comparedVehiclesList.map((vehicle) => (
                    <div key={vehicle.id} className="w-1/4 p-4 border-r border-slate-100 last:border-r-0">
                      <Link 
                        href={`/vehicle/${vehicle.id}`}
                        className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all"
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparedVehiclesList.length) }).map((_, i) => (
                    <div key={i} className="w-1/4 p-4 border-r border-slate-100 last:border-r-0"></div>
                  ))}
                </div>

              </div>
            </div>

            {/* Calculations Banner */}
            <div className="bg-slate-100 border border-slate-200/80 p-4 rounded-2xl text-center text-[11px] sm:text-xs font-bold text-slate-500 tracking-wide">
              EMI Calculation: Based on 40% down payment, 7 years loan period, 8.5% interest rate
            </div>

            {/* Related comparisons */}
            <section className="flex flex-col gap-4 border-t border-slate-200/60 pt-10 mt-4">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">You May Also Want to Compare</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Explore similar EV matchups trending in the market</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                {getPopularComparisons().slice(0, 3).map((pop, i) => (
                  <div 
                    key={i} 
                    onClick={() => handlePopularCompareTrigger(pop.name1, pop.name2)}
                    className="bg-white border border-slate-200/85 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{pop.name1} vs {pop.name2}</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1.5 leading-relaxed">{pop.desc}</p>
                    </div>
                    <span className="text-blue-600 font-bold text-xs hover:underline mt-4 inline-block">&rarr; Compare Now</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Card-based vehicle picker */}
      {activeDropdownIndex !== null && (
        <VehiclePickerModal
          slotIndex={activeDropdownIndex}
          vehicles={allVehiclesList}
          selectedIds={selectedIds}
          search={dropdownSearch}
          setSearch={setDropdownSearch}
          fuel={pickerFuel}
          setFuel={setPickerFuel}
          onSelect={handleSelectSlotVehicle}
          onClose={() => {
            setActiveDropdownIndex(null);
            setDropdownSearch("");
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-12 w-full text-center flex flex-col gap-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">EV Price List</Link>
          <Link href="/" className="hover:text-blue-600 transition-colors">Electric Cars</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Electric Scooters</Link>
          <Link href="/compare" className="hover:text-blue-600 transition-colors">Compare EVs</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">EMI Calculator</Link>
          <Link href="/#used-marketplace" className="hover:text-blue-600 transition-colors">Used EVs</Link>
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

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-semibold text-sm">Loading Comparisons...</p>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}
