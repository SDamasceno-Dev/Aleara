-- Migration: 20260114_082421__lotomania__stats_dezenas__schema
-- Title: Lotomania dezenas stats
-- Description: Create lotomania_stats_dezenas (frequency table) with RLS and admin policies. Tracks frequency of each number (1-100) in draws.
-- Affects: public.lotomania_stats_dezenas, policies, triggers
-- Dependencies: public.is_admin()
-- Idempotent: yes
-- Rollback: drop table public.lotomania_stats_dezenas cascade;
-- Author: system | CreatedAt: 2026-01-14 08:24:21Z

begin;

create table if not exists public.lotomania_stats_dezenas (
  dezena smallint primary key check (dezena between 1 and 100),
  vezes_sorteada integer not null default 0,
  pct_sorteios numeric not null default 0,
  total_sorteios integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists lotomania_stats_dezenas_ord_idx
  on public.lotomania_stats_dezenas (vezes_sorteada desc, dezena asc);

alter table public.lotomania_stats_dezenas enable row level security;

-- SELECT for authenticated
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_stats_dezenas' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.lotomania_stats_dezenas
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Admin write
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_stats_dezenas' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.lotomania_stats_dezenas
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_stats_dezenas' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.lotomania_stats_dezenas
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_stats_dezenas' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.lotomania_stats_dezenas
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

-- Trigger to keep updated_at fresh
drop trigger if exists lotomania_stats_dezenas_set_updated_at on public.lotomania_stats_dezenas;
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lotomania_stats_dezenas_set_updated_at
before update on public.lotomania_stats_dezenas
for each row
execute function public.set_updated_at();

commit;
