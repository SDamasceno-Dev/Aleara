-- Title: Mega-Sena checks (saved evaluation results) with RLS
-- Description: Persists user's saved evaluations (checks) by contest and the checked items.
-- Affects: public.megasena_checks, public.megasena_check_items, policies, indexes
-- Dependencies: public.megasena_user_sets; auth; public.is_admin() (for consistency)
-- Idempotent: yes
-- Rollback: drop table public.megasena_check_items cascade; drop table public.megasena_checks cascade;
-- Author: system | CreatedAt: 2025-11-21 00:01:00Z

create table if not exists public.megasena_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  set_id uuid not null references public.megasena_user_sets(id) on delete cascade,
  contest_no integer not null,
  draw_numbers smallint[6] not null,
  checked_at timestamptz not null default now()
);

create table if not exists public.megasena_check_items (
  check_id uuid not null references public.megasena_checks(id) on delete cascade,
  position integer not null,
  numbers smallint[6] not null,
  matches smallint not null,
  primary key (check_id, position)
);

create index if not exists megasena_checks_user_idx on public.megasena_checks (user_id, checked_at desc);
create index if not exists megasena_check_items_check_idx on public.megasena_check_items (check_id, position);

alter table public.megasena_checks enable row level security;
alter table public.megasena_check_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_checks' and policyname='checks_select_own'
  ) then
    create policy checks_select_own on public.megasena_checks for select
      to authenticated
      using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_checks' and policyname='checks_ins_own'
  ) then
    create policy checks_ins_own on public.megasena_checks for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_checks' and policyname='checks_del_own'
  ) then
    create policy checks_del_own on public.megasena_checks for delete
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_check_items' and policyname='check_items_select_own'
  ) then
    create policy check_items_select_own on public.megasena_check_items for select
      to authenticated
      using (exists (select 1 from public.megasena_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_check_items' and policyname='check_items_ins_own'
  ) then
    create policy check_items_ins_own on public.megasena_check_items for insert
      to authenticated
      with check (exists (select 1 from public.megasena_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='megasena_check_items' and policyname='check_items_del_own'
  ) then
    create policy check_items_del_own on public.megasena_check_items for delete
      to authenticated
      using (exists (select 1 from public.megasena_checks c where c.id = check_id and c.user_id = auth.uid()));
  end if;
end$$;


