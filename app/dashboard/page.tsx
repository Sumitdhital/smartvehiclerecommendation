"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { MyListingsSection } from "@/components/dashboard/MyListingsSection";
import { TestDrivesSection } from "@/components/dashboard/TestDrivesSection";
import { RentalsSection } from "@/components/dashboard/RentalsSection";
import { SearchHistorySection } from "@/components/dashboard/SearchHistorySection";

type TabKey = "profile" | "listings" | "testdrives" | "rentals" | "history";

const TABS: { key: TabKey; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "listings", label: "My listings" },
  { key: "testdrives", label: "Test drives" },
  { key: "rentals", label: "Rentals" },
  { key: "history", label: "Search history" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey>("profile");

  // Signed-out visitors are bounced to login with a return path.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/dashboard");
        return;
      }
      setUser(data.session.user);
      setReady(true);
    });
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          <div className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white" />
        </main>
      </div>
    );
  }

  const isDealer = user.user_metadata?.account_type === "dealer";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
            Your account
          </span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage your listings, bookings, and rental requests in one place.
          </p>
        </div>

        {/* Tab bar */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-1 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  tab === t.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active panel */}
        <div>
          {tab === "profile" && <ProfileCard user={user} />}
          {tab === "listings" && <MyListingsSection userId={user.id} isDealer={isDealer} />}
          {tab === "testdrives" && <TestDrivesSection userId={user.id} />}
          {tab === "rentals" && <RentalsSection userId={user.id} />}
          {tab === "history" && <SearchHistorySection />}
        </div>
      </main>

      <footer className="mt-12 w-full border-t border-slate-100 bg-white py-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
          Copyright © 2026 SaaS Nepal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
