"use client";

import React from "react";

/** Minimal shape both the user bell and the admin bell render. */
export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

/** Compact "3m ago" / "2h ago" / "Jul 12" relative timestamp. */
export function timeAgo(iso: string): string {
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

/** Outline bell glyph. */
export function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

/** Red unread-count pill; renders nothing when count is 0. */
export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white ${
        className ?? ""
      }`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Shared notification list body (used inside both dropdowns). */
export function NotificationList({ items }: { items: NotificationItem[] }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-sm font-medium text-slate-400">You&apos;re all caught up.</p>;
  }
  return (
    <ul className="max-h-72 overflow-y-auto py-1">
      {items.map((n) => (
        <li key={n.id} className={`px-4 py-2.5 ${n.read ? "" : "bg-blue-50/60"}`}>
          <div className="flex items-start gap-2">
            <span
              className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-blue-500"}`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs font-medium leading-snug text-slate-500">{n.body}</p>}
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{timeAgo(n.createdAt)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
