-- Extend the sold-vehicle test-drive guard to community used listings, which
-- carry their own `sold` flag (set by the owner from /dashboard or by an admin).
create or replace function public.reject_test_drive_on_sold_vehicle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vehicle_id is not null
     and exists (select 1 from public.vehicles v where v.id = new.vehicle_id and v.sold) then
    raise exception 'This vehicle is sold and no longer available for test drives.';
  end if;

  if new.listing_id is not null
     and exists (select 1 from public.used_listings l where l.id = new.listing_id and l.sold) then
    raise exception 'This listing is sold and no longer available for test drives.';
  end if;

  return new;
end;
$$;
