-- Title: Allowed emails UPDATE policy (admin-only)
-- Description: Adds UPDATE policy to support upserts by admins.
-- Affects: public.allowed_emails (policies)
-- Dependencies: 20251115_000001__auth__allowed_emails__schema.sql, public.is_admin()
-- Idempotent: yes
-- Rollback: drop policy if exists admin_update on public.allowed_emails;
-- Author: system | CreatedAt: 2025-11-21 00:00:10Z

alter table public.allowed_emails enable row level security;

drop policy if exists admin_update on public.allowed_emails;
create policy admin_update
  on public.allowed_emails
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Notes:
-- - SELECT/INSERT/DELETE policies already exist from previous migration.
-- - This UPDATE policy allows upserts to succeed for ADMIN users.


