"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAppStore } from "@/lib/store";
import { getVehicles, getVehicleById, getPopularComparisons, getAllComparisons, ExtendedVehicle } from "@/lib/vehicles-db";
import { calculateNepalOnRoadPrice } from "@/lib/tax-engine";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

// We wrap the main Compare page in a Suspense boundary because next.js app router uses searchParams which requires suspense client side.
function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { compareVehicles, addToCompare, removeFromCompare, clearCompare, setSearchFilters } = useAppStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"hub" | "details">("hub");
  const [allVehiclesList, setAllVehiclesList] = useState<ExtendedVehicle[]>([]);

  // Search dropdown states for manual selection boxes
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");

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

  const handleSwapVehicle = (index: number, newId: string) => {
    const nextIds = [...selectedIds];
    nextIds[index] = newId;
    setSelectedIds(nextIds);
    
    const vehicleObj = getVehicleById(newId);
    if (vehicleObj) {
      addToCompare(vehicleObj);
    }
    handleUpdateUrl(nextIds);
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
            <Link href="/" className="hover:text-blue-600 transition-colors">Find an EV</Link>
            <Link href="/#used-marketplace" className="hover:text-blue-600 transition-colors">Used EVs</Link>
            <Link href="/" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs transition-all">Sign In</Link>
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
                const isDropdownOpen = activeDropdownIndex === slotIndex;

                return (
                  <div 
                    key={slotIndex}
                    className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center min-h-64 relative shadow-sm hover:border-slate-300 transition-colors"
                  >
                    {vehicle ? (
                      /* Slot with Vehicle */
                      <div className="w-full flex flex-col items-center text-center gap-4">
                        <button 
                          onClick={() => handleRemoveVehicle(vehicle.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-slate-50 p-1.5 rounded-full border border-slate-100 transition-all"
                          title="Remove"
                          id={`remove-slot-${slotIndex}`}
                        >
                          <CloseIcon />
                        </button>
                        
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Slot {slotIndex + 1} Selected</span>
                        <div className="w-16 h-10 bg-blue-500/5 border border-blue-100 rounded-full flex items-center justify-center text-xs font-black text-blue-600/30 uppercase mt-2">
                          {vehicle.brand}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">{vehicle.brand} {vehicle.model}</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{vehicle.variant}</p>
                        </div>
                        <p className="text-sm font-black text-slate-900">Rs. {vehicle.price.toLocaleString("en-NP")}</p>
                      </div>
                    ) : (
                      /* Slot Empty: Search Box trigger */
                      <div className="w-full flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                          <PlusIcon />
                        </div>
                        <span className="text-sm font-extrabold text-slate-600">Select Vehicle {slotIndex + 1}</span>
                        
                        {!isDropdownOpen ? (
                          <button
                            onClick={() => {
                              setActiveDropdownIndex(slotIndex);
                              setDropdownSearch("");
                            }}
                            className="bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors mt-2"
                            id={`select-btn-${slotIndex}`}
                          >
                            Choose EV
                          </button>
                        ) : (
                          /* Dropdown overlay container */
                          <div className="w-full flex flex-col gap-2 z-10 bg-white border border-slate-200 rounded-2xl p-3 shadow-lg absolute inset-x-2 top-4 bottom-4">
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                              <input 
                                type="text"
                                value={dropdownSearch}
                                onChange={(e) => setDropdownSearch(e.target.value)}
                                placeholder="Search EV..."
                                className="w-full text-xs font-bold bg-transparent border-none focus:outline-none py-1"
                                autoFocus
                              />
                              <button 
                                onClick={() => setActiveDropdownIndex(null)}
                                className="text-slate-400 hover:text-slate-600 text-xs"
                              >
                                &times;
                              </button>
                            </div>
                            
                            <div className="overflow-y-auto flex-1 flex flex-col text-left gap-1 pr-1">
                              {allVehiclesList
                                .filter(v => `${v.brand} ${v.model}`.toLowerCase().includes(dropdownSearch.toLowerCase()))
                                .map(v => (
                                  <button
                                    key={v.id}
                                    onClick={() => handleSelectSlotVehicle(slotIndex, v.id)}
                                    className="text-xs font-semibold hover:bg-slate-50 p-2 rounded-lg text-slate-700 flex justify-between items-center transition-colors"
                                    id={`select-option-${v.id}`}
                                  >
                                    <span>{v.brand} {v.model}</span>
                                    <span className="text-slate-400 font-mono text-[10px]">Rs. {(v.price/100000).toFixed(1)}L</span>
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </div>
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

                      {/* Dropdown swap selector */}
                      <div className="w-32">
                        <select
                          value={vehicle.id}
                          onChange={(e) => handleSwapVehicle(index, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-500 appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.25rem center', backgroundSize: '0.85rem', backgroundRepeat: 'no-repeat' }}
                        >
                          {allVehiclesList.map(v => (
                            <option key={v.id} value={v.id}>{v.brand} {v.model}</option>
                          ))}
                        </select>
                      </div>

                      {/* Photo box */}
                      <div className="h-24 w-full rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden relative shadow-sm">
                        <span className="text-2xl font-extrabold text-blue-500/20 uppercase tracking-wider">{vehicle.brand}</span>
                      </div>

                      {/* Meta titles */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{vehicle.brand}</span>
                        <h3 className="font-extrabold text-slate-900 text-sm mt-0.5 leading-snug">{vehicle.model}</h3>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">{vehicle.variant}</p>
                      </div>
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
                            setActiveTab("hub");
                          }}
                          className="border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
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
