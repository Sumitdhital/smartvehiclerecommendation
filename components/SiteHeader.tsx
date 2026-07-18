"use client";

import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/** Shared sticky header for sub-pages (used marketplace, listing form). */
export function SiteHeader({ active }: { active?: "find" | "used" | "compare" }) {
  const navLink = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`transition-colors ${
        active === key ? "text-blue-600" : "hover:text-blue-600"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl sm:text-2xl text-blue-600 tracking-tight"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-7 h-7 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"
              />
            </svg>
            <span>SaaS Nepal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navLink("/", "find", "Find cars")}
            {navLink("/used", "used", "Used cars")}
            {navLink("/compare", "compare", "Compare")}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link
            href="/used/new"
            className="hidden sm:inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-md shadow-blue-500/20"
          >
            + List your car
          </Link>
          <UserMenu signInClassName="border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold px-4 sm:px-5 py-2 rounded-xl text-sm transition-all duration-200" />
        </div>
      </div>
    </header>
  );
}
