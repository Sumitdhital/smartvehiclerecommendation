"use client";

import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  const router = useRouter();
  const { searchFilters, setLastResults, lastResults, addToCompare, compareVehicles } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Redirect to home if no budget set
  useEffect(() => {
    if (!searchFilters.budget) {
      router.replace("/");
    }
  }, [searchFilters.budget, router]);

  useEffect(() => {
    if (!searchFilters.budget) return;

    async function fetchRecommendations() {
      setLoading(true);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchFilters),
        });
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        const data = await res.json();
        setLastResults(data.recommendations);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters.budget]);

  // Sync already-compared vehicles into addedIds on mount
  useEffect(() => {
    if (compareVehicles.length > 0) {
      setAddedIds(new Set(compareVehicles.map((v) => v.id)));
    }
  }, [compareVehicles]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  function handleAddToCompare(vehicle: any) {
    if (addedIds.has(vehicle.id)) {
      router.push("/compare");
      return;
    }
    if (compareVehicles.length >= 4) {
      showToast("You can compare up to 4 vehicles. Remove one first.");
      return;
    }
    addToCompare(vehicle);
    setAddedIds((prev) => new Set([...prev, vehicle.id]));
    showToast(vehicle.brand + " " + vehicle.model + " added to compare!");
  }

  if (!searchFilters.budget) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
        <p className="mt-4 text-slate-600 font-medium">Analyzing Nepali vehicle market...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <p className="text-red-500 text-lg font-semibold mb-4">Something went wrong: {error}</p>
        <Button onClick={() => router.push("/")} variant="outline">Back to Search</Button>
      </div>
    );
  }

  if (!lastResults || lastResults.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4">No vehicles found matching your criteria.</h2>
        <p className="text-slate-500 mb-6">Try increasing your budget or removing some filters.</p>
        <Button onClick={() => router.push("/")} variant="outline">Edit Search</Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Your Top Recommendations</h1>
            <p className="text-slate-500">
              {"Budget: NPR " + (searchFilters.budget || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-3">
            {compareVehicles.length > 0 && (
              <Button
                onClick={() => router.push("/compare")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {"View Compare (" + compareVehicles.length + ")"}
              </Button>
            )}
            <Button onClick={() => router.push("/")} variant="outline">Edit Search</Button>
          </div>
        </div>

        <div className="space-y-6">
          {lastResults.map((vehicle, index) => {
            const isAdded = addedIds.has(vehicle.id);
            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row"
              >
                <div className="bg-slate-100 md:w-1/3 flex flex-col justify-center items-center p-6 border-b md:border-b-0 md:border-r border-slate-200">
                  <span className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-2">
                    {"Rank #" + (vehicle.rank || index + 1)}
                  </span>
                  <h3 className="text-2xl font-bold text-center text-slate-800">
                    {vehicle.brand + " " + vehicle.model}
                  </h3>
                  <span className="text-sm text-slate-500">{vehicle.variant}</span>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">Est. On-Road Price</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {"NPR " + Math.round(vehicle.calculatedOnRoadPrice || vehicle.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-6 md:w-2/3 flex flex-col">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Type</p>
                      <p className="font-semibold text-slate-700">{vehicle.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Fuel</p>
                      <p className="font-semibold text-slate-700">{vehicle.fuel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Mileage</p>
                      <p className="font-semibold text-slate-700">{vehicle.mileage} km/l</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Clearance</p>
                      <p className="font-semibold text-slate-700">{vehicle.ground_clearance} mm</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg flex-1 mb-4">
                    <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                        <path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
                      </svg>
                      Why this matches you
                    </h4>
                    <p className="text-indigo-800 text-sm leading-relaxed">{vehicle.ai_explanation}</p>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => router.push("/vehicle/" + vehicle.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      className={"flex-1 transition-all " + (isAdded ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700")}
                      onClick={() => handleAddToCompare(vehicle)}
                    >
                      {isAdded ? "✓ Added — View Compare" : "Add to Compare"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
