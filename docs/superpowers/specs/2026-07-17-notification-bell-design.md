# Notification Bell — Design

**Date:** 2026-07-17
**Status:** Approved, ready for implementation plan

## Goal

Surface owner notifications as a dedicated bell 🔔 button in the header, placed
next to the "+ List your car" button, instead of burying them inside the avatar
menu. The bell shows the unread badge and opens its own notifications dropdown.

## Background

Today all notification behavior lives inside `components/auth/UserMenu.tsx`:
it fetches notifications, opens a realtime subscription, tracks `unreadCount`,
renders the red unread badge on the avatar, lists notifications inside the
avatar dropdown, and calls `markAllRead()` when the dropdown opens.

Notifications are created server-side by a Postgres trigger when someone books a
test drive on the user's listing (see the test-drive-notifications spec). The
data layer is `lib/notifications.ts`: `fetchNotifications`, `markAllRead`,
`subscribeToNotifications`. That data layer is unchanged by this work.

Two headers render the account UI, both via `UserMenu`:
- `components/SiteHeader.tsx` — sub-pages; this header also has the
  "+ List your car" button.
- Inline `<header>` in `app/page.tsx` — the homepage.

## Key constraint: one source of truth

A separate bell that independently fetches and subscribes would diverge from the
avatar: opening the bell marks everything read in the DB, but a second component
holding its own copy of the state would keep showing a stale badge until a page
refresh. It would also open a second realtime channel with the same
`notifications:${userId}` name.

Therefore the bell and any other notification-aware UI must share **one**
notification state. We lift the state out of `UserMenu` into a shared context.

## Architecture

Three pieces.

### 1. `components/notifications/NotificationsProvider.tsx` (new)

A React context provider that owns notification state, extracted from the
current `UserMenu` logic:

- State: `notifications: AppNotification[]`, derived `unreadCount`.
- On the signed-in user changing (via `supabase.auth`), it fetches notifications
  and opens the single realtime subscription (`subscribeToNotifications`),
  prepending new inserts and capping at 8 — exactly the current `UserMenu`
  behavior. Clears state on sign-out.
- Exposes `markAllRead()` that updates the DB (`markAllRead` from
  `lib/notifications.ts`) **and** flips local state to read in one call, so every
  consumer stays in sync.
- Exposes the context via a `useNotifications()` hook.

Wrapped once around the app in `app/layout.tsx` so every header shares the same
instance (single fetch, single subscription).

### 2. `components/notifications/NotificationBell.tsx` (new)

A standalone bell button:

- Renders `null` when there is no signed-in user (matches how notifications are
  already gated).
- Bell icon with the red unread badge (`9+` cap), reusing the existing badge
  styling from `UserMenu`.
- Click toggles a dropdown that lists notifications using the same list markup
  currently in `UserMenu` (relative `timeAgo`, unread dot, empty state
  "You're all caught up."). Opening the dropdown calls `markAllRead()`.
- Closes on outside-click and Escape, mirroring the existing menu behavior.
- Consumes `useNotifications()` — holds no notification state of its own.

### 3. `components/auth/UserMenu.tsx` (refactor)

- Remove all notification state, effects, badge, and the Notifications section
  from the dropdown. `UserMenu` no longer imports from `lib/notifications`.
- The avatar dropdown becomes account-only: **Search History** and **Log out**.
- The avatar button loses its red badge (the badge now lives on the bell).
- Keeps its own auth/session tracking for identity (name, initials, email) and
  the sign-in fallback.

## Placement

The bell is inserted immediately to the **left** of the "+ List your car" button,
before `UserMenu`, in both headers:

- `SiteHeader.tsx`: `🔔 [ + List your car ] (avatar▼)`
- `app/page.tsx` inline header: `🔔 (avatar▼)` (homepage has no "List your car"
  button in the top bar; the bell sits just left of the avatar).

## Data flow

```
Postgres trigger → notifications table (RLS: own rows)
        │ realtime INSERT
        ▼
NotificationsProvider  ──useNotifications()──▶ NotificationBell (badge + list + markAllRead)
   (single fetch +                          
    single subscription)                    UserMenu reads NOTHING about notifications
```

