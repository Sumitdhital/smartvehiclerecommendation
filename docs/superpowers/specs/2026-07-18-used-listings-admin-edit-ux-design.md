# Used-Listings Admin — Better Edit UX

**Date:** 2026-07-18
**Branch:** `feat/car-view-history` (current)
**Status:** Approved design, ready for implementation plan

## Background

The `/admin/used-listings` page already provides full CRUD for the used-car
marketplace via the generic `components/admin/ResourceManager.tsx` (table +
Edit/Delete buttons + a modal form), backed by:

- `GET/POST /api/admin/used-listings`
- `PATCH/DELETE /api/admin/used-listings/[id]`

The four bundled "demo" listings (`USED_LISTINGS` in `lib/vehicles-db.ts`) were
seeded into the `public.used_listings` table (rows with `user_id IS NULL`,
created 2026-07-16). `/used` treats the **DB as the source of truth** and only
falls back to the static array when the table is empty
(`app/used/page.tsx` lines 46–52). Therefore the demo cars are already real DB
rows that admins can edit and delete, and those changes already reflect on
`/used`. **No seed-management work is required.**

The genuinely missing piece is a better *editing experience*. Three
improvements, all opt-in additions to the shared `ResourceManager` so the
`vehicles` and `admins` pages are unaffected.

## Goals

1. Replace pasted image-URL editing with real photo upload + thumbnail previews
   (upload / remove) for used listings.
2. Group the long, flat edit form into labelled sections.
3. Allow inline quick-editing of a few key fields (price, sold status,
   location) directly in the admin table without opening the modal.

## Non-goals

- Seed-restore parity (a `seed_key` column so re-seeding restores deleted demo
  cars). Explicitly deferred.
- Changes to the public `/used` page, the `/used/new` user flow, or the
  `vehicles` / `admins` admin pages.
- Image reordering (upload + remove only).

## Design

### A1. Photo upload + thumbnails

**New route: `POST /api/admin/used-listings/upload`** (admin-gated via
`requireAdmin()` / `unauthorized()`).

- Accepts `multipart/form-data` with one or more `files`.
- Uploads each file to the existing public `listing-photos` bucket using the
  **service-role** client (`getSupabaseAdmin()`), path
  `admin/{Date.now()}-{index}.{ext}`. Service role is required because the admin
  panel authenticates with a custom signed cookie, not Supabase Auth, so a
  client-side upload would fail the bucket's authenticated-only INSERT policy.
- Validates extension/content-type (images only) and rejects oversized files
  (cap, e.g. 5 MB each). Returns `{ urls: string[] }` (public URLs) or
  `{ error }` with an appropriate status.

**New `ResourceManager` field type `"photos"`.**

- `toInput` / `toPayload` treat it exactly like `"tags"` — the underlying value
  is a `string[]` of image URLs, persisted to the `images` jsonb column.
- Renders: a row of current-image thumbnails, each with an **×** overlay to
  remove it from the array; an **Upload photos** button wrapping a hidden
  `<input type="file" multiple accept="image/*">`. On selection it POSTs to the
  field's configured upload endpoint, shows a per-field uploading state, and
  appends the returned URLs to the array. Errors surface inline in the field.
- `FieldDef` gains `uploadEndpoint?: string` so the field knows where to POST.
  For used listings this is `/api/admin/used-listings/upload`.

The used-listings `images` field changes from `type: "tags"` to
`type: "photos"` with `uploadEndpoint` set.

### A2. Grouped form sections

- `FieldDef` gains `section?: string`.
- The modal renders fields grouped by `section`, in first-appearance order,
  each group preceded by a full-width section header. Fields without a
  `section` render in an implicit leading group with no header — this keeps the
  `vehicles` and `admins` pages byte-for-byte identical in behaviour.
- Used-listings section assignment:
  - **Vehicle** — brand, model, variant, year, km_driven, condition, fuel,
    transmission, color, is_ev, battery_health
  - **Pricing** — listing_type, asking_price, original_price
  - **Location & Seller** — location, seller_name, seller_type
  - **Media** — images (photos), features
  - **Status** — sold, description

### A3. Inline quick-edit in the table

- `ColumnDef` gains `inlineEdit?: "text" | "number" | "toggle"`.
- Behaviour per mode when the flag is present:
  - `toggle` — the cell renders a clickable control (e.g. the Available/Sold
    pill); clicking PATCHes `{ [key]: !current }`.
  - `text` / `number` — clicking the displayed value swaps it for a small input
    seeded with the current value; **Enter** or blur PATCHes `{ [key]: value }`,
    **Escape** cancels without saving.
- Uses the existing `PATCH ${endpoint}/${id}`. On success the row is updated in
  local state; on error the list is reloaded and the message shown (reuse the
  existing alert/error affordance). A per-cell saving state disables re-entry.
- Columns without `inlineEdit` are unchanged. The column's `render` still
  controls the read display.
- Used-listings columns getting the flag: `sold` (toggle), `asking_price`
  (number), `location` (text).

## Files touched

- `components/admin/ResourceManager.tsx` — add `"photos"` field type +
  `uploadEndpoint`; add `section` grouping in the modal; add `inlineEdit`
  column support in the table.
- `app/admin/used-listings/page.tsx` — set `images` to `photos` w/ endpoint,
  assign `section` to every field, add `inlineEdit` to the three columns.
- `app/api/admin/used-listings/upload/route.ts` — **new** upload route.
- (No DB migration. `images` is already `jsonb`.)

## Testing / verification

Manual end-to-end on the dev server (user runs `npm run dev` on :3000):

1. Log into `/admin`, open **Used listings**.
2. Edit a listing → **Media** section → upload a photo → thumbnail appears →
   Save changes → reopen to confirm the URL persisted; confirm the image shows
   on `/used`.
3. Remove a photo via **×** → Save → confirm gone.
4. In the table, click the **Sold/Available** pill → toggles and persists;
   click **price** and **location** → edit inline, Enter saves, Esc cancels.
5. Confirm the `vehicles` and `admins` admin pages still render and edit
   normally (no sections, no inline edit, no photo field) — regression check on
   the shared component.

## Risks / notes

- Service-role upload bypasses RLS by design; the route must stay admin-gated.
- Uploaded files under `listing-photos/admin/…` are public (matches how user
  listing photos already work).
- All `ResourceManager` additions are optional props → backward compatible.
