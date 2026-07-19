"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchNotifications,
  markAllRead as markAllReadDb,
  subscribeToNotifications,
  type AppNotification,
} from "@/lib/notifications";

interface NotificationsContextValue {
  /** Whether a Supabase user is signed in (drives whether the bell shows). */
  signedIn: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  /** Marks everything read in the DB and locally, in one call. */
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/** Single source of truth for the signed-in user's notifications. */
export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Track the signed-in Supabase user.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setUserId(session?.user.id ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load notifications for the current user and stay live via realtime.
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    fetchNotifications().then(setNotifications);
    const unsubscribe = subscribeToNotifications(userId, (n) =>
      setNotifications((prev) => [n, ...prev].slice(0, 8))
    );
    return unsubscribe;
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (unreadCount === 0) return;
    markAllReadDb();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <NotificationsContext.Provider
      value={{ signedIn: userId !== null, notifications, unreadCount, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
