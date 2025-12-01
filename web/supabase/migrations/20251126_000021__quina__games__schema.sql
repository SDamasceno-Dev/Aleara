-- Migration: 20251126_000021__quina__games__schema
-- Title: Quina games schema
-- Description: Create quina_user_sets and quina_user_items with RLS owner policies.

begin;

create table if not exists public.quina_user_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_numbers smallint[] not null,
  total_combinations integer not null default 0,
  sample_size integer not null default 0 check (sample_size >= 0),
  seed bigint,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.quina_user_sets
  add constraint quina_user_sets_source_numbers_check
  check (array_length(source_numbers, 1) between 5 and 20);

create table if not exists public.quina_user_items (
  set_id uuid not null references public.quina_user_sets(id) on delete cascade,
  position integer not null,
  numbers smallint[] not null,
  matches smallint,
  primary key (set_id, position)
);

alter table public.quina_user_items
  add constraint quina_user_items_numbers_check
  check (array_length(numbers, 1) between 5 and 20);

-- RLS
alter table public.quina_user_sets enable row level security;
alter table public.quina_user_items enable row level security;

-- Owner policies
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_sets' and policyname = 'sel_own'
  ) then
    create policy sel_own on public.quina_user_sets
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_sets' and policyname = 'ins_own'
  ) then
    create policy ins_own on public.quina_user_sets
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_sets' and policyname = 'upd_own'
  ) then
    create policy upd_own on public.quina_user_sets
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_sets' and policyname = 'del_own'
  ) then
    create policy del_own on public.quina_user_sets
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_items' and policyname = 'sel_items_own'
  ) then
    create policy sel_items_own on public.quina_user_items
      for select
      to authenticated
      using (exists (select 1 from public.quina_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_items' and policyname = 'ins_items_own'
  ) then
    create policy ins_items_own on public.quina_user_items
      for insert
      to authenticated
      with check (exists (select 1 from public.quina_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_items' and policyname = 'upd_items_own'
  ) then
    create policy upd_items_own on public.quina_user_items
      for update
      to authenticated
      using (exists (select 1 from public.quina_user_sets s where s.id = set_id and s.user_id = auth.uid()))
      with check (exists (select 1 from public.quina_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quina_user_items' and policyname = 'del_items_own'
  ) then
    create policy del_items_own on public.quina_user_items
      for delete
      to authenticated
      using (exists (select 1 from public.quina_user_sets s where s.id = set_id and s.user_id = auth.uid()));
  end if;
end $$;

commit;


