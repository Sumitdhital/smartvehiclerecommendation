# Car View History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record when a signed-in user or an admin views a car and surface those views as "recently viewed" — user views merged into the existing `search_history`/`/history` feature, admin views in a separate table shown on the `/admin` dashboard.

**Architecture:** User views upsert a `source='view'` row into `search_history` (client-side, RLS by `auth.uid()`). Admin views (who use the custom `admin_session` cookie, not Supabase Auth) upsert into a new `admin_vehicle_views` table via the service-role client — triggered both server-side on the public `/vehicle/[id]` page and client-side when an admin opens a vehicle row in the panel.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (`@supabase/supabase-js`), Tailwind.

## Global Constraints

- **Never run `npm run dev`.** The user runs the dev server themselves on port 3000; a second dev server corrupts `.next`.
- **Type-check with `npx tsc --noEmit`; lint with `npm run lint`.** Avoid `npm run build` while the user's dev server may be running — it writes `.next` and can clobber the running server. Runtime behavior is verified manually in the user's browser + DB queries.
- **Vehicle display name convention:** ``${brand} ${model} ${variant}`` everywhere a car label is stored.
- **All recording is best-effort:** recording paths must never throw or block page render / navigation.
- **Supabase project ref:** `rdnqytmpkqiuafytcjwi`. Apply DB changes via the Supabase MCP `apply_migration` tool.
- **Commit after each task.**
- **Public-site catalog note:** the public `/vehicle/[id]` page reads from the static `VEHICLES` array (`getVehicleById`), keyed by slug ids like `"byd-dolphin"`. The admin panel reads DB rows (uuid ids). Prefer the DB row's `slug` when recording panel views so dashboard links resolve on the public page; DB-only vehicles with no matching static entry may still 404 — an accepted, pre-existing gap.

---

## File Structure

- **DB migration** (via MCP) — extends `search_history`, creates `admin_vehicle_views`.
- `lib/search-history.ts` (modify) — add `recordView`, `'view'` source, `vehicle_id` field.
- `lib/admin-vehicle-views.ts` (create) — service-role data layer for admin views.
- `app/api/admin/vehicle-views/route.ts` (create) — POST record / GET list, admin-gated.
- `components/vehicle/VehicleDetail.tsx` (modify) — client effect recording user views.
- `app/vehicle/[id]/page.tsx` (modify) — server-side admin view recording.
- `components/admin/ResourceManager.tsx` (modify) — optional `onRowOpen` prop.
- `app/admin/vehicles/page.tsx` (modify) — pass `onRowOpen` that POSTs the panel view.
- `app/history/page.tsx` (modify) — render `view` entries with a "Viewed" badge + car link.
- `app/admin/page.tsx` (modify) — "Recently viewed vehicles" dashboard section.

---

## Task 1: Database migration

**Files:**
- MCP migration only (no repo files).

**Interfaces:**
- Produces: `search_history.vehicle_id text` (nullable); `search_history.source` accepts `'view'`; table `public.admin_vehicle_views(id, admin_id, admin_email, vehicle_id, vehicle_name, viewed_at)` with `unique(admin_id, vehicle_id)`.

- [ ] **Step 1: Apply the migration**

Call the Supabase MCP tool `apply_migration` with `project_id: "rdnqytmpkqiuafytcjwi"`, `name: "car_view_history"`, and this SQL:

```sql
-- 1. search_history: allow 'view' entries + store the viewed vehicle id.
alter table public.search_history
  add column if not exists vehicle_id text;

do $$
declare c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.search_history'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%source%';
  if c is not null then
    execute format('alter table public.search_history drop constraint %I', c);
  end if;
end $$;

alter table public.search_history
  add constraint search_history_source_check
  check (source = any (array['new'::text, 'used'::text, 'view'::text]));

-- 2. admin_vehicle_views: admins are not Supabase-authed, so service-role only.
create table if not exists public.admin_vehicle_views (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id) on delete cascade,
  admin_email text not null,
  vehicle_id text not null,
  vehicle_name text not null,
  viewed_at timestamptz not null default now(),
  unique (admin_id, vehicle_id)
);

alter table public.admin_vehicle_views enable row level security;
-- Intentionally no policies: only the service-role client (bypasses RLS) uses it.
```

