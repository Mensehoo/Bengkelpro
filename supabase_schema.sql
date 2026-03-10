-- ============================================================
-- BENGKELPRO — Supabase Schema
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tabel profiles (linked ke auth.users)
create table if not exists profiles (
  id        uuid references auth.users on delete cascade primary key,
  full_name text,
  role      text not null default 'customer',
  -- role: customer | kasir | mekanik | admin | owner
  phone     text,
  created_at timestamptz default now()
);

-- 2. Auto-create profile saat user baru register
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. Row Level Security
alter table profiles enable row level security;

-- User hanya bisa lihat & edit profil sendiri
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Admin & owner bisa lihat semua profil
create policy "Admin can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'owner')
    )
  );

-- ============================================================
-- Cara membuat akun staff (kasir, mekanik, admin, owner):
-- 1. Buat user di Supabase Auth → Authentication → Users → Add user
-- 2. Setelah user terbuat, update role di tabel profiles:
--    UPDATE profiles SET role = 'kasir' WHERE id = 'user-uuid-here';
-- ============================================================
