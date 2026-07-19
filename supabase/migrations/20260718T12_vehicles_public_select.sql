-- Allow anonymous/public read access to the vehicle catalog.
-- RLS is enabled on public.vehicles with dealer-insert / owner-update / owner-delete
-- policies, but no SELECT policy existed, so client reads returned nothing.
-- This lets the site render the catalog straight from the DB while the existing
-- vehicles_dealer_insert / vehicles_owner_update / vehicles_owner_delete policies
-- keep write access locked down.
create policy "vehicles_public_select"
  on public.vehicles
  for select
  using (true);