## Error handling

- `fetchNotifications` already returns `[]` on error; the provider surfaces an
  empty list, no crash.
- `markAllRead` is best-effort; a DB failure still flips local state so the UI
  doesn't get stuck showing a badge (same as today's optimistic behavior).
- Bell renders `null` when logged out, so no notification calls happen for
  anonymous users.

## Testing / verification

- Signed out: no bell in either header; avatar shows "Sign In".
- Signed in with unread notifications: bell shows the red count in both headers;
  avatar shows no badge.
- Open the bell: list renders, badge clears, and it stays cleared (single source
  of truth — no stale badge on navigation).
- Book a test drive on your own listing in another tab: a new notification
  arrives live via realtime and the bell badge increments.
- Avatar menu shows only Search History and Log out.

## Part 2 — Admin notification bar

The admin panel (`/admin`) uses a **separate** auth system: a custom cookie via
`getAdminSession` (see `lib/admin-auth.ts`), not Supabase auth. Admins have no
Supabase `user_id`, so the user bell above cannot be reused — admins need their
own data source and their own read path (cookie-authed API route, not RLS).

### Data source: `admin_notifications` table (new)

A new table plus Postgres triggers, independent of the per-user `notifications`
table.

```
admin_notifications (
  id          uuid pk default gen_random_uuid(),
  type        text not null,      -- 'used_listing' | 'test_drive'
  title       text not null,
  body        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
)
```

- RLS: enabled, with **no** public policies — the table is unreachable by the
  anon/authenticated clients. Only the service role (used by the admin API
  routes) reads/writes it. Triggers run as definer so inserts succeed regardless.
- Triggers (events chosen):
  - **New used listing** — `AFTER INSERT ON used_listings` inserts a row
    (`type='used_listing'`, title like "New listing: <make> <model>").
  - **New test-drive booking** — `AFTER INSERT ON test_drive_bookings` inserts a
    row (`type='test_drive'`). This is in addition to the existing per-owner
    notification the booking already fires.
- New-user-signup notifications are out of scope for now (would require a trigger
  on `auth.users`); easy to add later as another trigger + type.

### Read path: `/api/admin/notifications` (new route)

Cookie-authed like the other `/api/admin/*` routes:

- `GET` — verifies `getAdminSession()`; returns the latest N admin notifications
  and the unread count. Uses the service-role Supabase client already used by
  admin data routes (see `lib/admin-data.ts` / existing admin API routes).
- `POST` (mark read) — verifies session, sets `read = true` on all unread rows.
- 401 when there's no admin session.

No realtime for admins (the anon realtime channel is RLS-gated and admins aren't
Supabase users). The bar fetches on mount and re-fetches when opened; a light
poll (e.g. every 60s) keeps the badge fresh. Polling interval is a detail for the
plan.

### UI: admin bell in `AdminChrome`

A bell/notification control in the admin sidebar, next to the **"Signed in as
{adminName}"** block. Own dropdown listing recent admin notifications with the
same visual language as the user bell (unread dot, `timeAgo`, empty state),
badge with unread count. Opening marks all read via the POST route. This is a
distinct component from `NotificationBell` because the data path differs (fetch
API + poll, no context/realtime), though it can share small presentational
helpers (`timeAgo`, badge, list row) factored into a shared module.

### Admin data flow

```
used_listings INSERT ─┐
                      ├─trigger─▶ admin_notifications (service-role only)
test_drive_bookings ──┘                    │
                                           ▼
   AdminChrome bell ◀── GET /api/admin/notifications (cookie auth + poll)
                    ──▶ POST /api/admin/notifications (mark read)
```

## Out of scope

- No change to the existing per-user `notifications` data layer, schema, or
  trigger (the admin table is separate and additive).
- No new-user-signup admin notification (future add).
- No standalone `/notifications` page (dropdowns are sufficient).
- No realtime for the admin bar (poll-based).
