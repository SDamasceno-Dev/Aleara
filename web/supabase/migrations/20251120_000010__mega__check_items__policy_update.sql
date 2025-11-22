-- Title: UPDATE policy for megasena_check_items (owner)
-- Description: Allow owners to UPDATE their items (required by UPSERT).
-- Affects: public.megasena_check_items (policies)
-- Dependencies: 20251120_000007__mega__checks__schema.sql
-- Idempotent: yes
-- Rollback: drop policy if exists check_items_upd_own on public.megasena_check_items;
-- Author: system | CreatedAt: 2025-11-21 00:01:30Z

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'megasena_check_items'
      and policyname = 'check_items_upd_own'
  ) then
    create policy check_items_upd_own on public.megasena_check_items
      for update
      to authenticated
      using (exists (select 1 from public.megasena_checks c where c.id = check_id and c.user_id = auth.uid()))
      with check (exists (select 1 from public.megasena_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end$$;


