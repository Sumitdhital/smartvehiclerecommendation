"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ExtendedVehicle } from "@/lib/vehicles-db";
import type { TaxBreakdown } from "@/lib/tax-engine";
import { BookTestDriveModal } from "@/components/vehicle/BookTestDriveModal";
import { recordView } from "@/lib/search-history";

/* ─────────────────────────── helpers ─────────────────────────── */

// Lakh-style grouping used across Nepali listings: Rs. 41,15,000
const npr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

// EV motor output in kW derived from PS figure stored in the DB.
const psToKw = (ps: number) => Math.round(ps * 0.7355);

// Flat 8.5% for 5 years — same assumptions the hero calculator displays.
const EMI_RATE = 8.5;
const EMI_YEARS = 5;
function monthlyEmi(loan: number): number {
  const r = EMI_RATE / 12 / 100;
  const n = EMI_YEARS * 12;
  const f = Math.pow(1 + r, n);
  return loan * ((r * f) / (f - 1));
}

/* ─────────────────────────── icons ─────────────────────────── */

type IconProps = { className?: string };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const I = {
  battery: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="2" y="8" width="17" height="8" rx="2" /><path d="M22 11v2M6 11v2M10 11v2" /></svg>,
  bolt: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" /></svg>,
  range: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="18.5" cy="6.5" r="2.5" /><path d="M8 17.5h6.5a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" /></svg>,
  gauge: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M12 14 15 9" /><circle cx="12" cy="14" r="8.5" /><path d="M3.5 14h1M19.5 14h1M12 5.5v1" /></svg>,
  torque: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 1 8 8" /><path d="M12 20v-4M12 20l-3-1.5M12 20l3-1.5" /><circle cx="12" cy="12" r="2" /></svg>,
  shield: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.5 7.5 9 4.3-1.5 7.5-4.5 7.5-9V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  clearance: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M3 5h18" /><path d="M12 9v10M12 19l-2.5-2.5M12 19l2.5-2.5M12 9 9.5 11.5M12 9l2.5 2.5" /></svg>,
  ruler: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="1.5" transform="rotate(-45 12 12)" /><path d="m8.5 9.5 1.5 1.5M11.5 6.5 13 8M14.5 3.5 16 5" /></svg>,
  drive: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v6M12 15v6M3.5 9.5 9 11M20.5 9.5 15 11" /></svg>,
  seat: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="9" cy="5" r="2" /><path d="M9 9v5a2 2 0 0 0 2 2h4l2 5" /><path d="M9 14H7a3 3 0 0 0-3 3v3" /></svg>,
  airbag: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
  boot: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 12h18M8 7V5h8v2" /></svg>,
  calendar: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>,
  car: (p: IconProps) => <svg {...p} {...stroke} viewBox="0 0 24 24"><path d="M5 11 6.5 6.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" /><rect x="3" y="11" width="18" height="6" rx="1.5" /><circle cx="7.5" cy="17" r="1.5" /><circle cx="16.5" cy="17" r="1.5" /></svg>,
  check: (p: IconProps) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>,
  chevronR: (p: IconProps) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>,
  chevronL: (p: IconProps) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6 9 12l6 6" /></svg>,
};

/* ─────────────────────────── EMI calculator (signature) ─────────────────────────── */

function EmiCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(40);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const down = price * (downPct / 100);
  const loan = price - down;
  const emi = monthlyEmi(loan);
  const totalPayable = emi * EMI_YEARS * 12;

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">EMI Calculator</span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold tracking-tight text-blue-600">{npr(emi)}</span>
          <span className="text-xs font-semibold text-slate-400">/mo</span>
        </div>
        <button
          onClick={() => setShowBreakdown((s) => !s)}
          aria-expanded={showBreakdown}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showBreakdown ? "Hide Breakdown" : "View Breakdown"}
        </button>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-500">
        {downPct}% down ({npr(down)}) · {EMI_YEARS}yr @ {EMI_RATE}%
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-[11px] font-bold text-slate-400">20%</span>
        <input
          type="range"
          min={20}
          max={80}
          step={5}
          value={downPct}
          onChange={(e) => setDownPct(Number(e.target.value))}
          aria-label="Down payment percentage"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
        />
        <span className="text-[11px] font-bold text-slate-400">80%</span>
      </div>

      <div className={`grid transition-all duration-200 motion-reduce:transition-none ${showBreakdown ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <dl className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 text-xs font-semibold">
            {[
              ["Down payment", npr(down)],
              ["Loan amount", npr(loan)],
              ["Total interest", npr(totalPayable - loan)],
              ["Total payable", npr(totalPayable + down)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-blue-950">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── scrollspy tabs ─────────────────────────── */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "specifications", label: "Specifications" },
  { id: "features", label: "Features" },
];

function TabNav() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const els = TABS.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.2, 0.5] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <nav className="sticky top-16 z-30 rounded-xl border border-slate-200 bg-white/90 px-2 shadow-sm backdrop-blur">
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              active === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ─────────────────────────── card + spec primitives ─────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>{children}</div>;
}

function CardTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold tracking-tight text-blue-950 sm:text-2xl">{title}</h2>
      {sub ? <p className="mt-1 text-sm font-medium text-slate-500">{sub}</p> : null}
    </div>
  );
}

function GroupLabel({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <h3 className={`pt-5 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] ${muted ? "text-slate-400" : "text-blue-600"}`}>
      {children}
    </h3>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-slate-100 py-3">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-bold text-slate-800">{value}</dd>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 border-b border-slate-100 py-2.5 text-sm font-medium text-slate-700">
      <I.check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}

function HighlightTile({ icon: Icon, label, value }: { icon: (p: IconProps) => React.JSX.Element; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white px-4 py-4">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-slate-500">{label}</div>
        <div className="truncate text-sm font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────── comparison ─────────────────────────── */

function CompareColumn({ car }: { car: ExtendedVehicle }) {
  const isEV = car.fuel === "Electric";
  const rows: [string, React.ReactNode][] = [
    ["Price:", <span key="p" className="text-base font-extrabold text-blue-600">{npr(car.price)}</span>],
    ["EMI:", `${npr(monthlyEmi(car.price * 0.6))}/month`],
    ...(isEV && car.batteryKwh ? [["Battery Capacity:", `${car.batteryKwh} kWh`] as [string, React.ReactNode]] : []),
    ["Range:", car.rangeKm ? `${car.rangeKm} Km` : "N/A"],
    ["Motor Power:", isEV ? `${psToKw(car.horsepower)} kW` : `${car.horsepower} PS`],
    ["Torque:", car.torqueLabel ?? `${car.torque} Nm`],
    ["Ground Clearance:", `${car.groundClearance} mm`],
    ["Boot Space:", car.bootSpace ? `${car.bootSpace} Liters` : "N/A"],
    ["Safety Rating:", car.safetyRating ? `${car.safetyRating} Star` : "N/A"],
    ["Dimensions:", car.dimensions ? car.dimensions.replaceAll("x", "×") : "N/A"],
    ["Drive Type:", car.driveType ?? "N/A"],
    ["Seating Capacity:", `${car.seatingCapacity} People`],
    ["Total Airbags:", car.totalAirbags ?? "N/A"],
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-extrabold tracking-tight text-blue-950">{car.brand} {car.model}</h3>
      <div className="flex h-36 items-center justify-center py-2">
        <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="max-h-full max-w-full object-contain" />
      </div>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
            <dt className="text-xs font-medium text-slate-500">{k}</dt>
            <dd className="text-right text-sm font-bold text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CompareSection({ vehicle, rivals }: { vehicle: ExtendedVehicle; rivals: ExtendedVehicle[] }) {
  const [idx, setIdx] = useState(0);
  if (rivals.length === 0) return null;
  const rival = rivals[Math.min(idx, rivals.length - 1)];

  return (
    <Card className="p-5 sm:p-7">
      <CardTitle title={`Compare ${vehicle.brand} ${vehicle.model} with similar cars`} />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rivals.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              i === idx ? "bg-white text-blue-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            vs {r.brand} {r.model}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CompareColumn car={vehicle} />
        <CompareColumn car={rival} />
      </div>
    </Card>
  );
}

/* ─────────────────────────── FAQ ─────────────────────────── */

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <details key={it.q} className="group rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <I.chevronR className="h-3.5 w-3.5 flex-shrink-0 text-blue-950 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
            <span className="text-sm font-bold text-blue-950 sm:text-base">{it.q}</span>
          </summary>
          <p className="px-5 pb-4 pl-[3.1rem] text-sm font-medium leading-relaxed text-slate-600">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ─────────────────────────── main ─────────────────────────── */

export default function VehicleDetail({
  vehicle,
  tax,
  similar,
}: {
  vehicle: ExtendedVehicle;
  tax: TaxBreakdown;
  similar: ExtendedVehicle[];
}) {
  const v = vehicle;

  // Log a "viewed" entry for signed-in users (no-ops when logged out; admins
  // are logged server-side in app/vehicle/[id]/page.tsx instead).
  useEffect(() => {
    recordView(v.id, `${v.brand} ${v.model} ${v.variant}`);
  }, [v.id, v.brand, v.model, v.variant]);

  const isEV = v.fuel === "Electric";
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showTestDrive, setShowTestDrive] = useState(false);

  const motorKw = isEV ? psToKw(v.horsepower) : null;
  const [dimL, dimW, dimH] = (v.dimensions ?? "").split("x").map((s) => s.trim().replace(" mm", ""));
  const acChargeHrs = isEV && v.batteryKwh ? Math.ceil(v.batteryKwh / 7) : null;

  const featureCols = useMemo(() => {
    const items = v.keyFeatures ?? [];
    const mid = Math.ceil(items.length / 2);
    return [items.slice(0, mid), items.slice(mid)];
  }, [v.keyFeatures]);

  const faqs = [
    { q: `What is the price of ${v.brand} ${v.model} in Nepal?`, a: `The ${v.brand} ${v.model} ${v.variant} is priced at ${npr(v.price)} in Nepal. The estimated on-road price including customs, excise, VAT and road tax comes to ${npr(tax.totalOnRoadPrice)}.` },
    v.safetyRating ? { q: `What is the safety rating of the ${v.brand} ${v.model}?`, a: `The ${v.model} carries a ${v.safetyRating}-star safety rating${v.totalAirbags ? ` and comes with ${v.totalAirbags} airbags as standard` : ""}.` } : null,
    v.totalAirbags ? { q: `How many airbags are offered in the ${v.brand} ${v.model}?`, a: `The ${v.model} is equipped with ${v.totalAirbags} airbags.` } : null,
    { q: `What is the ground clearance of the ${v.brand} ${v.model}?`, a: `The ${v.model} offers ${v.groundClearance} mm of ground clearance — ${v.groundClearance >= 180 ? "well suited" : "adequate"} for Nepal's mixed road conditions.` },
    v.dimensions ? { q: `What are the dimensions of the ${v.brand} ${v.model}?`, a: `The ${v.model} measures ${v.dimensions.replaceAll("x", "×")} (L × W × H).` } : null,
    { q: `What is the seating capacity of the ${v.brand} ${v.model}?`, a: `The ${v.model} seats ${v.seatingCapacity} people${v.bootSpace ? ` and offers ${v.bootSpace} litres of boot space` : ""}.` },
    v.driveType ? { q: `What is the drive type of the ${v.brand} ${v.model}?`, a: `The ${v.model} comes with a ${v.driveType} drivetrain paired with a ${v.transmission.toLowerCase()} transmission.` } : null,
    isEV && v.rangeKm ? { q: `What is the driving range of the ${v.brand} ${v.model} EV?`, a: `The ${v.model} delivers a claimed range of ${v.rangeKm} km on a full charge of its ${v.batteryKwh} kWh battery pack.` } : null,
    isEV && v.batteryKwh ? { q: `What is the battery capacity of the ${v.brand} ${v.model}?`, a: `The ${v.model} packs a ${v.batteryKwh} kWh battery.` } : null,
    isEV && acChargeHrs ? { q: `How long does it take to charge the ${v.brand} ${v.model}?`, a: `On a 7 kW home AC charger a full charge takes roughly ${acChargeHrs} hours. DC fast charging via CCS2 at a public station is significantly quicker.` } : null,
  ].filter(Boolean) as { q: string; a: string }[];

  const highlights: { icon: (p: IconProps) => React.JSX.Element; label: string; value: string }[] = [
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl">
        {v.brand} {v.model} Price in Nepal
      </h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ══════════ main column ══════════ */}
        <div className="min-w-0 space-y-8">
          {/* HERO */}
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* gallery */}
              <div className="relative flex flex-col bg-slate-50 p-5">
                <div className="flex flex-1 items-center justify-center py-4">
                  <img
                    src={v.images[Math.min(photoIdx, v.images.length - 1)]}
                    alt={`${v.brand} ${v.model}`}
                    className="max-h-56 max-w-full object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.18)]"
                  />
                </div>
                <button
                  onClick={() => setShowTestDrive(true)}
                  className="inline-flex w-fit items-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                >
                  <I.calendar className="h-4 w-4" /> Book a Test Drive
                </button>
              </div>

              {/* info */}
              <div className="p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-500">{v.brand}</span>
                  {v.usedCount ? (
                    <Link
                      href="/used"
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      <I.car className="h-3.5 w-3.5" />
                      {v.usedCount} Used {isEV ? "EVs" : "Cars"} for sale
                      <I.chevronR className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl">{v.model}</h2>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-blue-950 sm:text-4xl">{npr(v.price)}</div>

                <div className="mt-5">
                  <EmiCalculator price={v.price} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {(isEV
                    ? [
                        { icon: I.battery, label: "Battery", value: `${v.batteryKwh} kWh` },
                        { icon: I.bolt, label: "Motor", value: `${motorKw} kW` },
                        { icon: I.range, label: "Range", value: `${v.rangeKm} km` },
                      ]
                    : [
                        { icon: I.bolt, label: "Fuel", value: v.fuel },
                        { icon: I.gauge, label: "Power", value: `${v.horsepower} PS` },
                        { icon: I.range, label: "Range", value: v.rangeKm ? `${v.rangeKm} km` : "—" },
                      ]
                  ).map((s) => (
                    <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <s.icon className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold">{s.label}</span>
                      </div>
                      <div className="mt-1 text-sm font-extrabold text-slate-900">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* photo strip */}
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Photos · {v.images.length}
                </span>
                {v.images.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                      disabled={photoIdx === 0}
                      aria-label="Previous photo"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                    >
                      <I.chevronL className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPhotoIdx((i) => Math.min(v.images.length - 1, i + 1))}
                      disabled={photoIdx >= v.images.length - 1}
                      aria-label="Next photo"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                    >
                      <I.chevronR className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {v.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setPhotoIdx(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={`h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition-colors ${
                      i === photoIdx ? "border-blue-600" : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* HIGHLIGHTS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <HighlightTile key={h.label} {...h} />
            ))}
          </div>

          {/* TABS */}
          <TabNav />

          {/* OVERVIEW */}
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

          {/* SPECIFICATIONS */}
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
                    {v.rangeKm ? <SpecRow label="Claimed Range" value={v.rangeKm} /> : null}
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
                {motorKw ? <SpecRow label="Power (kW)" value={motorKw} /> : null}
                <SpecRow label="Power (PS)" value={v.horsepower} />
                <SpecRow label="Torque (Nm)" value={v.torqueLabel ?? v.torque} />
                {v.topSpeed ? <SpecRow label="Top Speed" value={v.topSpeed} /> : null}
                {v.acceleration ? <SpecRow label="0–100 km/h" value={v.acceleration} /> : null}
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

          {/* FEATURES */}
          <section id="features" className="scroll-mt-36">
            <Card className="p-5 sm:p-7">
              <CardTitle title={`${v.brand} ${v.model} Features`} sub="Features and equipment." />
              <GroupLabel>Key Highlights</GroupLabel>
              <div className="grid gap-x-10 sm:grid-cols-2">
                {featureCols.map((col, i) => (
                  <ul key={i}>
                    {col.map((f) => (
                      <FeatureItem key={f}>{f}</FeatureItem>
                    ))}
                  </ul>
                ))}
              </div>
            </Card>
          </section>

          {/* COMPARE */}
          <CompareSection vehicle={v} rivals={similar.slice(0, 3)} />

          {/* FAQ */}
          <Card className="p-5 sm:p-7">
            <CardTitle title="FAQs" />
            <Faq items={faqs} />
          </Card>
        </div>

        {/* ══════════ right rail ══════════ */}
        <aside className="hidden lg:block">
          <h2 className="text-lg font-extrabold tracking-tight text-blue-950">You might also like</h2>
          <div className="mt-4 space-y-4">
            {similar.map((s) => (
              <Link
                key={s.id}
                href={`/vehicle/${s.id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-20 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1.5">
                  <img src={s.images[0]} alt={`${s.brand} ${s.model}`} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-400">{s.brand}</div>
                  <div className="truncate text-sm font-extrabold text-blue-950">{s.model}</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{npr(s.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <BookTestDriveModal
        open={showTestDrive}
        onClose={() => setShowTestDrive(false)}
        vehicleLabel={`${v.brand} ${v.model} ${v.variant}`.trim()}
        vehicleId={v.id}
      />
    </main>
  );
}
