"use client";

import React, { useState } from "react";
import Link from "next/link";

/* -------------------------------------------------------------------------- */
/*  Shared input styling — mirrors the filter inputs on the home page          */
/* -------------------------------------------------------------------------- */

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const LABEL =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500";

/* -------------------------------------------------------------------------- */
/*  Brand mark                                                                 */
/* -------------------------------------------------------------------------- */

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          dark ? "bg-white/10 ring-1 ring-white/20" : "bg-blue-600 shadow-lg shadow-blue-600/30"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="white" className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"
          />
        </svg>
      </span>
      <span className={`text-lg font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
        SaaS Nepal
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Signature element: a real product card, in the home page's card language   */
/* -------------------------------------------------------------------------- */

function SpecCard() {
  return (
    <div className="relative w-full max-w-[19rem]">
      {/* single controlled spotlight behind the card */}
      <div className="pointer-events-none absolute -inset-10 rounded-[2.5rem] bg-blue-400/20 blur-3xl" aria-hidden />

      <div className="relative rounded-2xl border border-slate-200/70 bg-white p-4 shadow-2xl shadow-blue-950/50">
        {/* top row — EV chip + rating, echoing the home listing cards */}
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-extrabold text-blue-600">
            ⚡ EV
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-yellow-200 bg-yellow-50/70 px-2 py-0.5 text-[11px] font-black text-slate-700">
            <StarIcon /> 5.0
          </span>
        </div>

        {/* image area — brand watermark, same treatment as the listing grid */}
        <div className="relative mb-4 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <div className="absolute h-12 w-24 rounded-full bg-blue-500/10 blur-md" />
          <span className="z-10 text-3xl font-extrabold uppercase tracking-tighter text-blue-500/30">BYD</span>
        </div>

        <h3 className="text-sm font-extrabold text-slate-900">BYD Atto 3</h3>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">Electric SUV</p>
        <p className="mt-2 text-base font-black tracking-tight text-slate-900">Rs. 67,80,000</p>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <BatteryIcon />
            <span className="font-mono">60.5</span> kWh
          </span>
          <span className="flex items-center justify-end gap-1.5">
            <RangeIcon />
            <span className="font-mono">420</span> km
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Split-screen shell shared by /login and /signup                            */
/* -------------------------------------------------------------------------- */

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 p-12 lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(720px circle at 22% 32%, rgba(37,99,235,0.38), transparent 62%)",
          }}
          aria-hidden
        />

        <div className="relative z-10">
          <BrandMark dark />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center py-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300/80">
            Electric vehicles · Nepal
          </p>
          <h1 className="mt-4 max-w-md text-4xl font-black leading-[1.08] tracking-tight text-white">
            Every electric car in Nepal, in one place.
          </h1>
          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-blue-100/70">
            Compare on-road prices, calculate EMI, and browse verified used EVs. Sign in to save your
            comparisons and get recommendations tailored to your budget.
          </p>
          <div className="mt-10">
            <SpecCard />
          </div>
        </div>

        <div className="relative z-10 text-xs font-semibold text-blue-200/50">© 2026 SaaS Nepal</div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col">
        {/* compact brand bar — mobile / tablet only */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 lg:hidden">
          <BrandMark />
          <Link href="/" className="text-xs font-bold text-slate-400 transition-colors hover:text-slate-600">
            ← Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form primitives                                                            */
/* -------------------------------------------------------------------------- */

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={INPUT}
      />
      {hint && <p className="mt-1.5 text-xs font-medium text-slate-400">{hint}</p>}
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${INPUT} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs font-medium text-slate-400">{hint}</p>}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <span id={`${id}-label`} className={LABEL}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1"
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              id={`${id}-${opt.value}`}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();
                const idx = options.findIndex((o) => o.value === value);
                const dir = e.key === "ArrowRight" ? 1 : -1;
                const next = options[(idx + dir + options.length) % options.length];
                onChange(next.value);
                document.getElementById(`${id}-${next.value}`)?.focus();
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                selected
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
    >
      <AlertIcon />
      <span>{children}</span>
    </div>
  );
}

export function SubmitButton({
  id,
  loading,
  loadingText,
  children,
}: {
  id?: string;
  loading: boolean;
  loadingText: string;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="submit"
      disabled={loading}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {loading ? (
        <>
          <Spinner />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Error copy — turns raw GoTrue messages into interface voice                */
/* -------------------------------------------------------------------------- */

export function mapAuthError(msg: string): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login")) return "That email or password doesn't match our records.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("already registered") || m.includes("user already"))
    return "An account with this email already exists. Sign in instead.";
  if (m.includes("password should be at least"))
    return "Use at least 6 characters for your password.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Enter a valid email address.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  return msg || "Something went wrong. Please try again.";
}

/* -------------------------------------------------------------------------- */
/*  Icons                                                                      */
/* -------------------------------------------------------------------------- */

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="#EAB308" stroke="#EAB308" strokeWidth={2}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-500"
    >
      <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
      <line x1="22" x2="22" y1="11" y2="13" />
    </svg>
  );
}

function RangeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-500"
    >
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}
