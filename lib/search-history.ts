// lib/search-history.ts — data layer for per-user search history.
// Rows live in the Supabase `search_history` table (RLS: users only see
// their own). Re-searching the same term upserts and bumps created_at so
// the history stays deduplicated with the freshest search on top.

import { supabase } from "./supabase";

/** Where the search happened, or a car "view" logged from a detail page. */
export type SearchSource = "new" | "used" | "view";

/** Row shape of public.search_history. */
export interface SearchHistoryEntry {
  id: string;
  query: string;
  source: SearchSource;
  vehicle_id: string | null;
  created_at: string;
}

/**
 * Record a search for the signed-in user. Silently no-ops when logged out
 * or when the term is too short — saving history must never break search.
 */
export async function recordSearch(query: string, source: SearchSource): Promise<void> {
  const q = query.trim();
  if (q.length < 2) return;

  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;

    await supabase
      .from("search_history")
      .upsert(
        { user_id: userId, query: q, source, created_at: new Date().toISOString() },
        { onConflict: "user_id,query,source" }
      );
  } catch {
    // Ignore — history is best-effort.
  }
}

/**
 * Record that the signed-in user viewed a specific vehicle. Stored in the same
 * search_history table as a `source='view'` row so it appears in history and
 * links back to the car. Silently no-ops when logged out; best-effort.
 */
export async function recordView(vehicleId: string, vehicleName: string): Promise<void> {
  const name = vehicleName.trim();
  if (!vehicleId || !name) return;

  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;

    await supabase
      .from("search_history")
      .upsert(
        {
          user_id: userId,
          query: name,
          source: "view",
          vehicle_id: vehicleId,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,query,source" }
      );
  } catch {
    // Ignore — history is best-effort.
  }
}

/** Latest searches for the signed-in user, newest first. */
export async function listHistory(limit = 100): Promise<SearchHistoryEntry[]> {
  const { data, error } = await supabase
    .from("search_history")
    .select("id, query, source, vehicle_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SearchHistoryEntry[];
}

/** Delete a single history entry (RLS restricts this to the owner). */
export async function deleteHistoryEntry(id: string): Promise<void> {
  const { error } = await supabase.from("search_history").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Delete the signed-in user's entire search history. */
export async function clearHistory(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;
  const { error } = await supabase.from("search_history").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}
