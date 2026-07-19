-- Catalog cars can be marked sold. A sold car keeps its detail page (specs,
-- price, reviews stay browsable) but loses the "Book a Test Drive" action —
-- there is nothing left to test drive.
alter table public.vehicles
  add column if not exists sold boolean not null default false;
