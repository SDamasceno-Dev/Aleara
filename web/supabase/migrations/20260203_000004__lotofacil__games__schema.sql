-- Migration: 20260203_000004__lotofacil__games__schema
-- Title: Lotofácil games schema
-- Description: Create lotofacil_user_sets and lotofacil_user_items with RLS owner policies.
-- Notes: source_numbers: 15-20 números; items: 15 números por jogo.
-- Affects: public.lotofacil_user_sets, public.lotofacil_user_items, policies, indexes
-- Dependencies: auth schema
-- Idempotent: yes
-- Rollback: drop table public.lotofacil_user_items cascade; drop table public.lotofacil_user_sets cascade;
-- Author: system | CreatedAt: 2026-02-03

begin;

create table if not exists public.lotofacil_user_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_numbers smallint[] not null,
  total_combinations integer not null default 0,
  sample_size integer not null default 0 check (sample_size >= 0),
  seed bigint,
  title text,
  marked_idx integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Constraint: source_numbers deve ter entre 15 e 20 elementos
alter table public.lotofacil_user_sets
  add constraint lotofacil_user_sets_source_numbers_check
  check (array_length(source_numbers, 1) between 15 and 20);

create table if not exists public.lotofacil_user_items (
  set_id uuid not null references public.lotofacil_user_sets(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  matches smallint,
  primary key (set_id, position)
);

-- Constraint: numbers deve ter entre 15 e 20 elementos (aposta simples = 15, máxima = 20)
alter table public.lotofacil_user_items
  add constraint lotofacil_user_items_numbers_check
  check (array_length(numbers, 1) between 15 and 20);

-- Indexes
create index if not exists lotofacil_user_sets_user_idx on public.lotofacil_user_sets (user_id, created_at desc);
create index if not exists lotofacil_user_sets_title_idx on public.lotofacil_user_sets (user_id, title) where title is not null;
create index if not exists lotofacil_user_items_set_idx on public.lotofacil_user_items (set_id, position);

-- RLS
alter table public.lotofacil_user_sets enable row level security;
alter table public.lotofacil_user_items enable row level security;

-- Owner policies for sets
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_sets' and policyname = 'sel_own'
  ) then
    create policy sel_own on public.lotofacil_user_sets
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_sets' and policyname = 'ins_own'
  ) then
    create policy ins_own on public.lotofacil_user_sets
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_sets' and policyname = 'upd_own'
  ) then
    create policy upd_own on public.lotofacil_user_sets
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_sets' and policyname = 'del_own'
  ) then
    create policy del_own on public.lotofacil_user_sets
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- Owner policies for items (via set ownership)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_items' and policyname = 'sel_items_own'
  ) then
    create policy sel_items_own on public.lotofacil_user_items
      for select
      to authenticated
      using (exists (select 1 from public.lotofacil_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_items' and policyname = 'ins_items_own'
  ) then
    create policy ins_items_own on public.lotofacil_user_items
      for insert
      to authenticated
      with check (exists (select 1 from public.lotofacil_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_items' and policyname = 'upd_items_own'
  ) then
    create policy upd_items_own on public.lotofacil_user_items
      for update
      to authenticated
      using (exists (select 1 from public.lotofacil_user_sets s where s.id = set_id and s.user_id = auth.uid()))
      with check (exists (select 1 from public.lotofacil_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'lotofacil_user_items' and policyname = 'del_items_own'
  ) then
    create policy del_items_own on public.lotofacil_user_items
      for delete
      to authenticated
      using (exists (select 1 from public.lotofacil_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;

commit;
