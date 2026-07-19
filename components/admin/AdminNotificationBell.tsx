"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAdminNotifications,
  markAdminNotificationsRead,
  type AdminNotification,
} from "@/lib/admin-notifications";
import { BellIcon, NotificationList, UnreadBadge } from "@/components/notifications/notifications-shared";

const POLL_MS = 60_000;

/**
 * Notification bell for the admin sidebar. Admins aren't Supabase users, so this
 * polls a cookie-authed API route instead of using realtime like the user bell.
 */
export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const { notifications, unreadCount } = await fetchAdminNotifications();
    setNotifications(notifications);
    setUnreadCount(unreadCount);
  }, []);

  // Fetch on mount and poll to keep the badge fresh.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const handleToggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) {
        refresh(); // pull the freshest list when opening
        if (unreadCount > 0) {
          markAdminNotificationsRead();
          setUnreadCount(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
      }
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
          // Bell sits at the right edge of the lg sidebar, so open rightward there;
          // on mobile it's at the top-right of the bar and must open leftward.
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-150 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none lg:left-0 lg:right-auto"
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
