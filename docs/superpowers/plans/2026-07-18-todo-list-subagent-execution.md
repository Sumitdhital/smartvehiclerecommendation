# Todo-List Feature Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 11 items in D:\todo.txt for the EV Nepal marketplace: image coverage, dealer/individual signup, home-page cleanup + animated cards, vehicle ownership + booking notifications, rentals as a first-class surface, a user dashboard, expanded admin authority, and a rebuilt vehicle details page with the reference EMI calculator.

**Architecture:** Next.js App Router (client-heavy pages) + Supabase (auth, Postgres with RLS, realtime notifications). Data layers live in `lib/*.ts`; user notifications flow through DB triggers into `public.notifications`, surfaced by `components/notifications/*`. Admin panel is a separate cookie-auth surface under `/admin` with its own API routes and `admin_notifications`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind (inline classes), Supabase JS v2, Supabase MCP for migrations (project id `rdnqytmpkqiuafytcjwi`).

## Global Constraints

- **NEVER run `npm run dev` or any second dev server** — the user runs it themselves on port 3000; a second instance corrupts `.next`. Also do not run `npm run build` while their server may be running. Verify with `npx tsc --noEmit` (and `npx next lint` if quick).
- Supabase project id: `rdnqytmpkqiuafytcjwi` (status ACTIVE_HEALTHY). Apply DDL via MCP `apply_migration`; DML via `execute_sql`. Also mirror each migration into `supabase/migrations/<timestamp>_<name>.sql` in the repo.
- Existing conventions: NPR formatting `Rs. 41,15,000` via `toLocaleString("en-IN")`; login redirect convention `/login?next=<path>`; user notifications = `public.notifications` + `lib/notifications.ts` + bell in `components/notifications/`; admin notifications separate (`admin_notifications`).
- Branch: work on current branch `feat/admin-notification-pages`. Each task commits **only its own files** (`git add <explicit paths>`); on a git `index.lock` error wait 2s and retry.
- No test framework exists in this repo. Per-task verification = `npx tsc --noEmit` passes + the acceptance checks listed in the task.
- Seller types are `Individual | Dealer` (existing `SellerType` in `lib/types.ts`). Account type lives in Supabase auth `user_metadata.account_type` = `'individual' | 'dealer'`, default `'individual'`.

---

### Task T1 (model: opus): Ownership + booking/rental schema foundation

**Files:**
- Create: `supabase/migrations/20260718T1_vehicle_ownership_and_rentals.sql` (mirror of applied MCP migrations)
- Create: `scripts/create-dealership-user.mjs` (one-off, uses `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` — check `app/api/auth/signup/route.ts` for the exact env var names already in use)

**Interfaces (produced for later tasks):**
- `vehicles.owner_id uuid NULL REFERENCES auth.users(id)` — every existing row assigned to the new dealership user.
- A real auth user `dealership@evnepal.local` (password random, printed once) with `user_metadata: { full_name: "EV Nepal Dealership", account_type: "dealer" }`.
- `test_drive_bookings.vehicle_id uuid NULL REFERENCES public.vehicles(id)` — new-car bookings set `vehicle_id`, used bookings keep `listing_id`.
- Extended trigger: booking INSERT with `vehicle_id` → notification to `vehicles.owner_id` (type `'test_drive'`, title like `New test drive request — <vehicle_label>`). Existing `listing_id` path (`notify_listing_owner_on_booking`) must keep working.
- New table `public.rental_requests` (id uuid pk default gen_random_uuid(), listing_id uuid references used_listings(id) on delete cascade, requester_id uuid references auth.users(id), full_name text not null, phone text not null, start_date date not null, end_date date not null, message text, status text not null default 'pending' check (status in ('pending','approved','declined')), created_at timestamptz default now()). RLS: requester can insert/select own; listing owner can select/update status of requests on their listings.
- Trigger on `rental_requests` INSERT → notification to the listing's `user_id` (type `'rental_request'`).
- RLS on `vehicles`: authenticated INSERT allowed when `owner_id = auth.uid()` AND `(auth.jwt()->'user_metadata'->>'account_type') = 'dealer'`; owner UPDATE/DELETE on own rows. Keep existing public SELECT working.

**Steps:**
- [ ] Inspect current RLS policies (`select * from pg_policies where schemaname='public'`) so new policies don't clash.
- [ ] Apply migration(s) via MCP `apply_migration`; mirror SQL into the repo file.
- [ ] Run the dealership-user script; then `update public.vehicles set owner_id = <that uuid> where owner_id is null;` via `execute_sql`.
- [ ] Verify: SQL asserts — all 37 vehicles have owner_id; inserting a test booking with vehicle_id creates a notification row for the dealership user (then delete the test rows).
- [ ] Commit migration mirror + script.

### Task T2 (model: sonnet): Dealer/Individual choice at signup

**Files:** Modify `app/signup/page.tsx`, `app/api/auth/signup/route.ts` (read it first), optionally `components/auth/AuthUI.tsx` for a shared segmented control.

