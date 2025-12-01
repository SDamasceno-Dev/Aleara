-- Migration: 20251126_000022__quina__checks__schema
-- Title: Quina checks schema
-- Description: Create quina_checks and quina_check_items with owner RLS and uniques.

begin;

create table if not exists public.quina_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid references public.quina_user_sets(id) on delete set null,
  contest_no integer not null,
  draw_numbers smallint[] not null,
  checked_at timestamptz not null default now()
);

alter table public.quina_checks
  add constraint quina_checks_draw_numbers_check
  check (array_length(draw_numbers, 1) = 5);

create unique index if not exists ux_quina_checks_user_set_contest
  on public.quina_checks (user_id, set_id, contest_no);

create table if not exists public.quina_check_items (
  check_id uuid not null references public.quina_checks(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  matches smallint not null,
  primary key (check_id, numbers)
);

alter table public.quina_check_items
  add constraint quina_check_items_numbers_check
  check (array_length(numbers, 1) between 5 and 20);

alter table public.quina_checks enable row level security;
alter table public.quina_check_items enable row level security;

-- Owner policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_checks' and policyname = 'sel_own') then
    create policy sel_own on public.quina_checks
      for select to authenticated using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_checks' and policyname = 'ins_own') then
    create policy ins_own on public.quina_checks
      for insert to authenticated with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_checks' and policyname = 'upd_own') then
    create policy upd_own on public.quina_checks
      for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_checks' and policyname = 'del_own') then
    create policy del_own on public.quina_checks
      for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_check_items' and policyname = 'sel_items_own') then
    create policy sel_items_own on public.quina_check_items
      for select to authenticated
      using (exists (select 1 from public.quina_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_check_items' and policyname = 'ins_items_own') then
    create policy ins_items_own on public.quina_check_items
      for insert to authenticated
      with check (exists (select 1 from public.quina_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_check_items' and policyname = 'upd_items_own') then
    create policy upd_items_own on public.quina_check_items
      for update to authenticated
      using (exists (select 1 from public.quina_checks c where c.id = check_id and c.user_id = auth.uid()))
      with check (exists (select 1 from public.quina_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'quina_check_items' and policyname = 'del_items_own') then
    create policy del_items_own on public.quina_check_items
      for delete to authenticated
      using (exists (select 1 from public.quina_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end $$;

commit;


