// Client helpers for the admin notification bar. Admins aren't Supabase users,
// so notifications are read through cookie-authed /api/admin routes rather than
// the RLS-based client used for per-user notifications.

import type { NotificationItem } from "@/components/notifications/notifications-shared";

export interface AdminNotification extends NotificationItem {
  type: string;
}

export interface AdminNotificationsResult {
  notifications: AdminNotification[];
  unreadCount: number;
}

/** Fetch the latest admin notifications and the unread count. */
export async function fetchAdminNotifications(): Promise<AdminNotificationsResult> {
  try {
    const res = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (!res.ok) return { notifications: [], unreadCount: 0 };
    const json = (await res.json()) as AdminNotificationsResult;
    return { notifications: json.notifications ?? [], unreadCount: json.unreadCount ?? 0 };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

/** Mark every unread admin notification as read. */
export async function markAdminNotificationsRead(): Promise<void> {
  try {
    await fetch("/api/admin/notifications", { method: "POST" });
  } catch {
    // Best-effort — the UI already clears its badge optimistically.
  }
}
