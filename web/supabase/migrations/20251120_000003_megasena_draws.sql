-- Title: Create Mega-Sena draws table with RLS (read for all authenticated, write admin-only)
-- Description: Stores historical Mega-Sena draw results and related payout/rollover metrics.
-- Dependencies: requires function public.is_admin() to exist (used in RLS policies).

create table if not exists public.megasena_draws (
  concurso integer primary key,
  data_sorteio date not null,
  bola1 smallint not null check (bola1 between 1 and 60),
  bola2 smallint not null check (bola2 between 1 and 60),
  bola3 smallint not null check (bola3 between 1 and 60),
  bola4 smallint not null check (bola4 between 1 and 60),
  bola5 smallint not null check (bola5 between 1 and 60),
  bola6 smallint not null check (bola6 between 1 and 60),

  ganhadores_6 integer,
  cidades_uf text, -- raw string as provided (may include multiple cities/UF)
  rateio_6 numeric(14,2),

  ganhadores_5 integer,
  rateio_5 numeric(14,2),

  ganhadores_4 integer,
  rateio_4 numeric(14,2),

  acumulado_6 numeric(14,2),
  arrecadacao_total numeric(16,2),
  estimativa_premio numeric(16,2),
  acumulado_mega_da_virada numeric(16,2),
  observacao text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple helpful indexes
create index if not exists megasena_draws_data_idx on public.megasena_draws (data_sorteio desc);

-- RLS: authenticated users can read; only admins can write
alter table public.megasena_draws enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_draws' and policyname = 'Select draws (authenticated)'
  ) then
    create policy "Select draws (authenticated)"
      on public.megasena_draws
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_draws' and policyname = 'Insert draws (admin)'
  ) then
    create policy "Insert draws (admin)"
      on public.megasena_draws
      for insert
      to authenticated
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_draws' and policyname = 'Update draws (admin)'
  ) then
    create policy "Update draws (admin)"
      on public.megasena_draws
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_draws' and policyname = 'Delete draws (admin)'
  ) then
    create policy "Delete draws (admin)"
      on public.megasena_draws
      for delete
      to authenticated
      using (public.is_admin());
  end if;
end$$;

-- Trigger to keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists megasena_draws_set_updated_at on public.megasena_draws;
create trigger megasena_draws_set_updated_at
before update on public.megasena_draws
for each row
execute function public.set_updated_at();


