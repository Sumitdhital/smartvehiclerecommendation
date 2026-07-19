import React from "react";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { Card, CardTitle, GroupLabel, SpecRow } from "./primitives";
import { npr, psToKw } from "./format";

/** Overview prose block. */
export function OverviewSection({ vehicle: v }: { vehicle: ExtendedVehicle }) {
  const isEV = v.fuel === "Electric";
  const motorKw = isEV ? psToKw(v.horsepower) : null;
  return (
    <section id="overview" className="scroll-mt-36">
      <Card className="p-5 sm:p-7">
        <CardTitle title={`${v.brand} ${v.model} Overview`} />
        <div className="space-y-4 text-[15px] font-medium leading-relaxed text-slate-600">
          <p>{v.description}</p>
          <p>
            Launched in {v.yearLaunched}, the {v.brand} {v.model} {v.variant} is a {v.type.toLowerCase()} priced at {npr(v.price)} in Nepal.
            {isEV && v.batteryKwh && v.rangeKm
              ? ` It is powered by a ${motorKw} kW permanent magnet synchronous motor paired with a ${v.batteryKwh} kWh battery, delivering a claimed range of ${v.rangeKm} km on a single charge. The car produces ${v.horsepower} PS of power and ${v.torqueLabel ?? `${v.torque} Nm`} of torque, mated to an automatic transmission and ${v.driveType ?? "front-wheel"} drive configuration.`
              : ` It produces ${v.horsepower} PS of power and ${v.torque} Nm of torque through a ${v.transmission.toLowerCase()} transmission${v.driveType ? ` with ${v.driveType} drive` : ""}.`}
            {" "}With {v.groundClearance} mm of ground clearance and seating for {v.seatingCapacity}, it is well suited to everyday driving on Nepal&apos;s mixed roads.
          </p>
        </div>
      </Card>
    </section>
  );
}

/** Full label-value specifications grouped into sections. */
export function SpecTables({ vehicle: v }: { vehicle: ExtendedVehicle }) {
  const isEV = v.fuel === "Electric";
  const motorKw = isEV ? psToKw(v.horsepower) : null;
  const [dimL, dimW, dimH] = (v.dimensions ?? "").split("x").map((s) => s.trim().replace(" mm", ""));
  const acChargeHrs = isEV && v.batteryKwh ? Math.ceil(v.batteryKwh / 7) : null;

  return (
    <section id="specifications" className="scroll-mt-36">
      <Card className="p-5 sm:p-7">
        <CardTitle title={`${v.brand} ${v.model} Specifications`} sub="Full technical specifications." />
        <dl>
          {isEV && (
            <>
              <GroupLabel>Battery</GroupLabel>
              {v.batteryKwh ? <SpecRow label="Capacity (kWh)" value={v.batteryKwh} /> : null}
              <SpecRow label="Type" value="Lithium-ion" />

              <GroupLabel>Range</GroupLabel>
              {v.rangeKm ? <SpecRow label="Claimed Range" value={`${v.rangeKm} km`} /> : null}
              {v.batteryKwh && v.rangeKm ? (
                <SpecRow label="Efficiency" value={`${(v.rangeKm / v.batteryKwh).toFixed(1)} km/kWh`} />
              ) : null}

              <GroupLabel>Charging</GroupLabel>
              <SpecRow label="AC Charging" value="Type 2" />
              <SpecRow label="DC Fast Charging" value="CCS 2" />
              {acChargeHrs ? <SpecRow label="Full Charge (7 kW AC)" value={`~${acChargeHrs} hours`} /> : null}
            </>
          )}

          <GroupLabel>{isEV ? "Motor & Performance" : "Engine & Performance"}</GroupLabel>
          {!isEV && v.engineCc ? <SpecRow label="Engine (cc)" value={v.engineCc.toLocaleString("en-IN")} /> : null}
          {motorKw ? <SpecRow label="Power (kW)" value={motorKw} /> : null}
          <SpecRow label="Power (PS)" value={v.horsepower} />
          <SpecRow label="Torque (Nm)" value={v.torqueLabel ?? v.torque} />
          {v.topSpeed ? <SpecRow label="Top Speed" value={`${v.topSpeed} km/h`} /> : null}
          {v.acceleration ? <SpecRow label="0–100 km/h" value={`${v.acceleration}s`} /> : null}
          {v.driveType ? <SpecRow label="Drivetrain" value={v.driveType} /> : null}
          <SpecRow label="Transmission" value={v.transmission} />
          {!isEV && v.mileage ? <SpecRow label="Mileage" value={`${v.mileage} km/l`} /> : null}

          <GroupLabel>Dimensions & Capacity</GroupLabel>
          {dimL ? <SpecRow label="Length (mm)" value={Number(dimL).toLocaleString("en-IN")} /> : null}
          {dimW ? <SpecRow label="Width (mm)" value={Number(dimW).toLocaleString("en-IN")} /> : null}
          {dimH ? <SpecRow label="Height (mm)" value={Number(dimH).toLocaleString("en-IN")} /> : null}
          <SpecRow label="Ground Clearance (mm)" value={v.groundClearance} />
          {v.bootSpace ? <SpecRow label="Boot Space (L)" value={v.bootSpace.toLocaleString("en-IN")} /> : null}
          <SpecRow label="Seating" value={v.seatingCapacity} />

          <GroupLabel>Wheels & Suspension</GroupLabel>
          <SpecRow label="Front Suspension" value="MacPherson Strut" />
          <SpecRow label="Rear Suspension" value={isEV ? "Torsion Beam" : "Multi-link"} />
          <SpecRow label="Front Brakes" value="Ventilated Disc" />
          <SpecRow label="Rear Brakes" value="Disc" />

          {v.colors?.length > 0 && (
            <>
              <GroupLabel muted>Colours</GroupLabel>
              <div className="flex flex-wrap gap-2 py-2">
                {v.colors.map((c) => (
                  <span key={c} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}
        </dl>
        <p className="mt-5 text-xs font-medium text-slate-400">Specifications sourced from the manufacturer brochure.</p>
      </Card>
    </section>
  );
}
