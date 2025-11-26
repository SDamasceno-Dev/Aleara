-- Title: Mega-Sena bet lists (save/load bets by contest)
-- Description: Store per-user bet lists, optionally tied to a contest, with items (6..20 numbers).
-- Affects: public.megasena_bet_lists, public.megasena_bet_list_items, indexes, policies
-- Dependencies: auth, public.is_admin()
-- Idempotent: yes
-- Rollback: drop table if exists public.megasena_bet_list_items cascade; drop table if exists public.megasena_bet_lists cascade;
-- Author: system | CreatedAt: 2025-11-22 00:45:00Z

create table if not exists public.megasena_bet_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  contest_no integer, -- nullable: lists not tied to a contest are allowed
  title text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

-- One list per (user, contest) when contest_no is defined
create unique index if not exists uq_megasena_bet_lists_user_contest
  on public.megasena_bet_lists (user_id, contest_no)
  where contest_no is not null;

create table if not exists public.megasena_bet_list_items (
  list_id uuid not null references public.megasena_bet_lists(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  primary key (list_id, position)
);

-- Ensure 6..20 numbers per bet
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'megasena_bet_list_items_numbers_len_check'
      and conrelid = 'public.megasena_bet_list_items'::regclass
  ) then
    alter table public.megasena_bet_list_items
      add constraint megasena_bet_list_items_numbers_len_check
      check (array_length(numbers, 1) between 6 and 20);
  end if;
end$$;

-- Unique numbers per list (avoid duplicates)
create unique index if not exists ux_megasena_bet_list_items_numbers
  on public.megasena_bet_list_items (list_id, numbers);

-- RLS
alter table public.megasena_bet_lists enable row level security;
alter table public.megasena_bet_list_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_lists' and policyname='bet_lists_select_own'
  ) then
    create policy bet_lists_select_own on public.megasena_bet_lists for select
      to authenticated
      using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_lists' and policyname='bet_lists_ins_own'
  ) then
    create policy bet_lists_ins_own on public.megasena_bet_lists for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_lists' and policyname='bet_lists_upd_own'
  ) then
    create policy bet_lists_upd_own on public.megasena_bet_lists for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_lists' and policyname='bet_lists_del_own'
  ) then
    create policy bet_lists_del_own on public.megasena_bet_lists for delete
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_list_items' and policyname='bet_items_select_own'
  ) then
    create policy bet_items_select_own on public.megasena_bet_list_items for select
      to authenticated
      using (exists (select 1 from public.megasena_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_list_items' and policyname='bet_items_ins_own'
  ) then
    create policy bet_items_ins_own on public.megasena_bet_list_items for insert
      to authenticated
      with check (exists (select 1 from public.megasena_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_list_items' and policyname='bet_items_upd_own'
  ) then
    create policy bet_items_upd_own on public.megasena_bet_list_items for update
      to authenticated
      using (exists (select 1 from public.megasena_bet_lists l where l.id = list_id and l.user_id = auth.uid()))
      with check (exists (select 1 from public.megasena_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_bet_list_items' and policyname='bet_items_del_own'
  ) then
    create policy bet_items_del_own on public.megasena_bet_list_items for delete
      to authenticated
      using (exists (select 1 from public.megasena_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end$$;


