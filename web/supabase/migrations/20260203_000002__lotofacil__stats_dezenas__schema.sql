-- Migration: 20260203_000002__lotofacil__stats_dezenas__schema
-- Title: Lotofácil dezenas stats
-- Description: Create lotofacil_stats_dezenas (frequency table) with RLS and admin policies.
-- Notes: 25 dezenas (1-25) para Lotofácil.
-- Affects: public.lotofacil_stats_dezenas, policies
-- Dependencies: public.is_admin()
-- Idempotent: yes
-- Rollback: drop table public.lotofacil_stats_dezenas cascade;
-- Author: system | CreatedAt: 2026-02-03

begin;

create table if not exists public.lotofacil_stats_dezenas (
  dezena smallint primary key check (dezena between 1 and 25),
  vezes_sorteada integer not null default 0,
  pct_sorteios numeric not null default 0,
  total_sorteios integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.lotofacil_stats_dezenas enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_dezenas' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.lotofacil_stats_dezenas
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_dezenas' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.lotofacil_stats_dezenas
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_dezenas' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.lotofacil_stats_dezenas
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_dezenas' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.lotofacil_stats_dezenas
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

commit;
