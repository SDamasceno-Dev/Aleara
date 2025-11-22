-- Title: Allow non-negative sample_size in megasena_user_sets
-- Description: Relax sample_size check to >= 0 so sets criados manualmente podem iniciar com 0.
-- Affects: public.megasena_user_sets (constraint)
-- Dependencies: 20251120_000006__mega__games__schema.sql
-- Idempotent: yes
-- Rollback: alter table public.megasena_user_sets drop constraint if exists megasena_user_sets_sample_size_check; alter table public.megasena_user_sets add constraint megasena_user_sets_sample_size_check check (sample_size > 0);
-- Author: system | CreatedAt: 2025-11-22 00:10:00Z

alter table if exists public.megasena_user_sets
  drop constraint if exists megasena_user_sets_sample_size_check;

alter table public.megasena_user_sets
  add constraint megasena_user_sets_sample_size_check
  check (sample_size >= 0);


