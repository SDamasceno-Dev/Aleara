-- Migration: 20260203_000001__lotofacil__draws__schema
-- Title: Lotofácil draws schema
-- Description: Create table public.lotofacil_draws with RLS and policies. Stores historical results for Lotofácil.
-- Notes: 15 bolas sorteadas (1-25), premiação para 11-15 acertos.
-- Affects: public.lotofacil_draws, policies, triggers
-- Dependencies: public.is_admin()
-- Idempotent: yes
-- Rollback: drop table public.lotofacil_draws cascade;
-- Author: system | CreatedAt: 2026-02-03

begin;

create table if not exists public.lotofacil_draws (
  concurso integer primary key,
  data_sorteio date not null,
  bola1 smallint not null check (bola1 between 1 and 25),
  bola2 smallint not null check (bola2 between 1 and 25),
  bola3 smallint not null check (bola3 between 1 and 25),
  bola4 smallint not null check (bola4 between 1 and 25),
  bola5 smallint not null check (bola5 between 1 and 25),
  bola6 smallint not null check (bola6 between 1 and 25),
  bola7 smallint not null check (bola7 between 1 and 25),
  bola8 smallint not null check (bola8 between 1 and 25),
  bola9 smallint not null check (bola9 between 1 and 25),
  bola10 smallint not null check (bola10 between 1 and 25),
  bola11 smallint not null check (bola11 between 1 and 25),
  bola12 smallint not null check (bola12 between 1 and 25),
  bola13 smallint not null check (bola13 between 1 and 25),
  bola14 smallint not null check (bola14 between 1 and 25),
  bola15 smallint not null check (bola15 between 1 and 25),

  -- Premiação: 15 acertos
  ganhadores_15 integer,
  cidades_uf text,
  rateio_15 numeric(14,2),

  -- Premiação: 14 acertos
  ganhadores_14 integer,
  rateio_14 numeric(14,2),

  -- Premiação: 13 acertos
  ganhadores_13 integer,
  rateio_13 numeric(14,2),

  -- Premiação: 12 acertos
  ganhadores_12 integer,
  rateio_12 numeric(14,2),

  -- Premiação: 11 acertos
  ganhadores_11 integer,
  rateio_11 numeric(14,2),

  -- Financeiro
  acumulado_15 numeric(16,2),
  arrecadacao_total numeric(16,2),
  estimativa_premio numeric(16,2),

  -- Metadados
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lotofacil_draws_data_idx on public.lotofacil_draws (data_sorteio desc);

-- RLS
alter table public.lotofacil_draws enable row level security;

-- Authenticated can read
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_draws' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.lotofacil_draws
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Admins can write (assumes is_admin() helper exists)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_draws' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.lotofacil_draws
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_draws' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.lotofacil_draws
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_draws' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.lotofacil_draws
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

-- Trigger to keep updated_at fresh (reuse existing function if available)
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists lotofacil_draws_touch_updated on public.lotofacil_draws;
create trigger lotofacil_draws_touch_updated
before update on public.lotofacil_draws
for each row execute function public.touch_updated_at();

commit;
