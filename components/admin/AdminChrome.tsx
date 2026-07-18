"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminNotificationBell from "./AdminNotificationBell";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/used-listings", label: "Used listings" },
  { href: "/admin/admins", label: "Admins" },
];

export default function AdminChrome({ adminName, children }: { adminName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex lg:flex-col">
        <div className="p-5 lg:p-6 flex lg:flex-col gap-4 w-full">
          <div className="flex items-center gap-2 lg:w-full lg:justify-between">
            <Link href="/admin" className="flex items-center gap-2 font-black text-lg text-blue-600 tracking-tight">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
              <span>Admin</span>
            </Link>
            <AdminNotificationBell />
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:mt-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                  isActive(item)
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block mt-auto pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-extrabold text-slate-700 truncate">{adminName}</p>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="mt-3 w-full text-center border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>

          {/* Mobile sign-out */}
          <button
            onClick={logout}
            disabled={loggingOut}
            className="lg:hidden ml-auto border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-grow p-5 sm:p-8 max-w-5xl w-full">{children}</main>
    </div>
  );
}
