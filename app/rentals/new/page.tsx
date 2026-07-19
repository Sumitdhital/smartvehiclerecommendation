"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { createListing, uploadListingPhotos } from "@/lib/used-listings";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500";

const BRANDS = ["BYD", "Tata", "Citroen", "KIA", "XPENG", "Wuling", "Seres", "BAW", "Avatr", "MG", "Toyota", "Honda", "Suzuki", "Hyundai", "Other"];
const FUELS = ["Electric", "Petrol", "Diesel", "Hybrid"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const TRANSMISSIONS = ["Automatic", "Single-Speed", "Manual", "CVT", "DCT"];
const SELLER_TYPES = ["Individual", "Dealer"];
const MAX_PHOTOS = 8;

export default function NewRentalListingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Vehicle
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("");
  const [fuel, setFuel] = useState("Electric");
  const [transmission, setTransmission] = useState("");
  const [color, setColor] = useState("");
  // Condition
  const [condition, setCondition] = useState("Good");
  const [kmDriven, setKmDriven] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  // Price — per-day rate, this page always lists for rent
  const [askingPrice, setAskingPrice] = useState("");
  // Contact
  const [location, setLocation] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerType, setSellerType] = useState("Individual");
  const [description, setDescription] = useState("");
  // Photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // Status
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only signed-in users can list a car.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/rentals/new");
        return;
      }
      setUser(data.session.user);
      const fullName = data.session.user.user_metadata?.full_name as string | undefined;
      if (fullName) setSellerName((prev) => prev || fullName);
    });
  }, [router]);

  const isEV = fuel === "Electric";

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPhotos((prev) => [...prev, ...files].slice(0, MAX_PHOTOS));
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))].slice(0, MAX_PHOTOS));
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!brand || !model || !year || !askingPrice || !location) {
      setError("Fill in the required fields: brand, model, year, rate per day, and location.");
      return;
    }
    const yearNum = Number(year);
    if (!Number.isInteger(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 1) {
      setError("Enter a valid year.");
      return;
    }
    if (Number(askingPrice) <= 0) {
      setError("Enter a valid rate per day in NPR.");
      return;
    }
    if (!sellerPhone.trim()) {
      setError("Add a contact phone number so renters can reach you.");
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = photos.length ? await uploadListingPhotos(photos, user!.id) : [];
      await createListing(
        {
          brand: brand === "Other" ? model.split(" ")[0] : brand,
          model,
          variant: variant.trim() || undefined,
          year: yearNum,
          kmDriven: Number(kmDriven) || 0,
          condition,
          askingPrice: Number(askingPrice),
          listingType: "rent",
          fuel,
          transmission: transmission || undefined,
          color: color.trim() || undefined,
          location: location.trim(),
          sellerName: sellerName.trim() || undefined,
          sellerPhone: sellerPhone.trim(),
          sellerType,
          description: description.trim() || undefined,
          isEV,
          batteryHealth: isEV && batteryHealth ? Number(batteryHealth) : undefined,
          images: imageUrls,
        },
        user!.id
      );
      router.push("/rentals?posted=1");
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not publish your listing. Please try again.");
    }
  };

  // Session check in progress (or redirecting to login).
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader active="rentals" />
        <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-400">
          Checking your session…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader active="rentals" />

      <main className="mx-auto w-full max-w-3xl flex-grow px-4 py-8 sm:px-6">
        <Link
          href="/rentals"
          className="text-sm font-semibold text-slate-500 transition-colors hover:text-orange-600"
        >
          ← Back to rentals
        </Link>

        <div className="mt-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-orange-500">
            Rent out your car
          </span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            List your car for rent
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Your listing goes live immediately and renters contact you directly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          {/* Vehicle */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
              Vehicle
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SelectField id="brand-select" label="Brand" required value={brand} onChange={setBrand} options={BRANDS} placeholder="Select a brand" />
              <TextField id="model-input" label="Model" required value={model} onChange={setModel} placeholder="e.g. Atto 3" />
              <TextField id="variant-input" label="Variant" value={variant} onChange={setVariant} placeholder="e.g. Extended Range" />
              <TextField id="year-input" label="Year" required type="number" value={year} onChange={setYear} placeholder="e.g. 2023" />
              <SelectField id="fuel-select" label="Fuel" required value={fuel} onChange={setFuel} options={FUELS} />
              <SelectField id="transmission-select" label="Transmission" value={transmission} onChange={setTransmission} options={TRANSMISSIONS} placeholder="Select transmission" />
              <TextField id="color-input" label="Color" value={color} onChange={setColor} placeholder="e.g. Surf Blue" />
            </div>
          </section>

          {/* Condition & price */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
              Condition &amp; price
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SelectField id="condition-select" label="Condition" required value={condition} onChange={setCondition} options={CONDITIONS} />
              <TextField id="km-input" label="Kilometers driven" type="number" value={kmDriven} onChange={setKmDriven} placeholder="e.g. 18000" />
              {isEV && (
                <TextField id="battery-input" label="Battery health (%)" type="number" value={batteryHealth} onChange={setBatteryHealth} placeholder="e.g. 95" />
              )}
              <TextField
                id="price-input"
                label="Rate per day (Rs.)"
                required
                type="number"
                value={askingPrice}
                onChange={setAskingPrice}
                placeholder="e.g. 8000"
                hint={
                  Number(askingPrice) > 0
                    ? `Shown as Rs. ${Number(askingPrice).toLocaleString("en-NP")} /day`
                    : undefined
                }
              />
            </div>
          </section>

          {/* Photos */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
              Photos
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-xs font-bold text-white transition-colors hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-orange-400 hover:text-orange-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[10px] font-bold">Add photo</span>
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFilesSelected}
                  />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Up to {MAX_PHOTOS} photos. The first one becomes the cover.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
              Location &amp; contact
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField id="location-input" label="City / location" required value={location} onChange={setLocation} placeholder="e.g. Kathmandu" />
              <SelectField id="sellertype-select" label="You are" value={sellerType} onChange={setSellerType} options={SELLER_TYPES} />
              <TextField id="sellername-input" label="Your name" value={sellerName} onChange={setSellerName} placeholder="Shown on the listing" />
              <TextField id="phone-input" label="Contact phone" required value={sellerPhone} onChange={setSellerPhone} placeholder="e.g. 98XXXXXXXX" />
            </div>
            <div className="mt-5">
              <label htmlFor="description-input" className={LABEL}>
                Description
              </label>
              <textarea
                id="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Service history, ownership, extras — anything a renter should know."
                className={INPUT}
              />
            </div>
          </section>

          {/* Error + submit */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}
          <button
            id="publish-rental-listing-btn"
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:bg-orange-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {photos.length ? "Uploading photos…" : "Publishing…"}
              </>
            ) : (
              "Publish rental listing"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

/* ---------- local form field helpers ---------- */

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT}
      />
      {hint && <p className="mt-1.5 text-xs font-medium text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} cursor-pointer appearance-none`}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1.25rem",
          backgroundRepeat: "no-repeat",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
