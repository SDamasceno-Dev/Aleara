-- Migration: 20260114_082420__lotomania__draws__schema
-- Title: Lotomania draws schema
-- Description: Create table public.lotomania_draws with RLS and policies. Stores historical results for Lotomania (20 numbers drawn from 1-100).
-- Affects: public.lotomania_draws, policies, triggers
-- Dependencies: public.is_admin()
-- Idempotent: yes
-- Rollback: drop table public.lotomania_draws cascade;
-- Author: system | CreatedAt: 2026-01-14 08:24:20Z

begin;

create table if not exists public.lotomania_draws (
  concurso integer primary key,
  data_sorteio date not null,
  bola1 smallint not null check (bola1 between 1 and 100),
  bola2 smallint not null check (bola2 between 1 and 100),
  bola3 smallint not null check (bola3 between 1 and 100),
  bola4 smallint not null check (bola4 between 1 and 100),
  bola5 smallint not null check (bola5 between 1 and 100),
  bola6 smallint not null check (bola6 between 1 and 100),
  bola7 smallint not null check (bola7 between 1 and 100),
  bola8 smallint not null check (bola8 between 1 and 100),
  bola9 smallint not null check (bola9 between 1 and 100),
  bola10 smallint not null check (bola10 between 1 and 100),
  bola11 smallint not null check (bola11 between 1 and 100),
  bola12 smallint not null check (bola12 between 1 and 100),
  bola13 smallint not null check (bola13 between 1 and 100),
  bola14 smallint not null check (bola14 between 1 and 100),
  bola15 smallint not null check (bola15 between 1 and 100),
  bola16 smallint not null check (bola16 between 1 and 100),
  bola17 smallint not null check (bola17 between 1 and 100),
  bola18 smallint not null check (bola18 between 1 and 100),
  bola19 smallint not null check (bola19 between 1 and 100),
  bola20 smallint not null check (bola20 between 1 and 100),
  ganhadores_20 integer,
  cidades_uf text,
  rateio_20 numeric,
  ganhadores_19 integer,
  rateio_19 numeric,
  ganhadores_18 integer,
  rateio_18 numeric,
  ganhadores_17 integer,
  rateio_17 numeric,
  ganhadores_16 integer,
  rateio_16 numeric,
  ganhadores_15 integer,
  rateio_15 numeric,
  ganhadores_nenhum_numero integer,
  rateio_nenhum_numero numeric,
  acumulado_20 numeric,
  arrecadacao_total numeric,
  estimativa_premio numeric,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lotomania_draws_data_idx on public.lotomania_draws (data_sorteio desc);

-- RLS
alter table public.lotomania_draws enable row level security;

-- Authenticated can read
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_draws' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.lotomania_draws
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Admins can write (assumes is_admin() helper exists)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_draws' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.lotomania_draws
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_draws' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.lotomania_draws
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotomania_draws' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.lotomania_draws
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

-- Trigger to keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists lotomania_draws_touch_updated on public.lotomania_draws;
create trigger lotomania_draws_touch_updated
before update on public.lotomania_draws
for each row execute function public.touch_updated_at();

commit;
