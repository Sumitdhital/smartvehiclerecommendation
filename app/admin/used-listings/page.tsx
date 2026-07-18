"use client";

import React from "react";
import ResourceManager, { ColumnDef, FieldDef } from "@/components/admin/ResourceManager";

interface UsedRow {
  id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_variant: string | null;
  year: number | null;
  km_driven: number | null;
  condition: string | null;
  asking_price: number;
  listing_type: string | null;
  location: string | null;
  sold: boolean | null;
  [key: string]: unknown;
}

const columns: ColumnDef<UsedRow>[] = [
  {
    key: "vehicle_brand",
    label: "Vehicle",
    render: (row) => (
      <span>
        <span className="text-slate-900 font-extrabold">{row.vehicle_brand} {row.vehicle_model}</span>{" "}
        <span className="text-slate-400">{row.vehicle_variant ?? ""}</span>
      </span>
    ),
  },
  { key: "year", label: "Year" },
  {
    key: "km_driven",
    label: "Km driven",
    render: (row) => (row.km_driven === null ? "—" : `${Number(row.km_driven).toLocaleString("en-IN")} km`),
  },
  { key: "condition", label: "Condition" },
  {
    key: "listing_type",
    label: "Type",
    render: (row) => (row.listing_type === "rent" ? "For rent" : "For sale"),
  },
  {
    key: "asking_price",
    label: "Price",
    render: (row) =>
      `रू ${Number(row.asking_price).toLocaleString("en-IN")}${row.listing_type === "rent" ? " /day" : ""}`,
  },
  { key: "location", label: "Location" },
  {
    key: "sold",
    label: "Status",
    render: (row) =>
      row.sold ? (
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-600">Sold</span>
      ) : (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">Available</span>
      ),
  },
];

const fields: FieldDef[] = [
  { name: "vehicle_brand", label: "Brand", required: true, placeholder: "Tata" },
  { name: "vehicle_model", label: "Model", required: true, placeholder: "Nexon EV" },
  { name: "vehicle_variant", label: "Variant", placeholder: "XZ+" },
  { name: "year", label: "Year", type: "number", placeholder: "2022" },
  { name: "km_driven", label: "Km driven", type: "number", placeholder: "24000" },
  { name: "condition", label: "Condition", type: "select", options: ["Excellent", "Good", "Fair", "Poor"] },
  { name: "fuel", label: "Fuel", type: "select", options: ["Electric", "Petrol", "Diesel", "Hybrid", "CNG"] },
  { name: "transmission", label: "Transmission", type: "select", options: ["Manual", "Automatic", "CVT", "Single-Speed", "DCT"] },
  { name: "color", label: "Color", placeholder: "White" },
  { name: "is_ev", label: "Electric vehicle", type: "checkbox" },
  { name: "battery_health", label: "Battery health (%)", type: "number", help: "EVs only" },
  { name: "listing_type", label: "Listing type", type: "select", options: ["sell", "rent"], help: "\"rent\" prices are per day" },
  { name: "asking_price", label: "Price (NPR)", type: "number", required: true, placeholder: "3200000", help: "Asking price, or per-day rate for rentals" },
  { name: "original_price", label: "Original price (NPR)", type: "number" },
  { name: "location", label: "Location", placeholder: "Kathmandu" },
  { name: "seller_name", label: "Seller name", placeholder: "Ram Sharma" },
  { name: "seller_type", label: "Seller type", type: "select", options: ["Individual", "Dealer"] },
  { name: "images", label: "Photo URLs", type: "tags", colSpan: 2, placeholder: "https://…/front.jpg, https://…/side.jpg", help: "Comma-separated URLs — the first is used as the card image" },
  { name: "features", label: "Features", type: "tags", colSpan: 2, placeholder: "Sunroof, Alloy wheels", help: "Comma-separated" },
  { name: "sold", label: "Sold (hides “Book Test Drive”)", type: "checkbox" },
  { name: "description", label: "Description", type: "textarea" },
];

export default function AdminUsedListingsPage() {
  return (
    <ResourceManager<UsedRow>
      title="Used listings"
      subtitle="Second-hand marketplace listings stored in the database."
      endpoint="/api/admin/used-listings"
      columns={columns}
      fields={fields}
      addLabel="Add listing"
      itemNoun="listing"
    />
  );
}