- [ ] **Step 2: Verify the schema**

Call the Supabase MCP tool `list_tables` with `project_id: "rdnqytmpkqiuafytcjwi"`, `schemas: ["public"]`, `verbose: true`.
Expected: `search_history` has a `vehicle_id` text column and its `source` check reads `ANY (ARRAY['new','used','view'])`; `admin_vehicle_views` exists with the six columns and `rls_enabled: true`.

- [ ] **Step 3: No commit** (schema change is remote; nothing to commit in the repo).

---

## Task 2: `recordView` in the search-history data layer

**Files:**
- Modify: `lib/search-history.ts`

**Interfaces:**
- Consumes: `search_history` schema from Task 1.
- Produces: `type SearchSource = "new" | "used" | "view"`; `SearchHistoryEntry` gains `vehicle_id: string | null`; `recordView(vehicleId: string, vehicleName: string): Promise<void>`.

- [ ] **Step 1: Widen `SearchSource` and the entry type**

In `lib/search-history.ts`, replace the `SearchSource` type and `SearchHistoryEntry` interface with:

```ts
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
```

- [ ] **Step 2: Select `vehicle_id` in `listHistory`**

In `listHistory`, change the `.select(...)` line to:

```ts
    .select("id, query, source, vehicle_id, created_at")
```

- [ ] **Step 3: Add `recordView`**

Add this function after `recordSearch` in `lib/search-history.ts`:

```ts
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
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/search-history.ts
git commit -m "feat: add recordView + view source to search history data layer"
```

---

## Task 3: Admin-view data layer + API route

**Files:**
- Create: `lib/admin-vehicle-views.ts`
- Create: `app/api/admin/vehicle-views/route.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin()` from `lib/supabase`; `requireAdmin`, `unauthorized` from `lib/admin-auth`; `AdminSession` (`{ id, email, name, exp }`).
- Produces: `AdminVehicleView` type; `recordAdminView(input: { adminId, adminEmail, vehicleId, vehicleName }): Promise<void>`; `listAdminViews(limit?): Promise<AdminVehicleView[]>`; `GET`/`POST` at `/api/admin/vehicle-views`.

- [ ] **Step 1: Create the data layer**

Create `lib/admin-vehicle-views.ts`:

```ts
// lib/admin-vehicle-views.ts — server-only data layer for admin car views.
// Rows live in public.admin_vehicle_views. Admins use the custom admin_session
// cookie (not Supabase Auth), so these are written/read exclusively with the
// service-role client, which bypasses RLS.

import { getSupabaseAdmin } from "./supabase";

export interface AdminVehicleView {
  id: string;
  admin_id: string;
  admin_email: string;
  vehicle_id: string;
  vehicle_name: string;
  viewed_at: string;
}

export interface RecordAdminViewInput {
  adminId: string;
  adminEmail: string;
  vehicleId: string;
  vehicleName: string;
}

/** Upsert an admin's view of a vehicle, bumping viewed_at on repeat. Best-effort. */
export async function recordAdminView(input: RecordAdminViewInput): Promise<void> {
  const name = input.vehicleName.trim();
  if (!input.adminId || !input.vehicleId || !name) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("admin_vehicle_views").upsert(
      {
        admin_id: input.adminId,
        admin_email: input.adminEmail,
        vehicle_id: input.vehicleId,
        vehicle_name: name,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "admin_id,vehicle_id" }
    );
  } catch {
    // Best-effort — never block a page or request.
  }
}

/** Most recently viewed vehicles across all admins, newest first. */
export async function listAdminViews(limit = 50): Promise<AdminVehicleView[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_vehicle_views")
    .select("id, admin_id, admin_email, vehicle_id, vehicle_name, viewed_at")
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminVehicleView[];
}
```

- [ ] **Step 2: Create the API route**

