-- ============================================================
-- BENGKELPRO — Supabase Schema Lengkap
-- Jalankan di: Supabase Dashboard → SQL Editor → Run ▶
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. PROFILES (linked ke auth.users)
-- ──────────────────────────────────────────────────────────
create table if not exists profiles (
  id         uuid references auth.users on delete cascade primary key,
  full_name  text,
  role       text not null default 'customer',
  -- role: customer | kasir | mekanik | admin | owner
  phone      text,
  created_at timestamptz default now()
);

-- Auto-create profile saat user baru register
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ──────────────────────────────────────────────────────────
-- 2. VEHICLES (kendaraan milik customer)
-- ──────────────────────────────────────────────────────────
create table if not exists vehicles (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references profiles(id) on delete cascade not null,
  name        text not null,          -- contoh: Honda Vario 150
  plate       text not null,          -- contoh: D 1234 AB
  type        text default 'Motor',   -- Motor | Mobil
  color       text,
  year        int,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 3. SERVICES CATALOG (daftar jasa — dikelola Admin)
-- ──────────────────────────────────────────────────────────
create table if not exists services_catalog (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       int not null default 0,
  duration    text,                   -- contoh: '45 mnt', '1 jam'
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 4. INVENTORY (sparepart — dikelola Admin)
-- ──────────────────────────────────────────────────────────
create table if not exists inventory (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text unique,
  buy_price   int not null default 0,
  sell_price  int not null default 0,
  stock       int not null default 0,
  min_stock   int not null default 5,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 5. SERVICE ORDERS (antrian servis)
-- ──────────────────────────────────────────────────────────
create table if not exists service_orders (
  id           uuid primary key default gen_random_uuid(),
  order_number text unique default 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4),
  customer_id  uuid references profiles(id) on delete set null,
  vehicle_id   uuid references vehicles(id) on delete set null,
  mechanic_id  uuid references profiles(id) on delete set null,
  complaint    text,                  -- keluhan pelanggan
  status       text not null default 'waiting',
  -- status: waiting | processing | done | paid | cancelled
  check_in_at  timestamptz default now(),
  done_at      timestamptz,
  created_at   timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 6. ORDER ITEMS (detail sparepart + jasa per order)
-- ──────────────────────────────────────────────────────────
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references service_orders(id) on delete cascade not null,
  item_type     text not null,        -- 'service' | 'part'
  name          text not null,
  qty           int not null default 1,
  unit_price    int not null default 0,
  created_at    timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 7. INVOICES (pembayaran)
-- ──────────────────────────────────────────────────────────
create table if not exists invoices (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references service_orders(id) on delete cascade unique not null,
  invoice_number  text unique default 'INV-' || to_char(now(), 'YYYY') || '-' || substr(gen_random_uuid()::text, 1, 6),
  subtotal        int not null default 0,
  discount        int not null default 0,
  total           int not null default 0,
  payment_method  text,               -- Tunai | Transfer | QRIS | EDC
  amount_paid     int default 0,
  change_amount   int default 0,
  paid_at         timestamptz,
  created_at      timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════

-- Helper function: cek role user saat ini (NON-REKURSIF)
create or replace function current_user_role()
returns text as $$
begin
  -- Langsung ambil dari JWT metadata bila tersedia (paling cepat & aman)
  if (auth.jwt() -> 'user_metadata' ->> 'role') is not null then
    return (auth.jwt() -> 'user_metadata' ->> 'role');
  end if;

  -- Fallback ke tabel profiles (SECURITY DEFINER bypasses RLS)
  return (select role from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

-- ── profiles ──────────────────────────────────────────────
alter table profiles enable row level security;

-- Hapus SEMUA policy yang mungkin ada (biar bersih)
do $$ 
declare 
  pol record;
begin 
  for pol in select policyname from pg_policies where tablename = 'profiles' 
  loop
    execute format('drop policy %I on profiles', pol.policyname);
  end loop;
end $$;

-- Rebuild Policy (Aman dari Recursion)
create policy "allow_select_own" on profiles for select using (auth.uid() = id);
create policy "allow_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "allow_update_own" on profiles for update using (auth.uid() = id);

-- Staff can see all, tapi pake metadata JWT biar ga balik manggil function (loop)
create policy "allow_staff_select_all"
  on profiles for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'owner', 'kasir', 'mekanik')
  );


-- ── vehicles ──────────────────────────────────────────────
alter table vehicles enable row level security;

drop policy if exists "vehicles_customer" on vehicles;
drop policy if exists "vehicles_staff"    on vehicles;

create policy "vehicles_customer"
  on vehicles for all
  using (owner_id = auth.uid());

create policy "vehicles_staff"
  on vehicles for select
  using (current_user_role() in ('admin', 'owner', 'kasir', 'mekanik'));

-- ── services_catalog ──────────────────────────────────────
alter table services_catalog enable row level security;

drop policy if exists "services_read_all" on services_catalog;
drop policy if exists "services_admin"    on services_catalog;

create policy "services_read_all"
  on services_catalog for select using (true);

create policy "services_admin"
  on services_catalog for all
  using (current_user_role() in ('admin', 'owner'));

-- ── inventory ─────────────────────────────────────────────
alter table inventory enable row level security;

drop policy if exists "inventory_read_staff"  on inventory;
drop policy if exists "inventory_manage_admin" on inventory;

create policy "inventory_read_staff"
  on inventory for select
  using (current_user_role() in ('admin', 'owner', 'mekanik', 'kasir'));

create policy "inventory_manage_admin"
  on inventory for all
  using (current_user_role() in ('admin', 'owner'));

-- ── service_orders ────────────────────────────────────────
alter table service_orders enable row level security;

drop policy if exists "orders_customer"  on service_orders;
drop policy if exists "orders_staff"     on service_orders;

create policy "orders_customer"
  on service_orders for select
  using (customer_id = auth.uid());

create policy "orders_staff"
  on service_orders for all
  using (current_user_role() in ('admin', 'owner', 'kasir', 'mekanik'));

-- ── order_items ───────────────────────────────────────────
alter table order_items enable row level security;

drop policy if exists "items_staff" on order_items;

create policy "items_staff"
  on order_items for all
  using (current_user_role() in ('admin', 'owner', 'kasir', 'mekanik'));

-- ── invoices ──────────────────────────────────────────────
alter table invoices enable row level security;

drop policy if exists "invoices_customer" on invoices;
drop policy if exists "invoices_staff"    on invoices;

create policy "invoices_customer"
  on invoices for select
  using (
    exists (
      select 1 from service_orders
      where service_orders.id = invoices.order_id
        and service_orders.customer_id = auth.uid()
    )
  );

create policy "invoices_staff"
  on invoices for all
  using (current_user_role() in ('admin', 'owner', 'kasir'));

-- ══════════════════════════════════════════════════════════
-- CATATAN CARA BUAT AKUN STAFF
-- ══════════════════════════════════════════════════════════
-- 1. Buat user di: Supabase → Authentication → Users → Add user
-- 2. Setelah user dibuat, jalankan query ini di SQL Editor:
--    UPDATE profiles SET role = 'kasir'   WHERE id = 'uuid-user';
--    UPDATE profiles SET role = 'mekanik' WHERE id = 'uuid-user';
--    UPDATE profiles SET role = 'admin'   WHERE id = 'uuid-user';
--    UPDATE profiles SET role = 'owner'   WHERE id = 'uuid-user';
-- ══════════════════════════════════════════════════════════
