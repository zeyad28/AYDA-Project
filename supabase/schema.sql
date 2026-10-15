-- ============================================================================
-- AYDA - Full database schema (fresh install)
-- Run this in the Supabase SQL Editor when setting up a NEW project.
-- For an EXISTING database, run migrations/2026-07-19_secure_patient_data.sql
-- instead.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Committees shown on the public landing page.
create table if not exists public.committees (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,   -- e.g. Marketing, PR, HR, PH, OC, PE
  name        text not null,
  description text,
  head_name   text,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- Medical help requests submitted from the public form.
-- Contains sensitive patient data: names, phones, diseases, symptoms.
create table if not exists public.requests (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  phone            text not null,
  request_type     text not null
                   check (request_type in ('prescription','convoy','medical','consultation','tools')),
                   -- 'tools' is kept only for legacy rows created before the
                   -- type was renamed to 'medical'; the app no longer sends it.
  age              int,
  city             text,
  device           text,
  chronic_diseases text,
  symptoms         text,
  details          text,
  image_url        text,              -- storage path inside the 'prescriptions' bucket
  status           text not null default 'pending'
                   check (status in ('pending','approved','rejected')),
  created_at       timestamptz not null default now()
);

-- Users allowed to access the admin dashboard. Membership in this table is
-- what RLS checks; creating an auth user alone grants NO admin access.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Admin check helper
-- ----------------------------------------------------------------------------

-- SECURITY DEFINER so it can read public.admins even though that table has
-- RLS enabled with no policies (i.e. it is invisible to clients).
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

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.committees enable row level security;
alter table public.requests   enable row level security;
alter table public.admins     enable row level security;
-- admins: RLS on, no policies -> clients can never read or write it directly.

-- committees: anyone may read, only admins may modify.
create policy "committees_public_read"
  on public.committees for select
  using (true);

create policy "committees_admin_write"
  on public.committees for all
  using (public.is_admin())
  with check (public.is_admin());

-- requests: anyone may submit a NEW pending request; only admins may read,
-- update, or delete. This is what keeps patient data private - the anon key
-- ships in the browser bundle and must never be able to read this table.
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

-- ----------------------------------------------------------------------------
-- Storage
-- ----------------------------------------------------------------------------

-- 'prescriptions' holds patient prescription photos -> PRIVATE.
-- The dashboard reads them through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false)
on conflict (id) do update set public = false;

-- 'images' holds public site assets (logo, hero photo, committee images).
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- Anyone may upload a prescription image (the request form is public)...
create policy "prescriptions_public_upload"
  on storage.objects for insert
  with check (bucket_id = 'prescriptions');

-- ...but only admins may read them back (this also gates signed-URL creation).
create policy "prescriptions_admin_read"
  on storage.objects for select
  using (bucket_id = 'prescriptions' and public.is_admin());

create policy "prescriptions_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'prescriptions' and public.is_admin());

-- Public site assets stay world-readable; only admins may change them.
create policy "images_public_read"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "images_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'images' and public.is_admin());

-- ----------------------------------------------------------------------------
-- Seed data
-- ----------------------------------------------------------------------------

insert into public.committees (code, name, description) values
  ('Marketing', 'التسويق',        'لجنة التسويق والإعلان'),
  ('PR',        'العلاقات العامة', 'لجنة العلاقات العامة'),
  ('HR',        'الموارد البشرية', 'لجنة الموارد البشرية'),
  ('PH',        'الصيدلة',        'اللجنة الصيدلية'),
  ('OC',        'التنظيم',        'اللجنة التنظيمية'),
  ('PE',        'الفعاليات العامة', 'لجنة الفعاليات')
on conflict (code) do nothing;
