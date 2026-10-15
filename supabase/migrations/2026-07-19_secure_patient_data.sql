-- ============================================================================
-- Migration: secure patient data (2026-07-19)
-- Run this ONCE in the Supabase SQL Editor of the EXISTING project.
-- It is idempotent - running it twice is safe.
--
-- What it fixes:
--   1. The old RLS policies let ANYONE holding the anon key (i.e. every
--      website visitor, since the key ships in the JS bundle) read and
--      update the entire `requests` table - patient names, phones,
--      diseases, symptoms. Reading/updating becomes admin-only.
--   2. The `prescriptions` storage bucket was public, so prescription
--      photos were world-readable. It becomes private; the dashboard
--      switches to short-lived signed URLs.
--   3. Adds an `admins` allow-list table + `is_admin()` helper so that
--      merely having an auth account does NOT grant dashboard access.
--   4. Brings the schema in line with what the app actually inserts
--      (age / city / device / chronic_diseases / symptoms / image_url
--      columns, and the 'medical' request type).
--
-- AFTER RUNNING: register your admin account (see step at the bottom)
-- and disable public sign-ups in Dashboard > Authentication > Sign In/Up.
-- ============================================================================

-- 1. Make sure all columns the app writes actually exist --------------------

alter table public.requests add column if not exists age              int;
alter table public.requests add column if not exists city             text;
alter table public.requests add column if not exists device           text;
alter table public.requests add column if not exists chronic_diseases text;
alter table public.requests add column if not exists symptoms         text;
alter table public.requests add column if not exists image_url        text;

-- Allow the 'medical' type the app sends ('tools' kept for legacy rows).
alter table public.requests drop constraint if exists requests_request_type_check;
alter table public.requests add constraint requests_request_type_check
  check (request_type in ('prescription','convoy','medical','consultation','tools'));

-- `details` was NOT NULL in the original schema but the consultation tab
-- legitimately submits without it.
alter table public.requests alter column details drop not null;

-- 2. Admin allow-list -------------------------------------------------------

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies on purpose: clients can never read or write this table.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 3. Replace the dangerous request policies ---------------------------------

drop policy if exists "Allow public read requests"   on public.requests;
drop policy if exists "Allow public update requests" on public.requests;
drop policy if exists "Allow public insert requests" on public.requests;

-- Anyone may still SUBMIT a request, but only as 'pending' (previously an
-- attacker could insert pre-approved rows).
create policy "requests_public_insert_pending"
  on public.requests for insert
  with check (status = 'pending');

create policy "requests_admin_read"
  on public.requests for select
  using (public.is_admin());

create policy "requests_admin_update"
  on public.requests for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "requests_admin_delete"
  on public.requests for delete
  using (public.is_admin());

-- Committees: reading stays public, writing becomes admin-only.
drop policy if exists "committees_admin_write" on public.committees;
create policy "committees_admin_write"
  on public.committees for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Lock down the prescriptions bucket -------------------------------------

update storage.buckets set public = false where id = 'prescriptions';

drop policy if exists "prescriptions_public_upload" on storage.objects;
create policy "prescriptions_public_upload"
  on storage.objects for insert
  with check (bucket_id = 'prescriptions');

drop policy if exists "prescriptions_admin_read" on storage.objects;
create policy "prescriptions_admin_read"
  on storage.objects for select
  using (bucket_id = 'prescriptions' and public.is_admin());

drop policy if exists "prescriptions_admin_delete" on storage.objects;
create policy "prescriptions_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'prescriptions' and public.is_admin());

-- NOTE: if the dashboard shows "Object not found" for images after this
-- migration, the storage bucket may have had its own public policies created
-- via the Supabase UI - review Dashboard > Storage > prescriptions > Policies
-- and remove any remaining public SELECT policy.

-- 5. Register your admin account --------------------------------------------
-- Replace the email with the real admin account email, then run:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'admin@example.com'
--   on conflict (user_id) do nothing;
--
-- Finally: Dashboard > Authentication > Sign In / Up -> disable new sign-ups,
-- so strangers cannot create auth accounts at all.
