"use client";

import React from "react";
import type { User } from "@supabase/supabase-js";

function initialsOf(nameOrEmail: string): string {
  const s = nameOrEmail.trim();
  if (!s) return "U";
  if (s.includes("@")) return s[0]!.toUpperCase();
  const parts = s.split(/\s+/);
  const two = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (two || s[0]!).toUpperCase();
}

/** Profile summary: avatar initials, name, email, account-type badge, join date. */
export function ProfileCard({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string) || user.email || "Account";
  const email = user.email ?? "";
  const isDealer = user.user_metadata?.account_type === "dealer";
  const initials = initialsOf(name);
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />
      <div className="px-6 pb-6">
        <div className="-mt-10 flex items-end gap-4">
          <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-black text-white shadow-lg ring-4 ring-white">
            {initials}
          </span>
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black tracking-tight text-slate-900">{name}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  isDealer
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {isDealer ? "Dealer" : "Individual"}
              </span>
            </div>
            {email && <p className="truncate text-sm font-medium text-slate-500">{email}</p>}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-400">Account type</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-800">
              {isDealer ? "Dealer" : "Individual"}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-slate-800">{email || "—"}</dd>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <dt className="text-[11px] font-black uppercase tracking-wide text-slate-400">Member since</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-800">{joined}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
