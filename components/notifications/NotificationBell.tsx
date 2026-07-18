"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNotifications } from "./NotificationsProvider";
import { BellIcon, NotificationList, UnreadBadge } from "./notifications-shared";

/**
 * Standalone notification bell for the site header. Shares one source of truth
 * with the rest of the app via NotificationsProvider — opening it marks all
 * read everywhere at once. Renders nothing when signed out.
 */
export function NotificationBell() {
  const { signedIn, notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Opening clears the unread badge.
  const handleToggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) markAllRead();
      return next;
    });
  };

  // Close on outside click or Escape.
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

  if (!signedIn) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 outline-none transition-colors hover:border-blue-600 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && <UnreadBadge count={unreadCount} className="absolute -right-0.5 -top-0.5" />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-150 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none"
        >
          <p className="border-b border-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
            Notifications
          </p>
          <NotificationList items={notifications} />
        </div>
      )}
    </div>
  );
}
