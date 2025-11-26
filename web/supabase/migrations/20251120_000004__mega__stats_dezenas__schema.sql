-- Title: Mega-Sena frequency stats for dezenas with RLS
-- Description: Stores precomputed frequency of each dezena (1..60) and helper indexes.
-- Affects: public.megasena_stats_dezenas, policies, triggers
-- Dependencies: public.is_admin(), public.megasena_draws
-- Idempotent: yes
-- Rollback: drop table public.megasena_stats_dezenas cascade;
-- Author: system | CreatedAt: 2025-11-21 00:00:30Z

create table if not exists public.megasena_stats_dezenas (
  dezena smallint primary key check (dezena between 1 and 60),
  vezes_sorteada integer not null default 0,
  pct_sorteios numeric(9,6) not null default 0,
  total_sorteios integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists megasena_stats_dezenas_ord_idx
  on public.megasena_stats_dezenas (vezes_sorteada desc, dezena asc);

alter table public.megasena_stats_dezenas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_stats_dezenas' and policyname = 'Select stats (authenticated)'
  ) then
    create policy "Select stats (authenticated)"
      on public.megasena_stats_dezenas
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_stats_dezenas' and policyname = 'Upsert stats (admin)'
  ) then
    create policy "Upsert stats (admin)"
      on public.megasena_stats_dezenas
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists megasena_stats_dezenas_set_updated_at on public.megasena_stats_dezenas;
create trigger megasena_stats_dezenas_set_updated_at
before update on public.megasena_stats_dezenas
for each row
execute function public.set_updated_at();


