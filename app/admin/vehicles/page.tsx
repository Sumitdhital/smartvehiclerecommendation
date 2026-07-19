"use client";

import React from "react";
import ResourceManager, { ColumnDef, FieldDef } from "@/components/admin/ResourceManager";
import SendFeedbackButton from "@/components/admin/SendFeedbackButton";

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  variant: string;
  type: string;
  fuel: string;
  price: number;
  is_featured: boolean;
  slug?: string | null;
  [key: string]: unknown;
}

const columns: ColumnDef<VehicleRow>[] = [
  {
    key: "brand",
    label: "Vehicle",
    render: (row) => (
      <span>
        <span className="text-slate-900 font-extrabold">{row.brand} {row.model}</span>{" "}
        <span className="text-slate-400">{row.variant}</span>
      </span>
    ),
  },
  { key: "type", label: "Type" },
  {
    key: "fuel",
    label: "Fuel",
    render: (row) => (
      <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg ${
        row.fuel === "Electric" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
      }`}>
        {row.fuel}
      </span>
    ),
  },
  {
    key: "price",
    label: "Price",
    render: (row) => `रू ${Number(row.price).toLocaleString("en-IN")}`,
  },
  { key: "is_featured", label: "Featured" },
];

const fields: FieldDef[] = [
  { name: "brand", label: "Brand", required: true, placeholder: "BYD" },
  { name: "model", label: "Model", required: true, placeholder: "Dolphin" },
  { name: "variant", label: "Variant", required: true, placeholder: "Premium" },
  { name: "type", label: "Type", type: "select", required: true, options: ["Sedan", "SUV", "Hatchback", "MPV", "Pickup", "Scooter", "Bike", "Crossover"] },
  { name: "fuel", label: "Fuel", type: "select", required: true, options: ["Electric", "Petrol", "Diesel", "Hybrid", "CNG"] },
  { name: "transmission", label: "Transmission", type: "select", required: true, options: ["Manual", "Automatic", "CVT", "Single-Speed", "DCT"] },
  { name: "price", label: "Price (NPR)", type: "number", required: true, placeholder: "4500000" },
  { name: "seating_capacity", label: "Seating capacity", type: "number", required: true, placeholder: "5" },
  { name: "category", label: "Category", placeholder: "Budget / Premium / Luxury" },
  { name: "year_launched", label: "Year launched", type: "number", placeholder: "2024" },
  { name: "battery_kwh", label: "Battery (kWh)", type: "number", step: "0.1", help: "EVs only" },
  { name: "range_km", label: "Range (km)", type: "number", help: "EVs only" },
  { name: "horsepower", label: "Horsepower (hp)", type: "number" },
  { name: "torque", label: "Torque (Nm)", type: "number" },
  { name: "mileage", label: "Mileage (km/l)", type: "number", step: "0.1", help: "Fuel vehicles only" },
  { name: "engine_cc", label: "Engine (cc)", type: "number", help: "Fuel vehicles only" },
  { name: "ground_clearance", label: "Ground clearance (mm)", type: "number" },
  { name: "boot_space", label: "Boot space (L)", type: "number" },
  { name: "safety_rating", label: "Safety rating (0–5)", type: "number", step: "0.1" },
  { name: "total_airbags", label: "Total airbags", type: "number" },
  { name: "dimensions", label: "Dimensions", placeholder: "4290 x 1770 x 1570 mm" },
  { name: "drive_type", label: "Drive type", placeholder: "FWD / RWD / AWD" },
  { name: "slug", label: "Slug", placeholder: "byd-dolphin", help: "Unique URL id; used by the seed upsert" },
  { name: "brand_slug", label: "Brand slug", placeholder: "byd" },
  { name: "used_count", label: "Used listings count", type: "number" },
  { name: "is_ev", label: "Electric vehicle", type: "checkbox" },
  { name: "is_featured", label: "Featured on home page", type: "checkbox" },
  { name: "key_features", label: "Key features", type: "tags", colSpan: 2, placeholder: "Sunroof, 360 camera, ADAS", help: "Comma-separated" },
  { name: "colors", label: "Colors", type: "tags", colSpan: 2, placeholder: "White, Black, Blue", help: "Comma-separated" },
  { name: "images", label: "Image URLs", type: "tags", colSpan: 2, placeholder: "/images/car1.png, /images/car2.png", help: "Comma-separated" },
  { name: "image_url", label: "Primary image URL", colSpan: 2, placeholder: "/images/car1.png" },
  { name: "description", label: "Description", type: "textarea" },
];

export default function AdminVehiclesPage() {
  return (
    <ResourceManager<VehicleRow>
      title="Vehicles"
      subtitle="New vehicle catalog stored in the database."
      endpoint="/api/admin/vehicles"
      columns={columns}
      fields={fields}
      addLabel="Add vehicle"
      itemNoun="vehicle"
      extraRowActions={(row) => (
        <SendFeedbackButton
          target="vehicle"
          id={row.id}
          label={`${row.brand} ${row.model} ${row.variant}`}
        />
      )}
      onRowOpen={(row) => {
        // Prefer the slug so the dashboard link resolves on the public page.
        const vehicleId =
          typeof row.slug === "string" && row.slug ? row.slug : row.id;
        fetch("/api/admin/vehicle-views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId,
            vehicleName: `${row.brand} ${row.model} ${row.variant}`,
          }),
        }).catch(() => {});
      }}
    />
  );
}
