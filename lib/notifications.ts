// lib/notifications.ts — data layer for owner notifications.
// Rows are created server-side by a Postgres trigger when someone books a
// test drive on a user's listing (see the test_drive_bookings migration).
// Clients can only read and mark-read their own notifications (RLS).

import { supabase } from "./supabase";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

function rowToNotification(r: DbNotification): AppNotification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    read: r.read,
    createdAt: r.created_at,
  };
}

/** Latest notifications for the signed-in user, newest first. */
export async function fetchNotifications(limit = 8): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as DbNotification[]).map(rowToNotification);
}

/** Marks every unread notification for the signed-in user as read. */
export async function markAllRead(): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("read", false);
}

/**
 * Subscribes to newly inserted notifications for `userId`. Returns an
 * unsubscribe function. Fires `onInsert` with each new notification.
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (n: AppNotification) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onInsert(rowToNotification(payload.new as DbNotification))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
