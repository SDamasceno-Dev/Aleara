-- Title: Unique saved check per (user_id, set_id, contest_no)
-- Description: Prevent duplicate entries for the same user, set and contest.
-- Affects: public.megasena_checks (index)
-- Dependencies: 20251120_000007__mega__checks__schema.sql
-- Idempotent: yes
-- Rollback: drop index if exists ux_megasena_checks_user_set_contest;
-- Author: system | CreatedAt: 2025-11-21 00:01:10Z

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'ux_megasena_checks_user_set_contest'
  ) then
    create unique index ux_megasena_checks_user_set_contest
      on public.megasena_checks (user_id, set_id, contest_no);
  end if;
end$$;


