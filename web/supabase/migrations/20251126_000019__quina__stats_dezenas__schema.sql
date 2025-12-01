-- Migration: 20251126_000019__quina__stats_dezenas__schema
-- Title: Quina dezenas stats
-- Description: Create quina_stats_dezenas (frequency table) with RLS and admin policies.

begin;

create table if not exists public.quina_stats_dezenas (
  dezena smallint primary key check (dezena between 1 and 80),
  vezes_sorteada integer not null default 0,
  pct_sorteios numeric not null default 0,
  total_sorteios integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.quina_stats_dezenas enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_dezenas' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.quina_stats_dezenas
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_dezenas' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.quina_stats_dezenas
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_dezenas' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.quina_stats_dezenas
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_dezenas' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.quina_stats_dezenas
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

commit;


