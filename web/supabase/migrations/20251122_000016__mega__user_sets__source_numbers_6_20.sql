-- Title: Allow 6..20 source_numbers in megasena_user_sets
-- Description: Relax source_numbers length check to support manual bets with up to 20 numbers.
-- Affects: public.megasena_user_sets (constraint)
-- Dependencies: 20251121_000012__mega__user_sets__allow_6_source_numbers.sql
-- Idempotent: yes
-- Rollback: alter table public.megasena_user_sets drop constraint if exists megasena_user_sets_source_numbers_check; alter table public.megasena_user_sets add constraint megasena_user_sets_source_numbers_check check (array_length(source_numbers, 1) between 6 and 15);
-- Author: system | CreatedAt: 2025-11-22 00:36:00Z

alter table if exists public.megasena_user_sets
  drop constraint if exists megasena_user_sets_source_numbers_check;

alter table public.megasena_user_sets
  add constraint megasena_user_sets_source_numbers_check
  check (array_length(source_numbers, 1) between 6 and 20);