Create `app/api/admin/vehicle-views/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";
import { recordAdminView, listAdminViews } from "@/lib/admin-vehicle-views";

// Recent admin views for the dashboard.
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const data = await listAdminViews();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load views." },
      { status: 500 }
    );
  }
}

// Record an admin view (called when an admin opens a vehicle in the panel).
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
  const vehicleName = typeof body.vehicleName === "string" ? body.vehicleName : "";
  if (!vehicleId || !vehicleName) {
    return NextResponse.json(
      { error: "vehicleId and vehicleName are required." },
      { status: 400 }
    );
  }

  await recordAdminView({
    adminId: admin.id,
    adminEmail: admin.email,
    vehicleId,
    vehicleName,
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/admin-vehicle-views.ts app/api/admin/vehicle-views/route.ts
git commit -m "feat: add admin vehicle-views data layer + API route"
```

---

## Task 4: Record views on the public car page

**Files:**
- Modify: `components/vehicle/VehicleDetail.tsx`
- Modify: `app/vehicle/[id]/page.tsx`

**Interfaces:**
- Consumes: `recordView` (Task 2); `recordAdminView` (Task 3); `getAdminSession` from `lib/admin-auth`.
- Produces: user views logged client-side, admin views logged server-side on every `/vehicle/[id]` render.

- [ ] **Step 1: Import `recordView` in `VehicleDetail.tsx`**

`useEffect` is already imported on line 3. Add this import alongside the other `@/lib` imports near the top of `components/vehicle/VehicleDetail.tsx`:

```ts
import { recordView } from "@/lib/search-history";
```

- [ ] **Step 2: Add the recording effect**

In the `VehicleDetail` component body, immediately after `const v = vehicle;` (line 317), add:

```ts
  // Log a "viewed" entry for signed-in users (no-ops when logged out; admins
  // are logged server-side in app/vehicle/[id]/page.tsx instead).
  useEffect(() => {
    recordView(v.id, `${v.brand} ${v.model} ${v.variant}`);
  }, [v.id, v.brand, v.model, v.variant]);
```

- [ ] **Step 3: Import admin helpers in the page**

In `app/vehicle/[id]/page.tsx`, add these imports below the existing ones:

```ts
import { getAdminSession } from "@/lib/admin-auth";
import { recordAdminView } from "@/lib/admin-vehicle-views";
```

- [ ] **Step 4: Record the admin view server-side**

In `app/vehicle/[id]/page.tsx`, after the `if (!vehicle) { notFound(); }` block and before the `taxData` calculation, add:

```ts
  // If an admin (custom cookie session) is viewing, log it to the admin panel.
  // recordAdminView is best-effort and swallows its own errors.
  const adminSession = await getAdminSession();
  if (adminSession) {
    await recordAdminView({
      adminId: adminSession.id,
      adminEmail: adminSession.email,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.variant}`,
    });
  }
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual runtime verification**

Ask the user (their dev server is running):
1. Signed in as a normal Supabase user, open a car detail page, then query the DB. Run the Supabase MCP `execute_sql` on `rdnqytmpkqiuafytcjwi`: `select query, source, vehicle_id from search_history where source = 'view' order by created_at desc limit 5;` — expect a row with the car name and its slug.
2. Signed in as an admin (admin_session cookie), open a car detail page, then run: `select vehicle_name, vehicle_id, admin_email from admin_vehicle_views order by viewed_at desc limit 5;` — expect a row.
Expected: both queries return the expected rows.

- [ ] **Step 7: Commit**

```bash
git add components/vehicle/VehicleDetail.tsx app/vehicle/[id]/page.tsx
git commit -m "feat: record user + admin car views on the detail page"
```

---

## Task 5: Record admin views from the vehicles panel

**Files:**
- Modify: `components/admin/ResourceManager.tsx`
- Modify: `app/admin/vehicles/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/vehicle-views` (Task 3).
- Produces: `ResourceManager` optional prop `onRowOpen?: (row: Row) => void`, invoked from `openEdit`.

- [ ] **Step 1: Add the `onRowOpen` prop to `ResourceManager`**

