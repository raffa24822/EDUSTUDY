-- Jalankan seluruh isi file ini di Supabase > SQL Editor > New query > Run.
create extension if not exists pgcrypto;

create table if not exists public.edustudy_state (
  id integer primary key check (id = 1),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.edustudy_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  username_normalized text not null unique,
  class_name text not null,
  password_hash text not null,
  role text not null default 'student' check (role = 'student'),
  created_at timestamptz not null default now()
);

alter table public.edustudy_state enable row level security;
alter table public.edustudy_users enable row level security;
revoke all on public.edustudy_state from anon, authenticated;
revoke all on public.edustudy_users from anon, authenticated;
-- Hanya backend Render yang menggunakan service-role key boleh mengakses tabel ini.
