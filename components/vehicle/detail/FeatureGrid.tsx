import React from "react";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import { Card, CardTitle, GroupLabel, FeatureItem } from "./primitives";

export interface FeatureGroup {
  title: string;
  items: string[];
}

/**
 * Groups equipment into labelled categories (as the reference does). The
 * vehicle's real keyFeatures lead as "Highlights"; each category is then padded
 * with standard equipment appropriate to the fuel type so the grid never looks
 * sparse. Duplicate strings are removed to keep the highlights meaningful.
 */
export function buildFeatureGroups(v: ExtendedVehicle): FeatureGroup[] {
  const isEV = v.fuel === "Electric";
  const seen = new Set<string>();
  const dedupe = (items: string[]) =>
    items.filter((f) => {
      const key = f.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const groups: FeatureGroup[] = [];

  const highlights = dedupe(v.keyFeatures ?? []);
  if (highlights.length) groups.push({ title: "Highlights", items: highlights });

  groups.push({
    title: "Safety",
    items: dedupe([
      v.totalAirbags ? `${v.totalAirbags} Airbags` : "Dual Front Airbags",
      v.safetyRating ? `${v.safetyRating}-Star Safety Rating` : "ABS with EBD",
      "Electronic Stability Control",
      "Anti-lock Braking System (ABS)",
      "Rear Parking Camera",
      "Tyre Pressure Monitoring",
      "ISOFIX Child Seat Mounts",
      "Hill Hold Assist",
    ]),
  });

  groups.push({
    title: "Comfort & Convenience",
    items: dedupe([
      "Automatic Climate Control",
      "Push-Button Start / Keyless Entry",
      "Power Windows (Front & Rear)",
      "Electrically Adjustable Mirrors",
      v.seatingCapacity >= 7 ? "Three-Row Seating" : "60:40 Split Rear Seats",
      "Cruise Control",
      "Rear AC Vents",
    ]),
  });

  groups.push({
    title: "Infotainment",
    items: dedupe([
      "Touchscreen Infotainment",
      "Apple CarPlay & Android Auto",
      "Bluetooth & USB Connectivity",
      "Steering-Mounted Controls",
      "Voice Command",
      "Connected Car Features",
    ]),
  });

  groups.push({
    title: "Exterior",
    items: dedupe([
      "LED Headlights",
      "LED Daytime Running Lights",
      "Alloy Wheels",
      "LED Tail Lights",
      "Roof Rails",
      "Body-Coloured Bumpers",
    ]),
  });

  if (isEV) {
    groups.push({
      title: "Battery & Charging",
      items: dedupe([
        "AC Charging — Type 2",
        "DC Fast Charging — CCS2",
        "Regenerative Braking",
        v.batteryKwh ? `${v.batteryKwh} kWh Battery Pack` : "Lithium-ion Battery",
        "Battery Management System",
      ]),
    });
  } else {
    groups.push({
      title: "Engine & Drive",
      items: dedupe([
        v.engineCc ? `${v.engineCc} cc Petrol Engine` : "Turbocharged Petrol Engine",
        `${v.transmission} Transmission`,
        v.driveType ? `${v.driveType} Drivetrain` : "Front-Wheel Drive",
        "Multiple Drive Modes",
        "Idle Start-Stop System",
      ]),
    });
  }

  return groups;
}

/** Two-column checklist grid, one block per feature category. */
export function FeatureGrid({ vehicle }: { vehicle: ExtendedVehicle }) {
  const groups = buildFeatureGroups(vehicle);
  return (
    <section id="features" className="scroll-mt-36">
      <Card className="p-5 sm:p-7">
        <CardTitle title={`${vehicle.brand} ${vehicle.model} Features`} sub="Features and equipment." />
        {groups.map((g) => {
          const mid = Math.ceil(g.items.length / 2);
          const cols = [g.items.slice(0, mid), g.items.slice(mid)];
          return (
            <div key={g.title}>
              <GroupLabel>{g.title}</GroupLabel>
              <div className="grid gap-x-10 sm:grid-cols-2">
                {cols.map((col, i) => (
                  <ul key={i}>
                    {col.map((f) => (
                      <FeatureItem key={f}>{f}</FeatureItem>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}
