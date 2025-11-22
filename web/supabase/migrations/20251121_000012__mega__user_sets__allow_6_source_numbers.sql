-- Title: Allow 6..15 source numbers in megasena_user_sets
-- Description: Relax check constraint to allow manual-only sets with 6 numbers.
-- Affects: public.megasena_user_sets (constraint)
-- Dependencies: 20251120_000006__mega__games__schema.sql
-- Idempotent: yes
-- Rollback: alter table public.megasena_user_sets drop constraint if exists megasena_user_sets_source_numbers_check; alter table public.megasena_user_sets add constraint megasena_user_sets_source_numbers_check check (array_length(source_numbers, 1) between 7 and 15);
-- Author: system | CreatedAt: 2025-11-21 00:02:00Z

alter table if exists public.megasena_user_sets
  drop constraint if exists megasena_user_sets_source_numbers_check;

alter table public.megasena_user_sets
  add constraint megasena_user_sets_source_numbers_check
  check (array_length(source_numbers, 1) between 6 and 15);


