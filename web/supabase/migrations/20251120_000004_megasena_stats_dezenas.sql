-- Title: Mega-Sena stats table (dezena frequency) with RLS
-- Description: Stores precomputed statistics of how many times each dezena (1..60) was drawn,
-- along with the total number of draws and percentage for quick reads on the app.
-- Dependencies: requires function public.is_admin() for RLS policies.

create table if not exists public.megasena_stats_dezenas (
  dezena smallint primary key check (dezena between 1 and 60),
  vezes_sorteada integer not null default 0,
  pct_sorteios numeric(9,6) not null default 0, -- fraction (0..1), not percentage
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

-- Title: Mega-Sena stats (frequência de dezenas) e RPC de recomputação
-- Description: Tabela de estudos pré-computados para frequência de dezenas e função RPC para recalcular após importações.
-- Dependencies: requer tabela public.megasena_draws e função public.is_admin() para políticas RLS.

create table if not exists public.megasena_stats_dezenas (
  dezena smallint primary key check (dezena between 1 and 60),
  vezes_sorteada integer not null default 0,
  pct_sorteios numeric(8,6) not null default 0,
  total_sorteios integer not null default 0,
  updated_at timestamptz not null default now()
);

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
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_stats_dezenas' and policyname = 'Insert stats (admin)'
  ) then
    create policy "Insert stats (admin)"
      on public.megasena_stats_dezenas
      for insert
      to authenticated
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_stats_dezenas' and policyname = 'Update stats (admin)'
  ) then
    create policy "Update stats (admin)"
      on public.megasena_stats_dezenas
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'megasena_stats_dezenas' and policyname = 'Delete stats (admin)'
  ) then
    create policy "Delete stats (admin)"
      on public.megasena_stats_dezenas
      for delete
      to authenticated
      using (public.is_admin());
  end if;
end$$;

-- Função para recomputar a frequência das dezenas
create or replace function public.recompute_megasena_stats_dezenas()
returns integer
language plpgsql
as $$
declare
  total int;
  inserted int;
begin
  select count(*) into total from public.megasena_draws;

  -- Remove stats antigas (admin tem permissão via RLS)
  delete from public.megasena_stats_dezenas;

  -- Insere 1..60 com left join no agregado
  insert into public.megasena_stats_dezenas (dezena, vezes_sorteada, pct_sorteios, total_sorteios, updated_at)
  select
    d.dezena,
    coalesce(c.cnt, 0) as vezes_sorteada,
    case when total > 0 then (coalesce(c.cnt, 0)::numeric / total::numeric) else 0 end as pct_sorteios,
    total as total_sorteios,
    now()
  from generate_series(1, 60) as d(dezena)
  left join (
    with base as (
      select unnest(array[bola1, bola2, bola3, bola4, bola5, bola6])::smallint as dez
      from public.megasena_draws
    )
    select dez as dezena, count(*)::int as cnt
    from base
    group by dez
  ) c on c.dezena = d.dezena;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- Title: Mega-Sena - frequency stats table for dezenas with RLS
-- Description: Stores precomputed frequency stats for each dezena (1..60).
-- Dependencies: public.is_admin() for admin-only write policies; draws table must exist.

create table if not exists public.megasena_stats_dezenas (
  dezena smallint primary key check (dezena between 1 and 60),
  vezes_sorteada integer not null default 0,
  pct_sorteios numeric(8,6) not null default 0,
  total_sorteios integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists megasena_stats_dezenas_order_idx
  on public.megasena_stats_dezenas (vezes_sorteada desc, dezena asc);

alter table public.megasena_stats_dezenas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_stats_dezenas' and policyname='Select stats (authenticated)'
  ) then
    create policy "Select stats (authenticated)"
      on public.megasena_stats_dezenas
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_stats_dezenas' and policyname='Upsert stats (admin)'
  ) then
    create policy "Upsert stats (admin)"
      on public.megasena_stats_dezenas
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end$$;

-- Reuse the common updated_at trigger
drop trigger if exists megasena_stats_dezenas_set_updated_at on public.megasena_stats_dezenas;
create trigger megasena_stats_dezenas_set_updated_at
before update on public.megasena_stats_dezenas
for each row
execute function public.set_updated_at();


