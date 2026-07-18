# Admin Notification Pages — Design

**Date:** 2026-07-18
**Status:** Approved (pending spec review)

## Goal

In the admin panel, notifications currently live only in a small dropdown under
the sidebar bell. Make each notification openable as its own page, and add a
full notifications list page reachable from the bell.

## Current State

- `components/admin/AdminNotificationBell.tsx` — client bell. Polls
  `GET /api/admin/notifications` (latest 12 + unread count) every 60s. Opening
  the dropdown calls `POST /api/admin/notifications`, which marks **all** unread
  as read, then renders the shared `NotificationList`.
- `components/notifications/notifications-shared.tsx` — shared UI
  (`NotificationList`, `BellIcon`, `UnreadBadge`, `timeAgo`). Used by **both**
  the user bell and the admin bell, so changes must stay backward compatible.
- `app/api/admin/notifications/route.ts` — `GET` (list, limit 12 + unread count)
  and `POST` (mark all read). Uses `requireAdmin()` + service-role Supabase
  against the RLS-locked `admin_notifications` table.
- `components/admin/AdminChrome.tsx` — sidebar shell with the `NAV` array and the
  bell.
- Existing admin pages (`app/admin/*/page.tsx`) are **client components** that
  fetch from cookie-authed `/api/admin/*` routes. `/admin` routes are protected
  by `middleware.ts`.

## Changes

### 1. Per-notification API route

New file `app/api/admin/notifications/[id]/route.ts`:

- `GET` — `requireAdmin()`; select one row by `id`
  (`id, type, title, body, read, created_at`). Return the mapped notification
  (`createdAt` casing to match the list route) or `404` when not found.
- `POST` — `requireAdmin()`; `update({ read: true })` where `id = params.id`.
  Returns `{ ok: true }`. Marks only that single notification read.

Both use `getSupabaseAdmin()` and mirror the auth/error handling of the existing
list route.

### 2. List API route change

`app/api/admin/notifications/route.ts` `GET`:

- Read `all` from the query string. When `all=1`, use `.limit(100)` instead of
  `.limit(12)`. Default (bell) behavior is unchanged. Unread-count logic is
  untouched.

### 3. Full list page

New file `app/admin/notifications/page.tsx` (client component, matching existing
admin pages):

- On mount, `GET /api/admin/notifications?all=1`.
- Render a heading + each notification as a row linking to
  `/admin/notifications/{id}`. Unread rows get the same blue accent used in the
  dropdown. Show `title`, `body`, `timeAgo(createdAt)`.
- Loading skeleton and empty state consistent with the dashboard's
  "Recently viewed" section.

### 4. Detail page

New file `app/admin/notifications/[id]/page.tsx` (client component):

- Read `id` from route params. `GET /api/admin/notifications/{id}`.
- On successful load, fire `POST /api/admin/notifications/{id}` to mark it read
  (best-effort; UI does not block on it).
- Render `title`, `type`, `timeAgo(createdAt)`, and `body`. Include a
  "← Back to notifications" link to `/admin/notifications`.
- Handle not-found (404) with a simple "Notification not found" state + back link.

### 5. Bell + shared list wiring

`components/notifications/notifications-shared.tsx`:

- Add an optional prop `hrefFor?: (item: NotificationItem) => string` to
  `NotificationList`. When provided, each `<li>`'s content is wrapped in a
  `next/link` `Link` to `hrefFor(item)`; when omitted, rendering is exactly as
  today (user bell unaffected).

`components/admin/AdminNotificationBell.tsx`:

- Pass `hrefFor={(n) => \`/admin/notifications/${n.id}\`}` to `NotificationList`.
- Close the dropdown (`setOpen(false)`) when a link is clicked (via an `onClick`
  passed alongside, or by listening to navigation) so the popup doesn't linger.
- Add a "View all →" link at the bottom of the dropdown to
  `/admin/notifications`, which also closes the dropdown.

`components/admin/AdminChrome.tsx`:

- Add `{ href: "/admin/notifications", label: "Notifications" }` to the `NAV`
  array so the list page is reachable from the sidebar too.

## Data Flow

```
Bell dropdown item ──Link──► /admin/notifications/[id]
                                   │ GET  /api/admin/notifications/[id]  → detail
                                   │ POST /api/admin/notifications/[id]  → mark read
Bell "View all"    ──Link──► /admin/notifications
                                   │ GET  /api/admin/notifications?all=1 → list
                                   └ rows ──Link──► /admin/notifications/[id]
```

## Behavior Notes

- Opening the dropdown still marks all unread read (unchanged). Detail pages also
  mark their own notification read — harmless overlap that keeps direct links
  (e.g. from the list page) correct.
- The shared `NotificationList` change is purely additive; the user bell passes
  no `hrefFor` and behaves exactly as before.

## Out of Scope

- No changes to how admin notifications are created (DB triggers / `type`s).
- No pagination beyond the `all=1` cap of 100.
- No changes to the user-facing (non-admin) notification bell behavior.

## Testing

- Manual verification (per repo convention): sign in as admin, open the bell,
  click an item → lands on detail page, item shows read. Click "View all" →
  list page shows all notifications; a row link opens the same detail page.
  Confirm the user bell dropdown is visually and behaviorally unchanged.
