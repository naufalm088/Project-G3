-- =============================================================================
-- Smart Energy Monitor Kos — Skema Awal (MVP)
-- Kelompok G3
-- Jalankan di Supabase SQL Editor, atau: supabase db push
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. PROFILES
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Bu Suwanti',
  role text not null default 'Pemilik Kos',
  phone text,
  created_at timestamptz not null default now()
);

-- Trigger: buat profil otomatis saat user baru mendaftar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Bu Suwanti'),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'Pemilik Kos')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. KOS
-- -----------------------------------------------------------------------------
create table if not exists public.kos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists kos_owner_idx on public.kos (owner_id);

-- -----------------------------------------------------------------------------
-- 3. ROOMS
-- -----------------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  name text not null,
  tenant_name text,
  sort_order integer not null default 0,
  mcb_limit_amp numeric(6, 2) not null default 10,
  relay_on boolean not null default true,
  created_at timestamptz not null default now(),
  unique (kos_id, name)
);

create index if not exists rooms_kos_idx on public.rooms (kos_id);

-- -----------------------------------------------------------------------------
-- 4. DEVICES
-- -----------------------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  name text not null,
  api_key_hash text not null,
  last_seen_at timestamptz,
  is_online boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists devices_kos_idx on public.devices (kos_id);
create index if not exists devices_room_idx on public.devices (room_id);

-- -----------------------------------------------------------------------------
-- 5. READINGS
-- -----------------------------------------------------------------------------
create table if not exists public.readings (
  id bigint generated always as identity primary key,
  kos_id uuid not null references public.kos (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  device_id uuid references public.devices (id) on delete set null,
  ts timestamptz not null default now(),
  voltage numeric(8, 2),
  current numeric(8, 3),
  power_watt numeric(10, 2),
  energy_kwh numeric(12, 5) not null default 0,
  frequency numeric(6, 2),
  power_factor numeric(4, 3),
  created_at timestamptz not null default now()
);

create index if not exists readings_kos_ts_idx on public.readings (kos_id, ts desc);
create index if not exists readings_room_ts_idx on public.readings (room_id, ts desc);

-- -----------------------------------------------------------------------------
-- 6. DAILY SUMMARIES
-- -----------------------------------------------------------------------------
create table if not exists public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete cascade,
  date date not null,
  total_kwh numeric(12, 5) not null default 0,
  total_rupiah numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists daily_summaries_overall_uidx
  on public.daily_summaries (kos_id, date)
  where room_id is null;

create unique index if not exists daily_summaries_room_uidx
  on public.daily_summaries (kos_id, room_id, date)
  where room_id is not null;

create index if not exists daily_summaries_kos_date_idx
  on public.daily_summaries (kos_id, date desc);

-- -----------------------------------------------------------------------------
-- 7. SETTINGS
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null unique references public.kos (id) on delete cascade,
  budget_limit numeric(14, 2) not null default 850000,
  tariff_per_kwh numeric(12, 2) not null default 1444.70,
  notif_active boolean not null default true,
  notif_waspada boolean not null default true,
  notif_bahaya boolean not null default true,
  warn_threshold integer not null default 75,
  danger_threshold integer not null default 95,
  notif_wa boolean not null default true,
  notif_push boolean not null default true,
  wa_number text,
  updated_at timestamptz not null default now(),
  constraint settings_threshold_check check (
    warn_threshold between 1 and 99
    and danger_threshold between 2 and 100
    and danger_threshold > warn_threshold
  )
);

-- -----------------------------------------------------------------------------
-- 8. NOTIFICATIONS
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  type text not null,
  severity text not null default 'info',
  message text not null,
  is_read boolean not null default false,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (kos_id, dedupe_key)
);

