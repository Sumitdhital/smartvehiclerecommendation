"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function VehicleActionButtons({ vehicle }: { vehicle: any }) {
  const { addToCompare, compareVehicles } = useAppStore();
  const router = useRouter();
  const isAdded = compareVehicles.some((v) => v.id === vehicle.id);

  function handleCompare() {
    if (!isAdded) {
      if (compareVehicles.length >= 4) {
        alert("You can only compare up to 4 vehicles. Remove one first.");
        return;
      }
      addToCompare(vehicle);
    }
    router.push("/compare");
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        className={"w-full h-12 text-base transition-all " + (isAdded ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700")}
        onClick={handleCompare}
      >
        {isAdded ? "✓ Added — View Compare" : "Add to Compare"}
      </Button>
      <Button
        className="w-full h-12 text-base bg-slate-900 hover:bg-slate-700"
        onClick={() => alert("Save feature coming soon in the Auth phase!")}
      >
        Save to Profile
      </Button>
    </div>
  );
}

export function VehiclePageGuard({ children }: { children: React.ReactNode }) {
  const { searchFilters } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!searchFilters.budget) {
      router.replace("/");
    }
  }, [searchFilters.budget, router]);

  if (!searchFilters.budget) return null;
  return <>{children}</>;
}
