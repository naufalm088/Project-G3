-- =============================================================================
-- Smart Kos Monitor — Perbaikan skema (rooms & settings) untuk DB yang sudah punya
-- tabel lama dari migrasi v1. Jalankan di Supabase SQL Editor.
-- =============================================================================
-- rooms & settings lama (skema listrik) punya kolom berbeda -> drop & buat ulang.
drop table if exists public.rooms cascade;
drop table if exists public.settings cascade;

-- (tenants, payments, notifications sudah schema baru dari migrasi 20260102)

create table public.rooms (
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

create table public.settings (
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
  wa_template text,
  updated_at timestamptz not null default now()
);

-- backfill: untuk setiap kos yang sudah ada, buat 6 kamar + gudang + settings
insert into public.settings (kos_id)
select id from public.kos
on conflict (kos_id) do nothing;

insert into public.rooms (kos_id, room_number, name, floor, monthly_rent, status, sort_order)
select k.id, r.room_number, r.name, r.floor, r.monthly_rent, r.status, r.sort_order
from public.kos k
cross join (values
  ('1','Kamar 1',1,550000::numeric,'vacant',1),
  ('2','Kamar 2',1,550000::numeric,'vacant',2),
  ('3','Kamar 3',1,500000::numeric,'vacant',3),
  ('4','Kamar 4',2,600000::numeric,'vacant',4),
  ('5','Kamar 5',2,450000::numeric,'vacant',5),
  ('6','Kamar 6',2,500000::numeric,'vacant',6),
  ('G','Gudang',1,0::numeric,'maintenance',7)
) as r(room_number,name,floor,monthly_rent,status,sort_order)
on conflict (kos_id, room_number) do nothing;

-- RLS
alter table public.rooms enable row level security;
alter table public.settings enable row level security;

drop policy if exists "rooms_owner_all" on public.rooms;
create policy "rooms_owner_all" on public.rooms
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

drop policy if exists "settings_owner_all" on public.settings;
create policy "settings_owner_all" on public.settings
  for all using (public.is_kos_owner(kos_id)) with check (public.is_kos_owner(kos_id));

grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
