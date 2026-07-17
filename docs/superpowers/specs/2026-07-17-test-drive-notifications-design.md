# Test-Drive Booking + Owner Notifications — Design

**Date:** 2026-07-17
**Status:** Approved (Approach A — notifications table + DB trigger)

## Goal

Clicking **Book a Test Drive** opens a form. When the booked car is a community
used listing, the user who listed it gets a notification, surfaced in the
avatar menu (badge on the avatar, list in the dropdown).

## Scope

- **Catalog vehicle page** (`components/vehicle/VehicleDetail.tsx`): the existing
  button opens the form. Booking is saved with `listing_id = null` — no
  notification (catalog cars have no lister; rows remain queryable for a future
  admin view).
- **Used listing cards** (`components/used/UsedCard.tsx`): new "Book Test Drive"
  button opens the same form. Community listings (`source: "community"`, uuid id)
  pass `listing_id`; the DB trigger notifies the listing owner. Seed cards
  (`seed-*` ids, no owner) behave like catalog bookings (`listing_id = null`).
- **Avatar menu** (`components/auth/UserMenu.tsx`): unread-count badge on the
  avatar circle; "Notifications" section in the dropdown; marked read when the
  dropdown opens.
- Booking requires sign-in; signed-out users are redirected to
  `/login?next=<current page>` (existing convention).

## Data model (Supabase migration)

```sql
create table public.test_drive_bookings (
  id             uuid primary key default gen_random_uuid(),
  booker_id      uuid not null references auth.users(id) on delete cascade,
  listing_id     uuid references public.used_listings(id) on delete cascade,
  vehicle_label  text not null,          -- e.g. "Kia Sonet 1.5 HTX AT" / "2018 Nissan Leaf"
  full_name      text not null,
  phone          text not null,
  preferred_date date not null,
  time_slot      text not null,          -- "Morning (9–12)" | "Afternoon (12–4)" | "Evening (4–7)"
  message        text,
  created_at     timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null default 'test_drive',
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
```

**RLS**

- `test_drive_bookings`: INSERT where `booker_id = auth.uid()`; SELECT where
  `booker_id = auth.uid()`. No client UPDATE/DELETE.
- `notifications`: SELECT and UPDATE where `user_id = auth.uid()` (update is
  for marking read). **No INSERT policy** — rows are created only by the
  trigger below, so clients cannot forge notifications for other users.

**Trigger** (`security definer` function, `after insert on test_drive_bookings`):
if `new.listing_id` is not null, look up `used_listings.user_id`; when an owner
exists and is not the booker, insert a notification:
title `"New test drive request"`, body
`"<full_name> booked a test drive for your <vehicle_label> — <date>, <slot> · <phone>"`.

Add `notifications` to the `supabase_realtime` publication so the badge can
update live.

## Components & data flow

- **`components/vehicle/BookTestDriveModal.tsx`** (new, client): modal form —
  full name (prefilled from account), phone, preferred date (min = today),
  time-slot select, optional message. Props:
  `{ open, onClose, vehicleLabel, listingId? }`. On submit: if no session →
  `router.push('/login?next=…')`; else insert into `test_drive_bookings`,
  show success state, close. Validation: name, phone (7+ digits), date, slot
  required; inline error text on failure.
- **`lib/notifications.ts`** (new): `fetchNotifications(limit)`,
  `markAllRead()`, `subscribeToNotifications(userId, cb)` (realtime channel on
  INSERT for the signed-in user, unsubscribed on cleanup).
- **`UserMenu.tsx`**: on session load, fetch notifications + subscribe; red
  count badge on the avatar when `unread > 0`; dropdown gains a Notifications
  section (latest 8, unread rows highlighted, relative timestamps); opening the
  dropdown calls `markAllRead()`.
- **`VehicleDetail.tsx`**: existing button opens the modal with
  `vehicleLabel = "<brand> <model> <variant>"`, no `listingId`.
- **`UsedCard.tsx`**: adds a "Book Test Drive" button; passes `listingId` only
  for community rows.

## Error handling

- Insert failures surface inline in the modal (message from Supabase error).
- Notification fetch/subscribe failures degrade silently — menu still works.
- Trigger failures cannot be triggered by clients directly; owner lookup is
  null-safe (no owner → no notification, booking still succeeds).

## Testing

- Typecheck (`npx tsc --noEmit`).
- Manual flow: book from catalog page (no notification), book a community
  listing from a second account → owner sees badge + notification; marked read
  on open; signed-out click redirects to login and back.
