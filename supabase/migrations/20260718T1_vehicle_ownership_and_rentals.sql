-- Task T1: Ownership + booking/rental schema foundation
-- Mirror of the MCP migrations applied to project rdnqytmpkqiuafytcjwi on 2026-07-18.
-- Applied as four migrations:
--   t1_add_ownership_columns
--   t1_rental_requests_table
--   t1_booking_and_rental_notification_triggers
--   t1_vehicles_owner_rls

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ownership columns
--    vehicles.owner_id       → the dealer/individual auth user who owns the car
--    test_drive_bookings.vehicle_id → new-car bookings reference a public.vehicles row
--                                     (used bookings keep listing_id)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.vehicles add column owner_id uuid references auth.users(id);
alter table public.test_drive_bookings add column vehicle_id uuid references public.vehicles(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. rental_requests table + RLS
-- ─────────────────────────────────────────────────────────────────────────────
create table public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.used_listings(id) on delete cascade,
  requester_id uuid not null references auth.users(id),
  full_name text not null,
  phone text not null,
  start_date date not null,
  end_date date not null,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  created_at timestamptz not null default now()
);

alter table public.rental_requests enable row level security;

-- Requester can create a request for themselves and read their own requests.
create policy "rental_requests_requester_insert" on public.rental_requests
  for insert to authenticated
  with check (requester_id = auth.uid());

create policy "rental_requests_requester_select" on public.rental_requests
  for select to authenticated
  using (requester_id = auth.uid());

-- Owner of the referenced listing can read and update (approve/decline) requests on their listing.
create policy "rental_requests_owner_select" on public.rental_requests
  for select to authenticated
  using (exists (
    select 1 from public.used_listings ul
    where ul.id = rental_requests.listing_id and ul.user_id = auth.uid()
  ));

create policy "rental_requests_owner_update" on public.rental_requests
  for update to authenticated
  using (exists (
    select 1 from public.used_listings ul
    where ul.id = rental_requests.listing_id and ul.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.used_listings ul
    where ul.id = rental_requests.listing_id and ul.user_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Notification triggers
--    (a) New-car test-drive bookings (vehicle_id set) notify vehicles.owner_id.
--        Sibling to the existing notify_listing_owner_on_booking (used-listing path,
--        untouched) and the admin notify_admins_new_test_drive trigger (untouched).
--    (b) Rental requests notify the referenced used_listings.user_id.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.notify_vehicle_owner_on_booking()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner uuid;
begin
  if new.vehicle_id is null then
    return new;
  end if;

  select owner_id into v_owner
  from public.vehicles
  where id = new.vehicle_id;

  -- Only notify a real owner who isn't the person booking.
  if v_owner is not null and v_owner <> new.booker_id then
    insert into public.notifications (user_id, type, title, body)
    values (
      v_owner,
      'test_drive',
      'New test drive request — ' || coalesce(new.vehicle_label, 'your vehicle'),
      new.full_name || ' booked a test drive for ' || coalesce(new.vehicle_label, 'your vehicle')
        || ' — ' || to_char(new.preferred_date, 'Dy, Mon DD')
        || ', ' || coalesce(new.time_slot, '') || ' · ' || coalesce(new.phone, '')
    );
  end if;

  return new;
end;
$function$;

create trigger trg_notify_vehicle_owner
  after insert on public.test_drive_bookings
  for each row execute function public.notify_vehicle_owner_on_booking();

create or replace function public.notify_owner_on_rental_request()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner uuid;
  v_brand text;
  v_model text;
begin
  select user_id, vehicle_brand, vehicle_model
    into v_owner, v_brand, v_model
  from public.used_listings
  where id = new.listing_id;

  if v_owner is not null and v_owner <> new.requester_id then
    insert into public.notifications (user_id, type, title, body)
    values (
      v_owner,
      'rental_request',
      'New rental request — ' || trim(coalesce(v_brand, '') || ' ' || coalesce(v_model, '')),
      new.full_name || ' wants to rent your '
        || trim(coalesce(v_brand, '') || ' ' || coalesce(v_model, ''))
        || ' — ' || to_char(new.start_date, 'Mon DD') || ' to ' || to_char(new.end_date, 'Mon DD')
        || ' · ' || coalesce(new.phone, '')
    );
  end if;

  return new;
end;
$function$;

create trigger trg_notify_owner_on_rental_request
  after insert on public.rental_requests
  for each row execute function public.notify_owner_on_rental_request();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. vehicles RLS write policies (SELECT behavior unchanged — reads via service role)
-- ─────────────────────────────────────────────────────────────────────────────
create policy "vehicles_dealer_insert" on public.vehicles
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'dealer'
  );

create policy "vehicles_owner_update" on public.vehicles
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "vehicles_owner_delete" on public.vehicles
  for delete to authenticated
  using (owner_id = auth.uid());
