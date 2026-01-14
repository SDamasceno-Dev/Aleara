-- Migration: 20260114_082424__lotomania__checks__schema
-- Title: Lotomania checks schema
-- Description: Create lotomania_checks and lotomania_check_items with owner RLS and uniques. Stores user check results against draws (matches 15-20).
-- Affects: public.lotomania_checks, public.lotomania_check_items, policies, indexes
-- Dependencies: public.lotomania_user_sets, auth.users
-- Idempotent: yes
-- Rollback: drop table public.lotomania_check_items cascade; drop table public.lotomania_checks cascade;
-- Author: system | CreatedAt: 2026-01-14 08:24:24Z

begin;

create table if not exists public.lotomania_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid references public.lotomania_user_sets(id) on delete set null,
  contest_no integer not null,
  draw_numbers smallint[] not null,
  checked_at timestamptz not null default now()
);

alter table public.lotomania_checks
  add constraint lotomania_checks_draw_numbers_check
  check (array_length(draw_numbers, 1) = 20);

create unique index if not exists ux_lotomania_checks_user_set_contest
  on public.lotomania_checks (user_id, set_id, contest_no);

create table if not exists public.lotomania_check_items (
  check_id uuid not null references public.lotomania_checks(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  matches smallint not null,
  primary key (check_id, position)
);

alter table public.lotomania_check_items
  add constraint lotomania_check_items_numbers_check
  check (array_length(numbers, 1) = 50);

alter table public.lotomania_check_items
  add constraint lotomania_check_items_matches_check
  check (matches between 15 and 20);

create index if not exists lotomania_check_items_check_idx on public.lotomania_check_items (check_id, position);
create index if not exists lotomania_checks_user_idx on public.lotomania_checks (user_id, checked_at desc);

alter table public.lotomania_checks enable row level security;
alter table public.lotomania_check_items enable row level security;

-- Owner policies for checks
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_checks' and policyname = 'sel_own') then
    create policy sel_own on public.lotomania_checks
      for select to authenticated using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_checks' and policyname = 'ins_own') then
    create policy ins_own on public.lotomania_checks
      for insert to authenticated with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_checks' and policyname = 'upd_own') then
    create policy upd_own on public.lotomania_checks
      for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_checks' and policyname = 'del_own') then
    create policy del_own on public.lotomania_checks
      for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;

-- Owner policies for check_items
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_check_items' and policyname = 'sel_items_own') then
    create policy sel_items_own on public.lotomania_check_items
      for select to authenticated
      using (exists (select 1 from public.lotomania_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_check_items' and policyname = 'ins_items_own') then
    create policy ins_items_own on public.lotomania_check_items
      for insert to authenticated
      with check (exists (select 1 from public.lotomania_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_check_items' and policyname = 'upd_items_own') then
    create policy upd_items_own on public.lotomania_check_items
      for update to authenticated
      using (exists (select 1 from public.lotomania_checks c where c.id = check_id and c.user_id = auth.uid()))
      with check (exists (select 1 from public.lotomania_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotomania_check_items' and policyname = 'del_items_own') then
    create policy del_items_own on public.lotomania_check_items
      for delete to authenticated
      using (exists (select 1 from public.lotomania_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;

commit;
