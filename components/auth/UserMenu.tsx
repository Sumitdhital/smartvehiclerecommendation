"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Notifications live in the header bell (NotificationsProvider/NotificationBell),
// not here — this menu must never subscribe to the notifications channel.

const DEFAULT_SIGNIN =
  "border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold px-5 py-2 rounded-xl text-sm transition-all duration-200";

function initialsOf(nameOrEmail: string): string {
  const s = nameOrEmail.trim();
  if (!s) return "U";
  if (s.includes("@")) return s[0]!.toUpperCase();
  const parts = s.split(/\s+/);
  const two = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (two || s[0]!).toUpperCase();
}

export function UserMenu({ signInClassName }: { signInClassName?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load the current session and stay in sync with sign-in / sign-out.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleOpen = () => setOpen((o) => !o);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Reserve space while the session resolves — avoids a Sign In ↔ avatar flash.
  if (!ready) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" aria-hidden />;
  }

  if (!user) {
    return (
      <Link href="/login" className={signInClassName ?? DEFAULT_SIGNIN}>
        Sign In
      </Link>
    );
  }

  const name = (user.user_metadata?.full_name as string) || user.email || "Account";
  const email = user.email ?? "";
  const initials = initialsOf(name);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="relative flex items-center gap-1.5 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-600/25 ring-2 ring-white">
          {initials}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-150 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none"
        >
          {/* Identity */}
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900">{name}</p>
              {email && <p className="truncate text-xs font-medium text-slate-400">{email}</p>}
            </div>
          </div>

          <div className="py-1.5">
            {user.user_metadata?.account_type === "dealer" && (
              <Link
                href="/dealer/new-car"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h-8.25a1.125 1.125 0 0 0-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h.375m10.125-12v11.25M9 6.75h.75M9 6.75a2.25 2.25 0 0 0-2.25 2.25v.75m2.25-3H12"
                  />
                </svg>
                List a new car
              </Link>
            )}
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
