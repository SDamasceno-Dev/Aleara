-- Migration: 20260203_000006__lotofacil__bet_lists__schema
-- Title: Lotofácil bet lists
-- Description: Create lotofacil_bet_lists and lotofacil_bet_list_items with owner RLS.
-- Notes: Permite salvar listas de apostas por concurso.
-- Affects: public.lotofacil_bet_lists, public.lotofacil_bet_list_items, policies, indexes
-- Dependencies: auth schema
-- Idempotent: yes
-- Rollback: drop table public.lotofacil_bet_list_items cascade; drop table public.lotofacil_bet_lists cascade;
-- Author: system | CreatedAt: 2026-02-03

begin;

create table if not exists public.lotofacil_bet_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contest_no integer,
  title text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

-- Unique parcial: um usuário só pode ter uma lista por concurso (quando contest_no não é null)
create unique index if not exists ux_lotofacil_bet_lists_user_contest
  on public.lotofacil_bet_lists (user_id, contest_no)
  where contest_no is not null;

create table if not exists public.lotofacil_bet_list_items (
  list_id uuid not null references public.lotofacil_bet_lists(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  primary key (list_id, numbers)
);

-- Constraint: numbers deve ter entre 15 e 20 elementos
alter table public.lotofacil_bet_list_items
  add constraint lotofacil_bet_list_items_numbers_check
  check (array_length(numbers, 1) between 15 and 20);

alter table public.lotofacil_bet_lists enable row level security;
alter table public.lotofacil_bet_list_items enable row level security;

-- Owner RLS for bet_lists
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_bet_lists' and policyname = 'sel_own') then
    create policy sel_own on public.lotofacil_bet_lists for select to authenticated using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_bet_lists' and policyname = 'ins_own') then
    create policy ins_own on public.lotofacil_bet_lists for insert to authenticated with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_bet_lists' and policyname = 'upd_own') then
    create policy upd_own on public.lotofacil_bet_lists for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_bet_lists' and policyname = 'del_own') then
    create policy del_own on public.lotofacil_bet_lists for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;

-- Owner RLS for bet_list_items (via list ownership)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_bet_list_items' and policyname = 'sel_items_own') then
    create policy sel_items_own on public.lotofacil_bet_list_items
      for select to authenticated
      using (exists (select 1 from public.lotofacil_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_bet_list_items' and policyname = 'ins_items_own') then
    create policy ins_items_own on public.lotofacil_bet_list_items
      for insert to authenticated
      with check (exists (select 1 from public.lotofacil_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lotofacil_bet_list_items' and policyname = 'del_items_own') then
    create policy del_items_own on public.lotofacil_bet_list_items
      for delete to authenticated
      using (exists (select 1 from public.lotofacil_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;

commit;
