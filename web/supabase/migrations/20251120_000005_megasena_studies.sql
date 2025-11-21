-- Title: Mega-Sena studies catalog and items with RLS
-- Description: Generic storage for multiple precomputed studies (top-k lists, distributions).
-- Dependencies: public.is_admin() must exist.

create table if not exists public.megasena_stats_catalog (
  study_key text primary key,
  title text not null,
  params jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.megasena_stats_items (
  study_key text not null references public.megasena_stats_catalog(study_key) on delete cascade,
  item_key text not null,
  rank integer not null,
  value numeric not null,
  extra jsonb not null default '{}'::jsonb,
  primary key (study_key, item_key)
);

create index if not exists megasena_stats_items_study_rank_idx
  on public.megasena_stats_items (study_key, rank);
create index if not exists megasena_stats_items_study_value_idx
  on public.megasena_stats_items (study_key, value desc);

alter table public.megasena_stats_catalog enable row level security;
alter table public.megasena_stats_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_stats_catalog' and policyname='Select studies (authenticated)'
  ) then
    create policy "Select studies (authenticated)"
      on public.megasena_stats_catalog
      for select
      to authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_stats_catalog' and policyname='Write studies (admin)'
  ) then
    create policy "Write studies (admin)"
      on public.megasena_stats_catalog
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_stats_items' and policyname='Select study items (authenticated)'
  ) then
    create policy "Select study items (authenticated)"
      on public.megasena_stats_items
      for select
      to authenticated
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_stats_items' and policyname='Write study items (admin)'
  ) then
    create policy "Write study items (admin)"
      on public.megasena_stats_items
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

drop trigger if exists megasena_stats_catalog_set_updated_at on public.megasena_stats_catalog;
create trigger megasena_stats_catalog_set_updated_at
before update on public.megasena_stats_catalog
for each row
execute function public.set_updated_at();


