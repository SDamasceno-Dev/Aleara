-- Title: Unique check item per (check_id, numbers)
-- Description: Avoid duplicate saved games (same numbers) within the same check/contest.
-- Affects: public.megasena_check_items (index)
-- Dependencies: 20251120_000007__mega__checks__schema.sql
-- Idempotent: yes
-- Rollback: drop index if exists ux_megasena_check_items_check_numbers;
-- Author: system | CreatedAt: 2025-11-21 00:01:20Z

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'ux_megasena_check_items_check_numbers'
  ) then
    create unique index ux_megasena_check_items_check_numbers
      on public.megasena_check_items (check_id, numbers);
  end if;
end$$;