In `components/admin/ResourceManager.tsx`, add to the `Props<Row>` interface (after `itemNoun?: string;`):

```ts
  onRowOpen?: (row: Row) => void; // fired when a row's edit modal opens
```

- [ ] **Step 2: Destructure and call it in `openEdit`**

Find where the component destructures its props (the function signature that lists `title, subtitle, endpoint, columns, fields, addLabel, itemNoun`) and add `onRowOpen` to that list.

Then change `openEdit` (currently starting at line 118) so its first line invokes the callback:

```ts
  const openEdit = (row: Row) => {
    onRowOpen?.(row);
    setEditingId(row.id);
```

(Leave the rest of `openEdit` unchanged.)

- [ ] **Step 3: Add `slug` to `VehicleRow` and pass `onRowOpen`**

In `app/admin/vehicles/page.tsx`, add `slug?: string | null;` to the `VehicleRow` interface (before the `[key: string]: unknown;` line).

Then update the rendered `ResourceManager` to pass `onRowOpen`:

```tsx
    <ResourceManager<VehicleRow>
      title="Vehicles"
      subtitle="New vehicle catalog stored in the database."
      endpoint="/api/admin/vehicles"
      columns={columns}
      fields={fields}
      addLabel="Add vehicle"
      itemNoun="vehicle"
      onRowOpen={(row) => {
        // Prefer the slug so the dashboard link resolves on the public page.
        const vehicleId =
          typeof row.slug === "string" && row.slug ? row.slug : row.id;
        fetch("/api/admin/vehicle-views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId,
            vehicleName: `${row.brand} ${row.model} ${row.variant}`,
          }),
        }).catch(() => {});
      }}
    />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual runtime verification**

Ask the user: in `/admin/vehicles`, click **Edit** on a vehicle row. Then run the Supabase MCP `execute_sql` on `rdnqytmpkqiuafytcjwi`: `select vehicle_name, vehicle_id, admin_email, viewed_at from admin_vehicle_views order by viewed_at desc limit 5;`
Expected: a row for the opened vehicle; opening the same row again bumps `viewed_at` without adding a duplicate.

- [ ] **Step 6: Commit**

```bash
git add components/admin/ResourceManager.tsx app/admin/vehicles/page.tsx
git commit -m "feat: log admin vehicle views when opening a panel row"
```

---

## Task 6: Show view entries on `/history`

**Files:**
- Modify: `app/history/page.tsx`

**Interfaces:**
- Consumes: `SearchHistoryEntry.vehicle_id` + `source: 'view'` (Task 2).
- Produces: view entries render with a "Viewed" badge, a car icon, and a link to `/vehicle/[vehicle_id]`.

- [ ] **Step 1: Update the subtitle copy**

In `app/history/page.tsx`, change the subtitle paragraph text from `Tap a search to run it again.` to:

```tsx
              Tap a search to run it again, or a viewed car to reopen it.
```

- [ ] **Step 2: Branch the link target for view entries**

In the `entries.map(...)` block, replace the `<Link ... href={...}>` `href` expression with:

```tsx
                  href={
                    entry.source === "view"
                      ? `/vehicle/${entry.vehicle_id}`
                      : entry.source === "used"
                        ? `/used?q=${encodeURIComponent(entry.query)}`
                        : `/?q=${encodeURIComponent(entry.query)}`
                  }
