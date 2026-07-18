"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { insertVehicle, type NewVehicleInput } from "@/lib/vehicles-db";
import type { VehicleType, FuelType, TransmissionType } from "@/lib/types";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500";

const TYPES: VehicleType[] = ["Sedan", "SUV", "Hatchback", "MPV", "Pickup", "Crossover"];
const FUELS: FuelType[] = ["Electric", "Petrol", "Diesel", "Hybrid"];
const TRANSMISSIONS: TransmissionType[] = ["Automatic", "Manual", "CVT", "Single-Speed", "DCT"];

type GuardStatus = "checking" | "no-session" | "not-dealer" | "dealer";

export default function NewDealerCarPage() {
  const router = useRouter();
  const [status, setStatus] = useState<GuardStatus>("checking");
  const [user, setUser] = useState<User | null>(null);

  // Vehicle basics
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [type, setType] = useState("");
  const [fuel, setFuel] = useState<FuelType>("Electric");
  const [price, setPrice] = useState("");
  const [seating, setSeating] = useState("5");
  const [transmission, setTransmission] = useState<TransmissionType>("Automatic");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  // Fuel-dependent specs
  const [batteryKwh, setBatteryKwh] = useState("");
  const [rangeKm, setRangeKm] = useState("");
  const [engineCc, setEngineCc] = useState("");
  const [mileage, setMileage] = useState("");
  // Shared specs
  const [horsepower, setHorsepower] = useState("");
  const [torque, setTorque] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  // Status
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const isEV = fuel === "Electric";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        router.replace("/login?next=/dealer/new-car");
        setStatus("no-session");
        return;
      }
      setUser(session.user);
      const accountType = session.user.user_metadata?.account_type as string | undefined;
      setStatus(accountType === "dealer" ? "dealer" : "not-dealer");
    });
  }, [router]);

  const resetForm = () => {
    setBrand("");
    setModel("");
    setVariant("");
    setType("");
    setFuel("Electric");
    setPrice("");
    setSeating("5");
    setTransmission("Automatic");
    setYear(String(new Date().getFullYear()));
    setBatteryKwh("");
    setRangeKm("");
    setEngineCc("");
    setMileage("");
    setHorsepower("");
    setTorque("");
    setImageUrl("");
    setDescription("");
    setKeyFeatures("");
    setCreatedId(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!brand.trim() || !model.trim() || !type || !fuel || !seating) {
      setError("Fill in the required fields: brand, model, vehicle type, fuel, and seating capacity.");
      return;
    }
    const priceNum = Number(price);
    if (!price || !Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Enter a valid price in NPR (greater than 0).");
      return;
    }
    const seatingNum = Number(seating);
    if (!Number.isFinite(seatingNum) || seatingNum <= 0) {
      setError("Enter a valid seating capacity.");
      return;
    }

    const input: NewVehicleInput = {
      brand: brand.trim(),
      model: model.trim(),
      variant: variant.trim() || undefined,
      type: type as VehicleType,
      fuel,
      price: priceNum,
      seatingCapacity: seatingNum,
      transmission,
      horsepower: horsepower ? Number(horsepower) : undefined,
      torque: torque ? Number(torque) : undefined,
      imageUrl: imageUrl.trim() || undefined,
      description: description.trim() || undefined,
      yearLaunched: year ? Number(year) : undefined,
      keyFeatures: keyFeatures.trim()
        ? keyFeatures.split(",").map((f) => f.trim()).filter(Boolean)
        : undefined,
      ...(isEV
        ? {
            batteryKwh: batteryKwh ? Number(batteryKwh) : undefined,
            rangeKm: rangeKm ? Number(rangeKm) : undefined,
          }
        : {
            engineCc: engineCc ? Number(engineCc) : undefined,
            mileage: mileage ? Number(mileage) : undefined,
          }),
    };

    setSubmitting(true);
    try {
      const { id } = await insertVehicle(input);
      setCreatedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not list this car. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Session check in progress or redirecting to login.
  if (status === "checking" || status === "no-session") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-400">
          Checking your session…
        </div>
      </div>
    );
  }

  // Signed in but not a dealer account — no redirect loop, just a friendly notice.
  if (status === "not-dealer") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-8.99 3.75h.008v.008h-.008v-.008Z"
              />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">Dealer accounts only</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Listing new cars into the catalog is reserved for dealer accounts. Your account is registered as an
            individual, and account type is chosen when you sign up and can&apos;t be changed here.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/used/new"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700"
            >
              List a used car instead
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Back home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Success state.
  if (createdId) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">Car listed successfully</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {brand} {model} is now live in the catalog.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href={`/vehicle/${createdId}`}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700"
            >
              View listing
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Add another
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-grow px-4 py-8 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600">
          ← Back to catalog
        </Link>

        <div className="mt-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">Dealer inventory</span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">List a new car</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Signed in as {user?.email}. This adds a brand-new car to the main catalog, not the used marketplace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          {/* Vehicle */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">Vehicle</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField id="brand-input" label="Brand" required value={brand} onChange={setBrand} placeholder="e.g. BYD" />
              <TextField id="model-input" label="Model" required value={model} onChange={setModel} placeholder="e.g. Seal" />
              <TextField id="variant-input" label="Variant" value={variant} onChange={setVariant} placeholder="e.g. Performance" />
              <TextField id="year-input" label="Year" type="number" value={year} onChange={setYear} placeholder="e.g. 2026" />
              <SelectField id="type-select" label="Vehicle type" required value={type} onChange={setType} options={TYPES} placeholder="Select a type" />
              <SelectField id="fuel-select" label="Fuel" required value={fuel} onChange={(v) => setFuel(v as FuelType)} options={FUELS} />
              <SelectField
                id="transmission-select"
                label="Transmission"
                required
                value={transmission}
                onChange={(v) => setTransmission(v as TransmissionType)}
                options={TRANSMISSIONS}
              />
              <TextField id="seating-input" label="Seating capacity" required type="number" value={seating} onChange={setSeating} placeholder="e.g. 5" />
            </div>
          </section>

          {/* Performance & specs */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
              Performance &amp; specs
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {isEV ? (
                <>
                  <TextField id="battery-input" label="Battery (kWh)" type="number" value={batteryKwh} onChange={setBatteryKwh} placeholder="e.g. 60.48" />
                  <TextField id="range-input" label="Range (km)" type="number" value={rangeKm} onChange={setRangeKm} placeholder="e.g. 420" />
                </>
              ) : (
                <>
                  <TextField id="engine-input" label="Engine (cc)" type="number" value={engineCc} onChange={setEngineCc} placeholder="e.g. 1498" />
                  <TextField id="mileage-input" label="Mileage (km/l)" type="number" value={mileage} onChange={setMileage} placeholder="e.g. 18" />
                </>
              )}
              <TextField id="horsepower-input" label="Horsepower (bhp)" type="number" value={horsepower} onChange={setHorsepower} placeholder="e.g. 201" />
              <TextField id="torque-input" label="Torque (Nm)" type="number" value={torque} onChange={setTorque} placeholder="e.g. 310" />
            </div>
          </section>

          {/* Price */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">Price</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="price-input"
                label="Price (NPR)"
                required
                type="number"
                value={price}
                onChange={setPrice}
                placeholder="e.g. 6780000"
                hint={Number(price) > 0 ? `Shown as Rs. ${Number(price).toLocaleString("en-IN")}` : undefined}
              />
            </div>
          </section>

          {/* Listing details */}
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
              Listing details
            </h2>
            <div className="grid grid-cols-1 gap-5">
              <TextField
                id="image-input"
                label="Image URL"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="https://…/car.jpg (optional)"
              />
              <TextField
                id="features-input"
                label="Key features"
                value={keyFeatures}
                onChange={setKeyFeatures}
                placeholder="Comma-separated, e.g. ADAS, Panoramic Sunroof, 360 Camera"
              />
              <div>
                <label htmlFor="description-input" className={LABEL}>
                  Description
                </label>
                <textarea
                  id="description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What makes this car worth buying?"
                  className={INPUT}
                />
              </div>
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
            id="publish-vehicle-btn"
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Publishing…
              </>
            ) : (
              "Publish listing"
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
