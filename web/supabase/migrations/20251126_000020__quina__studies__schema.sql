-- Migration: 20251126_000020__quina__studies__schema
-- Title: Quina studies catalog and items
-- Description: Create quina_stats_catalog and quina_stats_items with RLS and admin policies.

begin;

create table if not exists public.quina_stats_catalog (
  study_key text primary key,
  title text not null,
  params jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.quina_stats_items (
  study_key text not null references public.quina_stats_catalog(study_key) on delete cascade,
  item_key text not null,
  rank integer not null,
  value numeric not null,
  extra jsonb not null default '{}'::jsonb,
  primary key (study_key, item_key)
);

alter table public.quina_stats_catalog enable row level security;
alter table public.quina_stats_items enable row level security;

-- SELECT for authenticated
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_catalog' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.quina_stats_catalog
      for select
      to authenticated
      using (true);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_items' and policyname = 'select_auth'
  ) then
    create policy select_auth on public.quina_stats_items
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Admin write
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_catalog' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.quina_stats_catalog
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_catalog' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.quina_stats_catalog
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_catalog' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.quina_stats_catalog
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_items' and policyname = 'ins_admin'
  ) then
    create policy ins_admin on public.quina_stats_items
      for insert
      to authenticated
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_items' and policyname = 'upd_admin'
  ) then
    create policy upd_admin on public.quina_stats_items
      for update
      to authenticated
      using (is_admin())
      with check (is_admin());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_stats_items' and policyname = 'del_admin'
  ) then
    create policy del_admin on public.quina_stats_items
      for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

commit;