**Produces:** `user_metadata.account_type: 'individual' | 'dealer'` on every new signup; default `'individual'` when untouched.

- [ ] Add a two-option segmented control ("Individual" pre-selected / "Dealer") styled like the existing AuthUI fields.
- [ ] Pass `accountType` to the signup API; server route stores it in `user_metadata` alongside `full_name` (validate: only accept the two values, fall back to `individual`).
- [ ] `npx tsc --noEmit`; commit.

### Task T3 (model: sonnet): Home page — remove used section, wire animated cards

**Files:** Modify `app/page.tsx`; use existing `app/car-card.module.css` (untracked — do not rewrite it, just import).

- [ ] Remove the entire "Used EV Marketplace" section (`id="used-marketplace"`, the slider state, `getUsedListings` import/usage, the "N Used EVs for sale" badge). Point all "Used car" nav/footer links to `/used` instead of `#used-marketplace`.
- [ ] Re-render the main vehicle grid cards using the `.card / .slide1 / .slide2` classes from `car-card.module.css`: photo (vehicle `image_url`, brand-text fallback) with caption at rest; hover slides up the white detail panel (name, variant, key specs, price, EMI line, Compare + View Details actions). Keep compare buttons functional.
- [ ] `npx tsc --noEmit`; commit (include `app/car-card.module.css` in this commit since it's untracked).

### Task T4 (model: haiku): Fill missing vehicle image URLs

**Scope:** DB-only. 8 of 37 rows in `public.vehicles` have NULL/empty `image_url`.

- [ ] `select id, brand, model, variant from public.vehicles where image_url is null or image_url='';`
- [ ] For each, WebSearch for an official/manufacturer or Wikimedia Commons direct image URL (must end in .jpg/.png/.webp and be a direct image, not an HTML page). Verify each URL with a fetch that it returns an image content-type.
- [ ] `update public.vehicles set image_url = '<url>', images = jsonb_build_array('<url>') where id = '<id>';` per row via `execute_sql`.
- [ ] Verify count of missing is 0. No repo files change; nothing to commit.

### Task T5 (model: sonnet): Dealer "add new car" flow

**Files:** Create `app/dealer/new-car/page.tsx`; modify `lib/vehicles-db.ts` (add `insertVehicle` helper typed on the `vehicles` row shape).

**Consumes:** T1 RLS (dealer INSERT with `owner_id = auth.uid()`), T2 `account_type`.

- [ ] Page guards: not signed in → redirect `/login?next=/dealer/new-car`; signed in but `account_type !== 'dealer'` → friendly "dealer accounts only" notice.
- [ ] Form: brand, model, variant, type, fuel, price, seating, transmission, engine_cc/battery_kwh + range (fuel-dependent), image URL, description, key features (comma-split). Insert with `owner_id = auth.uid()`; slug generated `brand-model-variant` kebab + random suffix on conflict.
- [ ] Success → link to the new `/vehicle/<id>` page. Add a "List a new car" entry point in the site header visible only to dealer accounts.
- [ ] `npx tsc --noEmit`; commit.

### Task T6 (model: sonnet): Rentals as a separate surface

**Files:** Create `app/rentals/page.tsx`, `app/rentals/new/page.tsx`, `components/rentals/RentalRequestModal.tsx`, `lib/rentals.ts`; modify `app/used/page.tsx` (remove the Rent tab → sell-only), `components/used/UsedCard.tsx` (rent CTA opens rental request modal when rendered on /rentals).

**Consumes:** `used_listings.listing_type='rent'` rows, T1 `rental_requests` + trigger.

- [ ] `/rentals`: rent-only listings (per-day price labeling "Rs. X/day"), same card look as /used; `/rentals/new` mirrors /used/new but forces `listing_type='rent'` (label price field "Rate per day").
- [ ] `/used` becomes sell-only (drop the tab UI); cross-link between the two pages ("Looking to rent? →").
- [ ] Rental request modal (name, phone, start/end dates, message) inserts into `rental_requests` (login required via `?next=`); owner gets notified by the T1 trigger.
- [ ] Add "Rentals" to the site nav (SiteHeader + home header if separate).
- [ ] `npx tsc --noEmit`; commit.

### Task T7 (model: sonnet): New-car test-drive bookings notify the owner

**Files:** Modify `components/vehicle/BookTestDriveModal.tsx`, `lib/test-drive.ts`, and the call site in `components/vehicle/VehicleDetail.tsx` (pass `vehicleId`).

**Consumes:** T1 `test_drive_bookings.vehicle_id` + owner trigger.

- [ ] Add optional `vehicleId` prop; insert it with the booking row. Keep the used-listing `listingId` path untouched.
- [ ] Verify end-to-end via SQL: insert path writes `vehicle_id`, trigger creates a notification for the dealership user; clean up test rows.
- [ ] `npx tsc --noEmit`; commit.

### Task T8 (model: opus): User dashboard

**Files:** Create `app/dashboard/page.tsx` (+ `components/dashboard/*` as needed); modify `components/auth/UserMenu.tsx` (replace "Search History" item with "Dashboard" → `/dashboard`).

**Consumes:** all data layers (`lib/used-listings.ts`, `lib/rentals.ts`, `lib/search-history.ts`, `lib/test-drive.ts`, `rental_requests`, `vehicles.owner_id`).

- [ ] Sections: Profile (name, email, account type, joined date); My Listings (new cars owned — dealer only; used; rentals) with sold/edit/delete controls reusing existing self-service logic; Search History (reuse the /history data layer; keep `/history` page alive); My test-drive bookings (made) and requests received (on my listings/vehicles); Rental requests made + received with approve/decline (updates `rental_requests.status`, notifies requester via a notification insert).
- [ ] Guard: signed-out → `/login?next=/dashboard`.
- [ ] `npx tsc --noEmit`; commit.

### Task T9 (model: opus): Admin authority — rentals + feedback notifications

**Files:** Modify `components/admin/ResourceManager.tsx` usage pages, `lib/admin-data.ts`, `app/admin/used-listings/page.tsx`; create `app/admin/rentals/page.tsx` and `app/api/admin/notify-user/route.ts`.

**Consumes:** admin cookie auth (`lib/admin-auth.ts`, `lib/admin-session.ts`), service-role admin data layer.

- [ ] Admin rentals page: list/edit/delete rent-type listings (mirror used-listings admin patterns).
- [ ] "Send feedback" action on any listing (new/used/rental) that inserts into `public.notifications` for the listing's owner (`type: 'admin_feedback'`, admin-composed title/body). New-car vehicles → notify `vehicles.owner_id`.
- [ ] `npx tsc --noEmit`; commit.

### Task T10 (model: opus): Vehicle details page rebuilt to the reference

**Files:** Rewrite `components/vehicle/VehicleDetail.tsx` (split into `components/vehicle/detail/*` subcomponents); modify `app/vehicle/[id]/page.tsx` as needed; use `lib/recommend-engine.ts` or inline similar-price query.

**Reference:** `C:\Users\Dell\Downloads\detailspage.png` — layout order: breadcrumb + `<Brand> <Model> Price in Nepal` title; left gallery with thumbnail strip; right price card (rating, price big, EMI starting line, Book a Test Drive button, quick chips EMI/range/charge); "You might also like" sidebar (4-5 cars in similar price band ±20%, image + name + price); spec chip grid (power, torque, safety, clearance, dimensions, seats, wheelbase, boot, range…); tab bar Overview | Specifications | Features pinned above sections; Overview prose; full Specifications sections (battery/range/charging/motor/dimensions/suspension…) as label-value rows; Features checklist grid grouped by category with check icons; Customer Reviews & Ratings (5-star summary + review cards — static seed data is fine); "Compare with similar cars" two-column comparison cards; FAQs accordion.
- [ ] Preserve: Book a Test Drive wiring (incl. `vehicleId` from T7), `recordView` search-history call, tax-engine price usage.
- [ ] Recommendations = vehicles within ±20% price, same category first, exclude self, cap 5.
- [ ] `npx tsc --noEmit`; commit.

### Task T11 (model: opus): EMI calculator + payment breakdown modals

**Files:** Create `components/vehicle/EmiCalculatorModal.tsx`, `components/vehicle/EmiBreakdownModal.tsx`; wire from the detail price card (replace the old inline widget).

**References:** screenshot2 (calculator): title `EMI Calculator - <name>`; big monthly payment; Down Payment (X%) and Total Interest figures; Select Variant cards (variant name + price, selected = dark outline); Interest Rate stepper (− 8.5 + %); Down Payment slider (20–80%, shows %); Loan Period slider (1–7 years, shows "N Years"); full-width "View Full Payment Breakdown" button → opens breakdown modal. screenshot1 (breakdown): Monthly Payment, Down Payment, Total Interest; "Total Payment for N years"; donut chart (slate=down payment, red=interest, blue=loan amount — pure SVG, no chart lib); Year-wise table: Year | Total Payment | Loan Amount (principal paid that year) | Interest (paid that year) | Balance (remaining principal), computed from standard amortization of the monthly EMI.
- [ ] EMI math: `emi = L·r·(1+r)^n / ((1+r)^n − 1)`, r = rate/1200, n = months. Year rows aggregate 12 months of the amortization schedule; final balance row = Rs. 0.
- [ ] Variants: if the vehicle has no real variant list, derive from the DB `variant` field (single card) — keep the selector UI.
- [ ] `npx tsc --noEmit`; commit.

---

## Execution order

- Wave 0 (orchestrator): checkpoint-commit current WIP.
- Wave 1: T1 (blocking foundation).
- Wave 2 (parallel): T2, T3, T4.
- Wave 3 (parallel): T5, T6, T7.
- Wave 4 (parallel): T8, T9.
- Wave 5 (sequential): T10 → T11.
- Final: typecheck, browser spot-check against the user's dev server if running, wrap-up report.
