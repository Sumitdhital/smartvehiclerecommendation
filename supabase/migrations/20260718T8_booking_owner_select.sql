-- Task T8: user dashboard support
-- Mirror of the MCP migration applied to project rdnqytmpkqiuafytcjwi on 2026-07-18.
-- Applied as: t8_booking_owner_select_and_rental_decision
--
-- Lets listing/vehicle owners read the test-drive bookings placed against their
-- inventory (the base "read own test drives" policy only covers the booker), and
-- notifies a rental requester when the listing owner approves/declines a request.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. test_drive_bookings owner SELECT policies (additive to "read own test drives")
--    Owners of a used listing (via used_listings.user_id) or a catalog vehicle
--    (via vehicles.owner_id) can read bookings that reference their inventory.
-- ─────────────────────────────────────────────────────────────────────────────
create policy "bookings_listing_owner_select" on public.test_drive_bookings
  for select to authenticated
  using (
    listing_id is not null and exists (
      select 1 from public.used_listings ul
      where ul.id = test_drive_bookings.listing_id and ul.user_id = auth.uid()
    )
  );

create policy "bookings_vehicle_owner_select" on public.test_drive_bookings
  for select to authenticated
  using (
    vehicle_id is not null and exists (
      select 1 from public.vehicles v
      where v.id = test_drive_bookings.vehicle_id and v.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Notify the requester when a rental request is approved / declined.
--    Mirrors the SECURITY DEFINER style of notify_owner_on_rental_request.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.notify_requester_on_rental_decision()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner uuid;
  v_brand text;
  v_model text;
  v_label text;
begin
  -- Only fire on a real transition into a decided state.
  if new.status = old.status then
    return new;
  end if;
  if new.status not in ('approved','declined') then
    return new;
  end if;

  select user_id, vehicle_brand, vehicle_model
    into v_owner, v_brand, v_model
  from public.used_listings
  where id = new.listing_id;

  -- Don't self-notify a requester who is also the listing owner.
  if v_owner is not null and v_owner = new.requester_id then
    return new;
  end if;

  v_label := nullif(trim(coalesce(v_brand, '') || ' ' || coalesce(v_model, '')), '');

  insert into public.notifications (user_id, type, title, body)
  values (
    new.requester_id,
    'rental_request',
    case when new.status = 'approved'
      then 'Your rental request was approved'
      else 'Your rental request was declined' end,
    case when new.status = 'approved'
      then 'Your request to rent the ' || coalesce(v_label, 'vehicle')
        || ' was approved — the owner will reach out to arrange handover.'
      else 'Your request to rent the ' || coalesce(v_label, 'vehicle')
        || ' was declined.' end
  );

  return new;
end;
$function$;

create trigger trg_notify_requester_on_rental_decision
  after update of status on public.rental_requests
  for each row execute function public.notify_requester_on_rental_decision();
