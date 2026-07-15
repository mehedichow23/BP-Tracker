-- BP Tracker schema
-- Phase 1: profiles, readings, RLS, storage bucket.
-- Paste into the Supabase SQL editor and run once. Not applied automatically.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  household_id uuid,
  created_at timestamptz not null default now()
);

create index idx_profiles_household_id on public.profiles (household_id);

-- Auto-create a profile row when a new auth user is created (first magic-link
-- login). display_name and household_id are blank/null until an admin fills
-- them in via the SQL editor -- there are only ever two users, both
-- provisioned by hand, so this just avoids a chicken-and-egg problem where
-- we'd otherwise need the auth.users id before the user has ever logged in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- readings
-- ============================================================
create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  systolic int not null check (systolic between 40 and 300),
  diastolic int not null check (diastolic between 20 and 200),
  pulse int check (pulse between 20 and 250),
  taken_at timestamptz not null,
  notes text,
  image_path text,
  source text not null default 'manual' check (source in ('manual', 'ocr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_readings_user_id on public.readings (user_id);
create index idx_readings_taken_at on public.readings (taken_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger readings_set_updated_at
  before update on public.readings
  for each row execute function public.set_updated_at();

-- ============================================================
-- Household helpers (security definer to avoid RLS recursion)
-- ============================================================

-- The household_id of the currently authenticated user.
create or replace function public.current_household_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from public.profiles where id = auth.uid();
$$;

-- Whether target_user_id belongs to the same household as the current user.
create or replace function public.is_household_member(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.household_id is not null
      and p.household_id = public.current_household_id()
  );
$$;

-- ============================================================
-- RLS: profiles
-- ============================================================
alter table public.profiles enable row level security;

create policy profiles_select_own_or_household
  on public.profiles for select
  using (id = auth.uid() or household_id = public.current_household_id());

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- profiles_update_own only restricts *which row* can be touched (id =
-- auth.uid()), not which columns change. Without this trigger, an
-- authenticated user could call `update profiles set household_id = ...`
-- directly and reassign their own household, since household_id is the
-- source of truth every other RLS policy trusts. Blocked for regular users;
-- auth.uid() is null for service-role calls, so scripts/create-users.mjs can
-- still set household_id during provisioning.
create or replace function public.prevent_household_id_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and new.household_id is distinct from old.household_id then
    raise exception 'household_id cannot be changed directly';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_household_change
  before update on public.profiles
  for each row execute function public.prevent_household_id_change();

-- No insert/delete policies: profiles are created only by the
-- handle_new_user trigger and never removed by the client.

-- ============================================================
-- RLS: readings
-- ============================================================
alter table public.readings enable row level security;

create policy readings_select_household
  on public.readings for select
  using (public.is_household_member(user_id));

create policy readings_insert_own
  on public.readings for insert
  with check (user_id = auth.uid());

create policy readings_update_own
  on public.readings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy readings_delete_own
  on public.readings for delete
  using (user_id = auth.uid());

-- ============================================================
-- Storage: bp-images (private bucket)
-- Convention: object path is "<user_id>/<filename>" so ownership and
-- household membership can be derived from the path prefix.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bp-images',
  'bp-images',
  false,
  15728640, -- 15 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy bp_images_select_household
  on storage.objects for select
  using (
    bucket_id = 'bp-images'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );

create policy bp_images_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'bp-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy bp_images_update_own
  on storage.objects for update
  using (
    bucket_id = 'bp-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'bp-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy bp_images_delete_own
  on storage.objects for delete
  using (
    bucket_id = 'bp-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Manual setup after running this file:
-- 1. Run `npm run seed:users` (see scripts/create-users.mjs) to create the
--    two Auth users and link their profiles into the same household. The
--    handle_new_user trigger above creates the blank profiles row; the
--    script fills in display_name and household_id.
-- 2. In the dashboard: Authentication > Providers > Email, turn off
--    "Allow new users to sign up". This app has exactly two users
--    provisioned by the script above; the sign-up endpoint should stay
--    closed to the public.
-- ============================================================
