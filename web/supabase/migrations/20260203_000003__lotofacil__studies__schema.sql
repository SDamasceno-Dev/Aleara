-- Migration: 20260203_000003__lotofacil__studies__schema
-- Title: Lotofácil studies catalog and items
-- Description: Create lotofacil_stats_catalog and lotofacil_stats_items with RLS and admin policies.
-- Notes: Stores statistical studies (pairs, consecutive, decades, parity, sum ranges, etc.)
-- Affects: public.lotofacil_stats_catalog, public.lotofacil_stats_items, policies
-- Dependencies: public.is_admin()
-- Idempotent: yes
-- Rollback: drop table public.lotofacil_stats_items cascade; drop table public.lotofacil_stats_catalog cascade;
-- Author: system | CreatedAt: 2026-02-03

begin;

create table if not exists public.lotofacil_stats_catalog (
  study_key text primary key,
  title text not null,
  params jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.lotofacil_stats_items (
  study_key text not null references public.lotofacil_stats_catalog(study_key) on delete cascade,
  item_key text not null,
  rank integer not null,
  value numeric not null,
  extra jsonb not null default '{}'::jsonb,
  primary key (study_key, item_key)
);

alter table public.lotofacil_stats_catalog enable row level security;
alter table public.lotofacil_stats_items enable row level security;

-- SELECT for authenticated
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_catalog' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.lotofacil_stats_catalog
      for select
      to authenticated
      using (true);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_items' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.lotofacil_stats_items
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Admin write for catalog
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_catalog' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.lotofacil_stats_catalog
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_catalog' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.lotofacil_stats_catalog
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_catalog' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.lotofacil_stats_catalog
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

-- Admin write for items
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_items' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.lotofacil_stats_items
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_items' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.lotofacil_stats_items
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_stats_items' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.lotofacil_stats_items
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

commit;
