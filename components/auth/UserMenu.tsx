"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  fetchNotifications,
  markAllRead,
  subscribeToNotifications,
  type AppNotification,
} from "@/lib/notifications";

// Compact "3m ago" / "2h ago" / "Jul 12" relative timestamp.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  // Load notifications for the signed-in user and stay live via realtime.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    fetchNotifications().then(setNotifications);
    const unsubscribe = subscribeToNotifications(user.id, (n) =>
      setNotifications((prev) => [n, ...prev].slice(0, 8))
    );
    return unsubscribe;
  }, [user]);

  // Opening the menu clears the unread badge.
  const handleOpen = () => {
    setOpen((o) => {
      const next = !o;
      if (next && unreadCount > 0) {
        markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
      return next;
    });
  };

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
        aria-label={unreadCount > 0 ? `Account menu, ${unreadCount} new notifications` : "Account menu"}
        className="relative flex items-center gap-1.5 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-600/25 ring-2 ring-white">
          {initials}
        </span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
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

          {/* Notifications */}
          <div className="border-b border-slate-100">
            <p className="px-4 pb-1.5 pt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
              Notifications
            </p>
            {notifications.length === 0 ? (
              <p className="px-4 pb-3 text-sm font-medium text-slate-400">You're all caught up.</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto pb-1.5">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-2.5 ${n.read ? "" : "bg-blue-50/60"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                          n.read ? "bg-transparent" : "bg-blue-500"
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 text-xs font-medium leading-snug text-slate-500">{n.body}</p>
                        )}
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
              href="/history"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Search History
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
