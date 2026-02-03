-- Migration: 20260203_000005__lotofacil__checks__schema
-- Title: Lotofácil checks schema
-- Description: Create lotofacil_checks and lotofacil_check_items with owner RLS and uniques.
-- Notes: draw_numbers sempre com 15 elementos (sorteio oficial).
-- Affects: public.lotofacil_checks, public.lotofacil_check_items, policies, indexes
-- Dependencies: public.lotofacil_user_sets
-- Idempotent: yes
-- Rollback: drop table public.lotofacil_check_items cascade; drop table public.lotofacil_checks cascade;
-- Author: system | CreatedAt: 2026-02-03

begin;

create table if not exists public.lotofacil_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid references public.lotofacil_user_sets(id) on delete set null,
  contest_no integer not null,
  draw_numbers smallint[] not null,
  checked_at timestamptz not null default now()
);

-- Constraint: draw_numbers deve ter exatamente 15 elementos (sorteio)
alter table public.lotofacil_checks
  add constraint lotofacil_checks_draw_numbers_check
  check (array_length(draw_numbers, 1) = 15);

-- Unique: um usuário só pode ter uma conferência por set/concurso
create unique index if not exists ux_lotofacil_checks_user_set_contest
  on public.lotofacil_checks (user_id, set_id, contest_no);

create table if not exists public.lotofacil_check_items (
  check_id uuid not null references public.lotofacil_checks(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  matches smallint not null,
  primary key (check_id, numbers)
);

-- Constraint: numbers deve ter entre 15 e 20 elementos
alter table public.lotofacil_check_items
  add constraint lotofacil_check_items_numbers_check
  check (array_length(numbers, 1) between 15 and 20);

alter table public.lotofacil_checks enable row level security;
alter table public.lotofacil_check_items enable row level security;

-- Owner policies for checks
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_checks' and policyname = 'sel_own') then
    create policy sel_own on public.lotofacil_checks
      for select to authenticated using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_checks' and policyname = 'ins_own') then
    create policy ins_own on public.lotofacil_checks
      for insert to authenticated with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_checks' and policyname = 'upd_own') then
    create policy upd_own on public.lotofacil_checks
      for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_checks' and policyname = 'del_own') then
    create policy del_own on public.lotofacil_checks
      for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;

-- Owner policies for check_items (via check ownership)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_check_items' and policyname = 'sel_items_own') then
    create policy sel_items_own on public.lotofacil_check_items
      for select to authenticated
      using (exists (select 1 from public.lotofacil_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_check_items' and policyname = 'ins_items_own') then
    create policy ins_items_own on public.lotofacil_check_items
      for insert to authenticated
      with check (exists (select 1 from public.lotofacil_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_check_items' and policyname = 'upd_items_own') then
    create policy upd_items_own on public.lotofacil_check_items
      for update to authenticated
      using (exists (select 1 from public.lotofacil_checks c where c.id = check_id and c.user_id = auth.uid()))
      with check (exists (select 1 from public.lotofacil_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_check_items' and policyname = 'del_items_own') then
    create policy del_items_own on public.lotofacil_check_items
      for delete to authenticated
      using (exists (select 1 from public.lotofacil_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;

commit;
