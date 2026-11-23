-- =============================================================================
-- Smart Kos Monitor — Skema Monitoring Kos (MVP v2)
-- Kelompok G3
-- Jalankan SETELAH 20260101000000_init.sql (atau jalankan file ini saja di DB baru:
-- fungsi is_kos_owner dibuat ulang di bawah agar idempotent).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 0. HELPER: cek kepemilikan kos (idempotent)
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
-- 1. KOS (sudah ada dari migrasi v1, tapi pastikan kolom cctv_url ada)
-- -----------------------------------------------------------------------------
alter table public.kos
  add column if not exists cctv_url text;

-- -----------------------------------------------------------------------------
-- 2. ROOMS — kamar kos
-- -----------------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  room_number text not null,
  name text not null,
  floor integer not null default 1,
  monthly_rent numeric(14, 2) not null default 500000,
  status text not null default 'vacant' check (status in ('occupied','vacant','maintenance')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kos_id, room_number)
);

create index if not exists rooms_kos_idx on public.rooms (kos_id);

-- -----------------------------------------------------------------------------
-- 3. TENANTS — penghuni kamar (1 aktif per kamar)
-- -----------------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  full_name text not null,
  phone text,
  move_in_date date,
  monthly_rent numeric(14, 2),
  due_day integer not null default 5 check (due_day between 1 and 28),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists tenants_kos_idx on public.tenants (kos_id);
create index if not exists tenants_room_idx on public.tenants (room_id);

-- -----------------------------------------------------------------------------
-- 4. PAYMENTS — tagihan bulanan per kamar
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  period text not null,                       -- "YYYY-MM"
  amount numeric(14, 2) not null,
  due_date date not null,
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending','paid','overdue')),
  method text,
  notes text,
  created_at timestamptz not null default now(),
  unique (room_id, period)
);

create index if not exists payments_kos_period_idx on public.payments (kos_id, period desc);
create index if not exists payments_room_idx on public.payments (room_id);

-- -----------------------------------------------------------------------------
-- 5. SETTINGS — pengaturan kos
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null unique references public.kos (id) on delete cascade,
  rent_due_day integer not null default 5 check (rent_due_day between 1 and 28),
  default_rent numeric(14, 2) not null default 500000,
  notif_active boolean not null default true,
  notif_reminder boolean not null default true,
  notif_overdue boolean not null default true,
  owner_phone text,
  cctv_url text,
  ui_mode text not null default 'classic' check (ui_mode in ('classic','modern')),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 6. NOTIFICATIONS — notifikasi in-app
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  kos_id uuid not null references public.kos (id) on delete cascade,
  type text not null,
  severity text not null default 'info',
  message text not null,
  dedupe_key text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (kos_id, dedupe_key)
);

create index if not exists notifications_kos_created_idx
  on public.notifications (kos_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 7. RLS
-- -----------------------------------------------------------------------------
alter table public.rooms enable row level security;
alter table public.tenants enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "rooms_owner_all" on public.rooms;
create policy "rooms_owner_all" on public.rooms
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

drop policy if exists "tenants_owner_all" on public.tenants;
create policy "tenants_owner_all" on public.tenants
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

drop policy if exists "payments_owner_all" on public.payments;
create policy "payments_owner_all" on public.payments
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

drop policy if exists "settings_owner_all" on public.settings;
create policy "settings_owner_all" on public.settings
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

drop policy if exists "notifications_owner_all" on public.notifications;
create policy "notifications_owner_all" on public.notifications
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

-- kos & profiles RLS sudah ada dari migrasi v1 (jika dijalankan). Pastikan kos policy ada:
alter table public.kos enable row level security;
drop policy if exists "kos_owner_all" on public.kos;
create policy "kos_owner_all" on public.kos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8. PROVISIONING: kos + settings + 6 kamar + gudang untuk owner baru
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

  insert into public.rooms (kos_id, room_number, name, floor, monthly_rent, status, sort_order)
  values
    (v_kos, '1', 'Kamar 1', 1, 550000, 'vacant', 1),
    (v_kos, '2', 'Kamar 2', 1, 550000, 'vacant', 2),
    (v_kos, '3', 'Kamar 3', 1, 500000, 'vacant', 3),
    (v_kos, '4', 'Kamar 4', 2, 600000, 'vacant', 4),
    (v_kos, '5', 'Kamar 5', 2, 450000, 'vacant', 5),
    (v_kos, '6', 'Kamar 6', 2, 500000, 'vacant', 6),
    (v_kos, 'G', 'Gudang', 1, 0, 'maintenance', 7)
  on conflict (kos_id, room_number) do nothing;

  return v_kos;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. HAK AKSES
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on function public.is_kos_owner(uuid) to authenticated;
grant execute on function public.provision_owner(text) to authenticated;
