import React from "react";
import { I, IconProps, IconComponent } from "./icons";

/** White rounded surface used for every panel on the detail page. */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>{children}</div>;
}

export function CardTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold tracking-tight text-blue-950 sm:text-2xl">{title}</h2>
      {sub ? <p className="mt-1 text-sm font-medium text-slate-500">{sub}</p> : null}
    </div>
  );
}

export function GroupLabel({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <h3 className={`pt-5 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] ${muted ? "text-slate-400" : "text-blue-600"}`}>
      {children}
    </h3>
  );
}

export function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-slate-100 py-3">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-bold text-slate-800">{value}</dd>
    </div>
  );
}

export function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 border-b border-slate-100 py-2.5 text-sm font-medium text-slate-700">
      <I.check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}

export function HighlightTile({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string }) {
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

/** Row of `count` gold stars for a rating out of 5 (supports half via width). */
export function StarRow({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className={`relative inline-block ${className}`}>
            <I.star className={`${className} absolute inset-0 text-slate-200`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <I.star className={`${className} text-amber-400`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export type { IconProps };
