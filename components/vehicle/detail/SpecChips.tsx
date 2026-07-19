import React from "react";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { I, IconComponent } from "./icons";
import { HighlightTile } from "./primitives";

type Chip = { icon: IconComponent; label: string; value: string };

/** Builds the highlight chips shown between the hero and the tab bar. */
export function buildSpecChips(v: ExtendedVehicle): Chip[] {
  const isEV = v.fuel === "Electric";
  return [
    { icon: I.gauge, label: "Power", value: `${v.horsepower} PS` },
    { icon: I.torque, label: "Torque", value: v.torqueLabel ?? `${v.torque} Nm` },
    ...(v.safetyRating ? [{ icon: I.shield, label: "Safety Rating", value: `${v.safetyRating} Star` }] : []),
    { icon: I.clearance, label: "Ground Clearance", value: `${v.groundClearance} mm` },
    ...(v.dimensions ? [{ icon: I.ruler, label: "Dimensions", value: v.dimensions.replaceAll("x", "×") }] : []),
    ...(v.driveType ? [{ icon: I.drive, label: "Drive Type", value: v.driveType }] : []),
    { icon: I.seat, label: "Seating Capacity", value: `${v.seatingCapacity} People` },
    ...(v.totalAirbags ? [{ icon: I.airbag, label: "Total Airbags", value: `${v.totalAirbags}` }] : []),
    ...(v.bootSpace ? [{ icon: I.boot, label: "Boot Space", value: `${v.bootSpace} Liters` }] : []),
    ...(v.rangeKm ? [{ icon: I.range, label: "Range", value: `${v.rangeKm} Km` }] : []),
    ...(isEV && v.batteryKwh ? [{ icon: I.battery, label: "Battery Capacity", value: `${v.batteryKwh} kWh` }] : []),
  ];
}

export function SpecChips({ vehicle }: { vehicle: ExtendedVehicle }) {
  const chips = buildSpecChips(vehicle);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {chips.map((c) => (
        <HighlightTile key={c.label} {...c} />
      ))}
    </div>
  );
}
