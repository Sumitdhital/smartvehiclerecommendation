-- Hiding the button client-side is cosmetic; RLS lets any signed-in user insert
-- a booking. Reject bookings against a sold catalog car at the database.
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
  return new;
end;
$$;

drop trigger if exists trg_reject_test_drive_on_sold_vehicle on public.test_drive_bookings;
create trigger trg_reject_test_drive_on_sold_vehicle
  before insert on public.test_drive_bookings
  for each row execute function public.reject_test_drive_on_sold_vehicle();
