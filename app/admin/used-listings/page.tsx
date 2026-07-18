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
    inlineEdit: "number",
    render: (row) =>
      `रू ${Number(row.asking_price).toLocaleString("en-IN")}${row.listing_type === "rent" ? " /day" : ""}`,
  },
  { key: "location", label: "Location", inlineEdit: "text" },
  {
    key: "sold",
    label: "Status",
    inlineEdit: "toggle",
    render: (row) =>
      row.sold ? (
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-600">Sold</span>
      ) : (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">Available</span>
      ),
  },
];

const fields: FieldDef[] = [
  // Vehicle
  { name: "vehicle_brand", label: "Brand", required: true, placeholder: "Tata", section: "Vehicle" },
  { name: "vehicle_model", label: "Model", required: true, placeholder: "Nexon EV", section: "Vehicle" },
  { name: "vehicle_variant", label: "Variant", placeholder: "XZ+", section: "Vehicle" },
  { name: "year", label: "Year", type: "number", placeholder: "2022", section: "Vehicle" },
  { name: "km_driven", label: "Km driven", type: "number", placeholder: "24000", section: "Vehicle" },
  { name: "condition", label: "Condition", type: "select", options: ["Excellent", "Good", "Fair", "Poor"], section: "Vehicle" },
  { name: "fuel", label: "Fuel", type: "select", options: ["Electric", "Petrol", "Diesel", "Hybrid", "CNG"], section: "Vehicle" },
  { name: "transmission", label: "Transmission", type: "select", options: ["Manual", "Automatic", "CVT", "Single-Speed", "DCT"], section: "Vehicle" },
  { name: "color", label: "Color", placeholder: "White", section: "Vehicle" },
  { name: "is_ev", label: "Electric vehicle", type: "checkbox", section: "Vehicle" },
  { name: "battery_health", label: "Battery health (%)", type: "number", help: "EVs only", section: "Vehicle" },
  // Pricing
  { name: "listing_type", label: "Listing type", type: "select", options: ["sell", "rent"], help: "\"rent\" prices are per day", section: "Pricing" },
  { name: "asking_price", label: "Price (NPR)", type: "number", required: true, placeholder: "3200000", help: "Asking price, or per-day rate for rentals", section: "Pricing" },
  { name: "original_price", label: "Original price (NPR)", type: "number", section: "Pricing" },
  // Location & Seller
  { name: "location", label: "Location", placeholder: "Kathmandu", section: "Location & Seller" },
  { name: "seller_name", label: "Seller name", placeholder: "Ram Sharma", section: "Location & Seller" },
  { name: "seller_type", label: "Seller type", type: "select", options: ["Individual", "Dealer"], section: "Location & Seller" },
  // Media
  { name: "images", label: "Photos", type: "photos", uploadEndpoint: "/api/admin/used-listings/upload", section: "Media", help: "Upload photos — the first is used as the card image" },
  { name: "features", label: "Features", type: "tags", colSpan: 2, placeholder: "Sunroof, Alloy wheels", help: "Comma-separated", section: "Media" },
  // Status
  { name: "sold", label: "Sold (hides “Book Test Drive”)", type: "checkbox", section: "Status" },
  { name: "description", label: "Description", type: "textarea", section: "Status" },
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
