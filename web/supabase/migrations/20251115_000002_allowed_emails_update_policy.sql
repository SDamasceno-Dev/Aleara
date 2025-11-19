-- Add missing UPDATE policy for allowed_emails (ADMIN only)
-- Upserts can execute as UPDATE when the email already exists.

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