```

- [ ] **Step 3: Swap the icon for view entries**

Replace the single clock `<svg>` inside that `<Link>` with a conditional — a car icon for views, the existing clock otherwise:

```tsx
                  {entry.source === "view" ? (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5m-18 0h18m-18 0v4m18-4v4M6 17v2m12-2v2M6.5 13.5h.01M17.5 13.5h.01" />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
```

- [ ] **Step 4: Add a "Viewed" badge case**

Replace the source badge `<span>` (the one rendering `Used cars` / `New cars`) with a three-way version:

```tsx
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      entry.source === "view"
                        ? "bg-emerald-50 text-emerald-700"
                        : entry.source === "used"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {entry.source === "view"
                      ? "Viewed"
                      : entry.source === "used"
                        ? "Used cars"
                        : "New cars"}
                  </span>
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual runtime verification**

Ask the user: signed in, open a couple of car pages, then visit `/history`.
Expected: those cars appear with a green "Viewed" badge and a car icon; clicking one reopens `/vehicle/[id]`; the delete (✕) and "Clear all" buttons remove view rows too; reopening a car moves it to the top without duplicating.

- [ ] **Step 7: Commit**

```bash
git add app/history/page.tsx
git commit -m "feat: show viewed cars on the search history page"
```

---

## Task 7: "Recently viewed vehicles" on the admin dashboard

**Files:**
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/vehicle-views` → `{ data: AdminVehicleView[] }` (Task 3).
- Produces: a dashboard section listing recent admin views.

- [ ] **Step 1: Add the type + a time-ago helper**

In `app/admin/page.tsx`, below the imports and above the `Counts` interface, add:

```ts
interface AdminView {
  id: string;
  admin_email: string;
  vehicle_id: string;
  vehicle_name: string;
  viewed_at: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return new Date(iso).toLocaleDateString();
}
```

- [ ] **Step 2: Add state + fetch for views**

Inside `AdminDashboard`, after the `seedError` state declaration, add:

```ts
  const [views, setViews] = useState<AdminView[] | null>(null);
```

Then, inside the existing `useEffect` that calls `loadCounts()`, add a views fetch so both run on mount:

```ts
  useEffect(() => {
    loadCounts();
    fetch("/api/admin/vehicle-views", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setViews(Array.isArray(j.data) ? j.data : []))
      .catch(() => setViews([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 3: Render the section**

In `app/admin/page.tsx`, add this block immediately after the closing `</div>` of the "Seed from catalog" panel and before the outer container's closing `</div>`:

```tsx
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-black text-slate-900 tracking-tight">Recently viewed vehicles</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Cars opened by admins — from the public car pages and this panel.
        </p>

        {views === null ? (
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : views.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-400">No vehicles viewed yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-slate-100">
            {views.map((view) => (
              <li key={view.id} className="flex items-center gap-3 py-3">
                <Link
                  href={`/vehicle/${view.vehicle_id}`}
                  className="min-w-0 flex-grow truncate text-sm font-bold text-slate-800 hover:text-blue-600 hover:underline"
                >
                  {view.vehicle_name}
                </Link>
                <span className="flex-shrink-0 text-xs font-semibold text-slate-400">{view.admin_email}</span>
                <span className="flex-shrink-0 text-xs font-medium text-slate-400">{timeAgo(view.viewed_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual runtime verification**

Ask the user: open a few cars as an admin (public page and/or panel edit), then visit `/admin`.
Expected: the "Recently viewed vehicles" section lists those cars with the admin's email and a time-ago stamp, newest first; car names link to `/vehicle/[id]`.

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: recently viewed vehicles section on admin dashboard"
```

---

## Self-Review

**Spec coverage:**
- User views merged into `search_history` → Tasks 1, 2, 4, 6. ✓
- Admin views in a separate table shown on `/admin` → Tasks 1, 3, 5, 7. ✓
- Admin trigger "both" (public page + panel) → Task 4 (server) + Task 5 (panel). ✓
- Best-effort / no-op recording → `recordView`, `recordAdminView`, fire-and-forget fetch, 401 for non-admins. ✓
- `/history` display with link back to car → Task 6. ✓
- Schema: `vehicle_id`, `'view'` source, `admin_vehicle_views` + RLS-no-policies → Task 1. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `recordView(vehicleId, vehicleName)` (Task 2) matches call in Task 4. `recordAdminView({ adminId, adminEmail, vehicleId, vehicleName })` (Task 3) matches calls in Task 4 and the route. `AdminVehicleView` fields match the `AdminView` shape and SQL columns. `onRowOpen?: (row: Row) => void` (Task 5) matches the vehicles-page usage. `SearchHistoryEntry.vehicle_id` (Task 2) matches `/history` usage (Task 6). ✓
