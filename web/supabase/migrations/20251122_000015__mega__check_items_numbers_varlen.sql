-- Title: Make megasena_check_items.numbers variable-length (6..20)
-- Description: Change numbers from smallint[6] to smallint[] and add length check.
-- Affects: public.megasena_check_items
-- Dependencies: 20251120_000007__mega__checks__schema.sql, 20251120_000011__mega__check_items__pk_change.sql
-- Idempotent: yes
-- Rollback: alter table public.megasena_check_items alter column numbers type smallint[6] using numbers[1:6];
-- Author: system | CreatedAt: 2025-11-22 00:20:10Z

begin;

alter table if exists public.megasena_check_items
  alter column numbers type smallint[] using numbers;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'megasena_check_items_numbers_len_check'
      and conrelid = 'public.megasena_check_items'::regclass
  ) then
    alter table public.megasena_check_items
      add constraint megasena_check_items_numbers_len_check
      check (array_length(numbers, 1) between 6 and 20);
  end if;
end$$;

commit;


