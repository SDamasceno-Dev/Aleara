-- Migration: 20251126_000018__quina__draws__schema
-- Title: Quina draws schema
-- Description: Create table public.quina_draws with RLS and policies. Stores historical results for Quina.
-- Notes: Mirrors Mega-Sena structure adjusted to Quina rules (5 bolas, 2-5 acertos buckets).

begin;

create table if not exists public.quina_draws (
  concurso integer primary key,
  data_sorteio date not null,
  bola1 smallint not null check (bola1 between 1 and 80),
  bola2 smallint not null check (bola2 between 1 and 80),
  bola3 smallint not null check (bola3 between 1 and 80),
  bola4 smallint not null check (bola4 between 1 and 80),
  bola5 smallint not null check (bola5 between 1 and 80),
  ganhadores_5 integer,
  cidades_uf text,
  rateio_5 numeric,
  ganhadores_4 integer,
  rateio_4 numeric,
  ganhadores_3 integer,
  rateio_3 numeric,
  ganhadores_2 integer,
  rateio_2 numeric,
  acumulado_5 numeric,
  arrecadacao_total numeric,
  estimativa_premio numeric,
  acumulado_quina_sao_joao numeric,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quina_draws_data_idx on public.quina_draws (data_sorteio);

-- RLS
alter table public.quina_draws enable row level security;

-- Authenticated can read
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_draws' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.quina_draws
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Admins can write (assumes is_admin() helper exists)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_draws' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.quina_draws
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_draws' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.quina_draws
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_draws' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.quina_draws
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

drop trigger if exists quina_draws_touch_updated on public.quina_draws;
create trigger quina_draws_touch_updated
before update on public.quina_draws
for each row execute function public.touch_updated_at();

commit;


