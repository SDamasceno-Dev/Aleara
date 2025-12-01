-- Migration: 20251126_000023__quina__bet_lists__schema
-- Title: Quina bet lists
-- Description: Create quina_bet_lists and quina_bet_list_items with owner RLS.

begin;

create table if not exists public.quina_bet_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contest_no integer,
  title text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_quina_bet_lists_user_contest
  on public.quina_bet_lists (user_id, contest_no)
  where contest_no is not null;

create table if not exists public.quina_bet_list_items (
  list_id uuid not null references public.quina_bet_lists(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  primary key (list_id, numbers)
);

alter table public.quina_bet_list_items
  add constraint quina_bet_list_items_numbers_check
  check (array_length(numbers, 1) between 5 and 20);

alter table public.quina_bet_lists enable row level security;
alter table public.quina_bet_list_items enable row level security;

-- Owner RLS
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_bet_lists' and policyname = 'sel_own') then
    create policy sel_own on public.quina_bet_lists for select to authenticated using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_bet_lists' and policyname = 'ins_own') then
    create policy ins_own on public.quina_bet_lists for insert to authenticated with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_bet_lists' and policyname = 'upd_own') then
    create policy upd_own on public.quina_bet_lists for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_bet_lists' and policyname = 'del_own') then
    create policy del_own on public.quina_bet_lists for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_bet_list_items' and policyname = 'sel_items_own') then
    create policy sel_items_own on public.quina_bet_list_items
      for select to authenticated
      using (exists (select 1 from public.quina_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_bet_list_items' and policyname = 'ins_items_own') then
    create policy ins_items_own on public.quina_bet_list_items
      for insert to authenticated
      with check (exists (select 1 from public.quina_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_bet_list_items' and policyname = 'del_items_own') then
    create policy del_items_own on public.quina_bet_list_items
      for delete to authenticated
      using (exists (select 1 from public.quina_bet_lists l where l.id = list_id and l.user_id = auth.uid()));
  end if;
end $$;

commit;


