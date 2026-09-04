-- ============================================================
-- EMIZA-WOP: Supabase setup for login (run in Supabase SQL Editor)
-- https://supabase.com/dashboard/project/xisxvhmkhadokqwxctkc/sql/new
-- ============================================================

-- 1. USER PROFILES (required for login — single source of truth for role/status)
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null default 'Supervisor'
    check (role in ('Super Admin','Warehouse Manager','Supervisor','Security Officer','Security','RTO Operator','GRN Operator','Auditor')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own profile" on public.user_profiles;
create policy "users insert own profile"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own profile" on public.user_profiles;
create policy "users update own profile"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Super Admin manages other users' profiles (insert/update any)
drop policy if exists "super admin manages all profiles" on public.user_profiles;
create policy "super admin manages all profiles"
  on public.user_profiles for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'Super Admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.role = 'Super Admin'
    )
  );

-- 2. ACTIVE DEVICES (device/session tracking)
create table if not exists public.active_devices (
  id text primary key,
  user_id text,
  user_name text,
  user_role text,
  user_email text,
  warehouse_id text,
  warehouse_name text,
  device_type text,
  browser_info text,
  login_time timestamptz,
  last_active_at timestamptz,
  status text
);

alter table public.active_devices enable row level security;

drop policy if exists "authenticated manage devices" on public.active_devices;
create policy "authenticated manage devices"
  on public.active_devices for all
  to authenticated
  using (true)
  with check (true);

-- 3. PERMISSIONS + ROLE PERMISSIONS (optional — app falls back to built-in defaults)
create table if not exists public.permissions (
  id bigint generated always as identity primary key,
  permission_key text not null unique,
  description text
);

create table if not exists public.role_permissions (
  id bigint generated always as identity primary key,
  role text not null,
  permission_id bigint not null references public.permissions (id) on delete cascade
);

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists "authenticated read permissions" on public.permissions;
create policy "authenticated read permissions"
  on public.permissions for select to authenticated using (true);

drop policy if exists "authenticated read role_permissions" on public.role_permissions;
create policy "authenticated read role_permissions"
  on public.role_permissions for select to authenticated using (true);

-- 4. ACTIVITY LOGS (audit trail)
create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  user_id text,
  user_name text,
  user_role text,
  action text,
  module text,
  details text,
  created_at timestamptz default now()
);

alter table public.activity_logs enable row level security;

drop policy if exists "authenticated write activity" on public.activity_logs;
create policy "authenticated write activity"
  on public.activity_logs for insert to authenticated with check (true);

drop policy if exists "authenticated read activity" on public.activity_logs;
create policy "authenticated read activity"
  on public.activity_logs for select to authenticated using (true);

-- 5. MASTER RECORDS (cloud source of truth for ALL master categories —
--    companies, warehouses, clients, couriers, skus, drivers, vehicle_types,
--    return_reasons, users). One row per record; `data` is the full
--    camelCase record (JSONB) incl. its `_updatedAt` LWW stamp.
create table if not exists public.master_records (
  category text not null,
  rec_id text not null,
  data jsonb,
  updated_at timestamptz default now(),
  primary key (category, rec_id)
);

create index if not exists idx_master_records_category on public.master_records (category);

alter table public.master_records enable row level security;

drop policy if exists "master records select" on public.master_records;
create policy "master records select"
  on public.master_records for select
  to authenticated
  using (true);

drop policy if exists "master records insert" on public.master_records;
create policy "master records insert"
  on public.master_records for insert
  to authenticated
  with check (true);

drop policy if exists "master records update" on public.master_records;
create policy "master records update"
  on public.master_records for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "master records delete" on public.master_records;
create policy "master records delete"
  on public.master_records for delete
  to authenticated
  using (true);

-- Realtime: include master_records in the default publication so
-- postgres_changes (used by masterSync.subscribeMasterChanges) fires.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'master_records'
     ) then
    alter publication supabase_realtime add table public.master_records;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- OPTIONAL: Remove the old internal DEMO accounts from Supabase Auth.
-- Run this block ONCE if you want the demo users (brijesh.verma@emiza.com,
-- vikram.m@emiza.com, etc.) gone. Only verma.brijesh0501@gmail.com is kept.
-- Deleting from auth.users cascades to user_profiles (on delete cascade).
-- It is safe to re-run; it only deletes rows that still match.
-- ---------------------------------------------------------------------------
do $$
declare
  demo_email text;
begin
  foreach demo_email in array array[
    'brijesh.verma@emizainc.com',
    'brijesh.verma@emiza.com',
    'vikram.m@emiza.com',
    'rajesh.security@emiza.com',
    'pooja.d@emiza.com',
    'amit.p@emiza.com',
    'sandeep.y@emiza.com',
    'neha.s@emiza.com'
  ]
  loop
    delete from auth.users where lower(email) = lower(demo_email);
  end loop;
end
$$;

-- Also clear any device / audit / permission rows that pointed at demo users
-- (these tables reference users by email string, not by foreign key).
delete from public.active_devices
 where lower(user_email) in (
   'brijesh.verma@emizainc.com','brijesh.verma@emiza.com','vikram.m@emiza.com',
   'rajesh.security@emiza.com','pooja.d@emiza.com','amit.p@emiza.com',
   'sandeep.y@emiza.com','neha.s@emiza.com');

delete from public.activity_logs
 where user_id in (
   'usr-super','usr-super-emiza','usr-wh-mgr','usr-sec','usr-sup',
   'usr-rto-op','usr-grn-op','usr-auditor');

-- Done! Now:
-- 1. Supabase Dashboard → Authentication → Sign In / Up → turn OFF "Confirm email"
--    (so the Super Admin bootstrap gets a session immediately)
-- 2. Log in from the app as: verma.brijesh0501@gmail.com + any password (6+ chars)
--    The account auto-creates as Super Admin on first login.
