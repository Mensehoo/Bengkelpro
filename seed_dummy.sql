create extension if not exists pgcrypto;

do $$
declare
  -- Setup variabel untuk masing-masing user
  user_admin      uuid := gen_random_uuid();
  user_kasir      uuid := gen_random_uuid();
  user_mekanik    uuid := gen_random_uuid();
  user_owner      uuid := gen_random_uuid();
  user_customer   uuid := gen_random_uuid();
  
  default_pass    text := crypt('password123', gen_salt('bf'));
begin
  -- Hapus data lama jika ada email yang sama (opsional)
  delete from auth.users where email in (
    'admin@bengkel.pro', 'kasir@bengkel.pro', 'mekanik@bengkel.pro', 'owner@bengkel.pro', 'customer@bengkel.pro'
  );

  -- 1. Insert ke auth.users (Tabel Sistem Supabase)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  )
  values
  -- ADMIN
  ('00000000-0000-0000-0000-000000000000', user_admin, 'authenticated', 'authenticated', 'admin@bengkel.pro', default_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Budi","role":"admin"}', now(), now()),
  -- KASIR
  ('00000000-0000-0000-0000-000000000000', user_kasir, 'authenticated', 'authenticated', 'kasir@bengkel.pro', default_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kasir Siti","role":"kasir"}', now(), now()),
  -- MEKANIK
  ('00000000-0000-0000-0000-000000000000', user_mekanik, 'authenticated', 'authenticated', 'mekanik@bengkel.pro', default_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mekanik Agus","role":"mekanik"}', now(), now()),
  -- OWNER
  ('00000000-0000-0000-0000-000000000000', user_owner, 'authenticated', 'authenticated', 'owner@bengkel.pro', default_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bos Owner","role":"owner"}', now(), now()),
  -- CUSTOMER
  ('00000000-0000-0000-0000-000000000000', user_customer, 'authenticated', 'authenticated', 'customer@bengkel.pro', default_pass, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pelanggan A","role":"customer"}', now(), now());

  -- 2. Pastikan di profiles terbuat (Bypass trigger just in case trigger gagal)
  insert into public.profiles (id, full_name, role)
  values
  (user_admin, 'Admin Budi', 'admin'),
  (user_kasir, 'Kasir Siti', 'kasir'),
  (user_mekanik, 'Mekanik Agus', 'mekanik'),
  (user_owner, 'Bos Owner', 'owner'),
  (user_customer, 'Pelanggan A', 'customer')
  on conflict (id) do update set 
    full_name = excluded.full_name,
    role = excluded.role;

end;
$$ language plpgsql;
