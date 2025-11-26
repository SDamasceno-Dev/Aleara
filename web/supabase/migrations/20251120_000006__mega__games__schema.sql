-- Title: Mega-Sena user games (sets + items) with RLS
-- Description: Persist users' generated combinations and per-item matches.
-- Affects: public.megasena_user_sets, public.megasena_user_items, policies, indexes
-- Dependencies: auth schema; public.is_admin() (not required here but consistent RLS setup)
-- Idempotent: yes
-- Rollback: drop table public.megasena_user_items cascade; drop table public.megasena_user_sets cascade;
-- Author: system | CreatedAt: 2025-11-21 00:00:50Z

create table if not exists public.megasena_user_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_numbers smallint[] not null check (array_length(source_numbers, 1) between 7 and 15),
  total_combinations integer not null check (total_combinations > 0),
  sample_size integer not null check (sample_size > 0),
  seed integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.megasena_user_items (
  set_id uuid not null references public.megasena_user_sets(id) on delete cascade,
  position integer not null,
  numbers smallint[6] not null,
  matches smallint,
  primary key (set_id, position)
);

create index if not exists megasena_user_items_set_idx on public.megasena_user_items (set_id, position);
create index if not exists megasena_user_sets_user_idx on public.megasena_user_sets (user_id, created_at desc);

alter table public.megasena_user_sets enable row level security;
alter table public.megasena_user_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_sets' and policyname='sets_select_own'
  ) then
    create policy sets_select_own on public.megasena_user_sets for select
      to authenticated
      using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_sets' and policyname='sets_ins_own'
  ) then
    create policy sets_ins_own on public.megasena_user_sets for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_sets' and policyname='sets_upd_own'
  ) then
    create policy sets_upd_own on public.megasena_user_sets for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_sets' and policyname='sets_del_own'
  ) then
    create policy sets_del_own on public.megasena_user_sets for delete
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_items' and policyname='items_select_own'
  ) then
    create policy items_select_own on public.megasena_user_items for select
      to authenticated
      using (exists (select 1 from public.megasena_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_items' and policyname='items_ins_own'
  ) then
    create policy items_ins_own on public.megasena_user_items for insert
      to authenticated
      with check (exists (select 1 from public.megasena_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_items' and policyname='items_upd_own'
  ) then
    create policy items_upd_own on public.megasena_user_items for update
      to authenticated
      using (exists (select 1 from public.megasena_user_sets s where s.id = set_id and s.user_id = auth.uid()))
      with check (exists (select 1 from public.megasena_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_user_items' and policyname='items_del_own'
  ) then
    create policy items_del_own on public.megasena_user_items for delete
      to authenticated
      using (exists (select 1 from public.megasena_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end$$;


