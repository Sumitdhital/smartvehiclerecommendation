# Car view history — design

Date: 2026-07-17

## Goal

When a signed-in **user** or an **admin** views a car, record that view and
surface it as "recently viewed":

- **User** views are merged into the existing `search_history` feature and shown
  on `/history` next to text searches, clickable to reopen the car.
- **Admin** views are stored separately and shown on the `/admin` dashboard.
  Admins are tracked from **both** the public car page (`/vehicle/[id]`, admin
  cookie read server-side) and from opening a vehicle row in the admin panel.

Admins do not use Supabase Auth (they use the signed `admin_session` cookie —
see the admin panel), so their views cannot be attributed via RLS/`auth.uid()`
and need their own storage + write path.

## Non-goals

- Used listings have no detail page yet, so only new-catalog cars
  (`/vehicle/[id]`) are tracked.
- No analytics/aggregation (view counts, popularity) — this is a per-actor
  "recently viewed" log only.
- Existing text-search history behavior is unchanged.

## Data model

### `search_history` (extend — non-breaking)

- Add nullable `vehicle_id text`.
- Extend the `source` check constraint to allow `'view'` in addition to
  `'new' | 'used'`.
- Keep `UNIQUE(user_id, query, source)`.

A view entry is stored as `source='view'`, `query=<car name>`,
`vehicle_id=<car id>`. Because dedup is on `(user_id, query, source)`, viewing
the same car again upserts and bumps `created_at` instead of duplicating.
Catalog car names are unique, so this dedups one row per car. A view entry and a
text search with the same string never collide because their `source` differs.

Migration is additive; existing rows keep `vehicle_id = NULL` and `source` in
`{'new','used'}`.

### `admin_vehicle_views` (new)

| column        | type          | notes                                  |
|---------------|---------------|----------------------------------------|
| `id`          | uuid pk       | `default gen_random_uuid()`            |
| `admin_id`    | uuid          | references `public.admins(id)`         |
| `admin_email` | text          | denormalized for display               |
| `vehicle_id`  | text          | catalog id, links to `/vehicle/[id]`   |
| `vehicle_name`| text          | display                                |
| `viewed_at`   | timestamptz   | `default now()`                        |

- `UNIQUE(admin_id, vehicle_id)` so re-views bump `viewed_at`.
- RLS **enabled with no policies**. Only the service-role admin client
  (`getSupabaseAdmin()`) reads/writes it, consistent with the rest of the admin
  panel. The service role bypasses RLS; anon/authenticated clients get nothing.

## Code changes

### `lib/search-history.ts`

- `SearchSource` becomes `'new' | 'used' | 'view'`.
- `SearchHistoryEntry` gains `vehicle_id: string | null`.
- `listHistory` selects `vehicle_id`.
- New `recordView(vehicleId: string, vehicleName: string): Promise<void>` —
  best-effort upsert (`onConflict: "user_id,query,source"`) with `source='view'`,
  `query=vehicleName`, `vehicle_id=vehicleId`; silently no-ops when logged out or
  on any error, exactly like `recordSearch`.

### `lib/admin-vehicle-views.ts` (new)

Server-only helpers using `getSupabaseAdmin()`:

- `recordAdminView(input: { adminId: string; adminEmail: string; vehicleId: string; vehicleName: string }): Promise<void>`
  — upsert on `(admin_id, vehicle_id)`, bumping `viewed_at`. Best-effort.
- `listAdminViews(limit = 50): Promise<AdminVehicleView[]>` — newest first.

### `app/api/admin/vehicle-views/route.ts` (new)

- `POST` — `requireAdmin()`; on null return `unauthorized()`. Body
  `{ vehicleId, vehicleName }`. Calls `recordAdminView` with the session's admin
  id + email. Returns `{ ok: true }`.
- `GET` — `requireAdmin()` gated; returns `{ data: AdminVehicleView[] }` from
  `listAdminViews()` for the dashboard.

## Recording triggers

1. **User view (client)** — `components/vehicle/VehicleDetail.tsx` gets a
   `useEffect(() => { recordView(vehicle.id, vehicle.name); }, [vehicle.id])`.
   No-ops when the visitor is not a signed-in Supabase user (including admins,
   who are caught server-side instead).

2. **Admin view / public page (server)** — `app/vehicle/[id]/page.tsx` (server
   component) reads the admin session via `getAdminSession()`; if present, calls
   `recordAdminView(...)` inside try/catch. This makes the page dynamic
   (approved). Idempotent via the unique upsert, so repeated renders are safe.

3. **Admin view / panel (client)** — `components/admin/ResourceManager.tsx` gains
   an optional prop `onRowOpen?: (row: Row) => void`, called inside `openEdit`.
   `app/admin/vehicles/page.tsx` passes an `onRowOpen` that POSTs
   `{ vehicleId: row.id, vehicleName: row.name }` to
   `/api/admin/vehicle-views` (fire-and-forget, errors ignored). The prop is only
   passed on the vehicles resource, so used-listings/admins tables are untracked.

## Display

### `/history` (`app/history/page.tsx`)

- View entries (`source === 'view'`) render with a distinct badge
  (e.g. "Viewed", green) and a car icon, linking to
  `/vehicle/${entry.vehicle_id}` instead of the `?q=` re-run links.
- Non-view entries keep their current "New cars" / "Used cars" badges and
  `?q=` links.
- Delete / clear-all behavior is unchanged (view rows delete like any other).
- Empty-state and skeleton copy unchanged.

### `/admin` dashboard (`app/admin/page.tsx`)

- New "Recently viewed vehicles" section below the existing cards/seed panel.
- Fetches `GET /api/admin/vehicle-views` on mount.
- Each row shows car name (linked to `/vehicle/[id]`), the admin email that
  viewed it, and a time-ago stamp. Empty state when there are none.

## Error handling & guarantees

- All recording paths are best-effort (try/catch, silent no-op); a failure never
  blocks page render or navigation.
- `recordView` and `recordAdminView` swallow errors.
- The admin route returns 401 for non-admins; the panel client ignores POST
  failures.

## Verification (manual)

1. **User:** sign in as a normal Supabase user, open a car → a "Viewed" row
   appears on `/history` and a `source='view'` row exists in `search_history`;
   reopening the same car bumps it to the top without duplicating.
2. **Admin / public page:** logged in as admin, open `/vehicle/[id]` → a row
   appears in `admin_vehicle_views` and in the dashboard section.
3. **Admin / panel:** open a vehicle row in `/admin/vehicles` → a row is
   recorded / bumped and shown on the dashboard.
4. **Logged out:** open a car → nothing recorded anywhere.
