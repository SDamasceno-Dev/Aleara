-- Migration: 20260114_082425__lotomania__bet_lists__schema
-- Title: Lotomania bet lists
-- Description: Create lotomania_bet_lists and lotomania_bet_list_items with owner RLS. Stores per-user bet lists, optionally tied to a contest, with items (50 numbers each).
-- Affects: public.lotomania_bet_lists, public.lotomania_bet_list_items, policies, indexes
-- Dependencies: auth.users
-- Idempotent: yes
-- Rollback: drop table if exists public.lotomania_bet_list_items cascade; drop table if exists public.lotomania_bet_lists cascade;
-- Author: system | CreatedAt: 2026-01-14 08:24:25Z

begin;

create table if not exists public.lotomania_bet_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contest_no integer,
  title text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_lotomania_bet_lists_user_contest
  on public.lotomania_bet_lists (user_id, contest_no)
  where contest_no is not null;

create table if not exists public.lotomania_bet_list_items (
  list_id uuid not null references public.lotomania_bet_lists(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  primary key (list_id, position)
);

alter table public.lotomania_bet_list_items
  add constraint lotomania_bet_list_items_numbers_check
  check (array_length(numbers, 1) = 50);

-- Unique numbers per list (avoid duplicates)
create unique index if not exists ux_lotomania_bet_list_items_numbers
  on public.lotomania_bet_list_items (list_id, numbers);

-- RLS
alter table public.lotomania_bet_lists enable row level security;
alter table public.lotomania_bet_list_items enable row level security;

-- Owner policies for bet_lists
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_lists' and policyname = 'sel_own') then
    create policy sel_own on public.lotomania_bet_lists for select to authenticated using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_lists' and policyname = 'ins_own') then
    create policy ins_own on public.lotomania_bet_lists for insert to authenticated with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_lists' and policyname = 'upd_own') then
    create policy upd_own on public.lotomania_bet_lists for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_lists' and policyname = 'del_own') then
    create policy del_own on public.lotomania_bet_lists for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;

-- Owner policies for bet_list_items
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_list_items' and policyname = 'sel_items_own') then
    create policy sel_items_own on public.lotomania_bet_list_items
      for select to authenticated
      using (exists (select 1 from public.lotomania_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_list_items' and policyname = 'ins_items_own') then
    create policy ins_items_own on public.lotomania_bet_list_items
      for insert to authenticated
      with check (exists (select 1 from public.lotomania_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_list_items' and policyname = 'upd_items_own') then
    create policy upd_items_own on public.lotomania_bet_list_items
      for update to authenticated
      using (exists (select 1 from public.lotomania_bet_lists l where l.id = list_id and l.user_id = auth.uid()))
      with check (exists (select 1 from public.lotomania_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_bet_list_items' and policyname = 'del_items_own') then
    create policy del_items_own on public.lotomania_bet_list_items
      for delete to authenticated
      using (exists (select 1 from public.lotomania_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;

commit;