create index if not exists notifications_kos_created_idx
  on public.notifications (kos_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 9. HELPER: cek kepemilikan kos (dipakai RLS)
-- -----------------------------------------------------------------------------
create or replace function public.is_kos_owner(target_kos_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kos
    where id = target_kos_id and owner_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- 10. PROVISIONING: buat kos + settings + 4 kamar default untuk owner baru
-- -----------------------------------------------------------------------------
create or replace function public.provision_owner(p_kos_name text default 'Kos Saya')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_kos uuid;
begin
  if v_owner is null then
    raise exception 'Pengguna belum terautentikasi';
  end if;

  select id into v_kos from public.kos
  where owner_id = v_owner
  order by created_at asc
  limit 1;

  if v_kos is null then
    insert into public.kos (owner_id, name)
    values (v_owner, coalesce(nullif(trim(p_kos_name), ''), 'Kos Saya'))
    returning id into v_kos;
  end if;

  insert into public.settings (kos_id) values (v_kos)
  on conflict (kos_id) do nothing;

  insert into public.rooms (kos_id, name, tenant_name, sort_order)
  values
    (v_kos, 'Kamar 1', 'Penghuni 1', 1),
    (v_kos, 'Kamar 2', 'Penghuni 2', 2),
    (v_kos, 'Kamar 3', 'Penghuni 3', 3),
    (v_kos, 'Kamar 4', 'Penghuni 4', 4)
  on conflict (kos_id, name) do nothing;

  return v_kos;
end;
$$;

-- -----------------------------------------------------------------------------
-- 11. INGEST: simpan reading + akumulasi daily summary (atomik)
-- -----------------------------------------------------------------------------
create or replace function public.record_reading(
  p_kos_id uuid,
  p_room_id uuid,
  p_device_id uuid,
  p_ts timestamptz,
  p_voltage numeric,
  p_current numeric,
  p_power_watt numeric,
  p_energy_kwh numeric,
  p_frequency numeric,
  p_power_factor numeric,
  p_tariff numeric
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (coalesce(p_ts, now()))::date;
  v_energy numeric := greatest(coalesce(p_energy_kwh, 0), 0);
  v_tariff numeric := coalesce(nullif(p_tariff, 0), 1444.70);
  v_reading_id bigint;
begin
  insert into public.readings (
    kos_id, room_id, device_id, ts, voltage, current,
    power_watt, energy_kwh, frequency, power_factor
  )
  values (
    p_kos_id, p_room_id, p_device_id, coalesce(p_ts, now()), p_voltage, p_current,
    p_power_watt, v_energy, p_frequency, p_power_factor
  )
  returning id into v_reading_id;

  insert into public.daily_summaries (kos_id, room_id, date, total_kwh, total_rupiah)
  values (p_kos_id, null, v_day, v_energy, v_energy * v_tariff)
  on conflict (kos_id, date) where room_id is null
  do update set
    total_kwh = public.daily_summaries.total_kwh + excluded.total_kwh,
    total_rupiah = public.daily_summaries.total_rupiah + excluded.total_rupiah,
    updated_at = now();

  if p_room_id is not null then
    insert into public.daily_summaries (kos_id, room_id, date, total_kwh, total_rupiah)
    values (p_kos_id, p_room_id, v_day, v_energy, v_energy * v_tariff)
    on conflict (kos_id, room_id, date) where room_id is not null
    do update set
      total_kwh = public.daily_summaries.total_kwh + excluded.total_kwh,
      total_rupiah = public.daily_summaries.total_rupiah + excluded.total_rupiah,
      updated_at = now();
  end if;

  update public.devices
  set last_seen_at = now(), is_online = true
  where id = p_device_id;

  return v_reading_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.kos enable row level security;
alter table public.rooms enable row level security;
alter table public.devices enable row level security;
alter table public.readings enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- kos
drop policy if exists "kos_owner_all" on public.kos;
create policy "kos_owner_all" on public.kos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- rooms
drop policy if exists "rooms_owner_all" on public.rooms;
create policy "rooms_owner_all" on public.rooms
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

-- devices
drop policy if exists "devices_owner_all" on public.devices;
create policy "devices_owner_all" on public.devices
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

-- readings
drop policy if exists "readings_owner_select" on public.readings;
create policy "readings_owner_select" on public.readings
  for select using (public.is_kos_owner(kos_id));

-- daily_summaries
drop policy if exists "daily_summaries_owner_select" on public.daily_summaries;
create policy "daily_summaries_owner_select" on public.daily_summaries
  for select using (public.is_kos_owner(kos_id));

-- settings
drop policy if exists "settings_owner_all" on public.settings;
create policy "settings_owner_all" on public.settings
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

-- notifications
drop policy if exists "notifications_owner_all" on public.notifications;
create policy "notifications_owner_all" on public.notifications
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

-- -----------------------------------------------------------------------------
-- 13. HAK AKSES
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on function public.is_kos_owner(uuid) to authenticated;
grant execute on function public.provision_owner(text) to authenticated;
grant execute on function public.record_reading(
  uuid, uuid, uuid, timestamptz, numeric, numeric, numeric, numeric, numeric, numeric, numeric
) to service_role;
