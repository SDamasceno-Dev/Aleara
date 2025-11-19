-- Enable required extensions (idempotent)
create extension if not exists citext;
create extension if not exists pg_trgm;

-- Table: public.allowed_emails
create table if not exists public.allowed_emails (
  email citext primary key,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Helpful index for trigram substring search (case-insensitive)
create index if not exists allowed_emails_trgm_idx
  on public.allowed_emails using gin (lower(email) gin_trgm_ops);

-- Optional: created_at index for housekeeping/ordering
create index if not exists allowed_emails_created_at_idx
  on public.allowed_emails (created_at desc);

-- RLS
alter table public.allowed_emails enable row level security;

-- Policies: ADMIN only
drop policy if exists admin_select on public.allowed_emails;
create policy admin_select
  on public.allowed_emails
  for select
  using (public.is_admin());

drop policy if exists admin_insert on public.allowed_emails;
create policy admin_insert
  on public.allowed_emails
  for insert
  with check (public.is_admin());

drop policy if exists admin_delete on public.allowed_emails;
create policy admin_delete
  on public.allowed_emails
  for delete
  using (public.is_admin());

-- Notes:
-- - Assumes public.is_admin() exists and returns boolean.
-- - citext ensures case-insensitive uniqueness for primary key.
-- - pg_trgm index accelerates substring search (lower(email) ilike '%term%').
-- - Supabase anon key will be governed by these RLS policies automatically.