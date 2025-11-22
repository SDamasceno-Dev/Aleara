-- Title: Primary key change to (check_id, numbers) on megasena_check_items
-- Description: Remove PK on (check_id, position) to avoid conflicts when consolidating sets in same contest.
-- Affects: public.megasena_check_items (constraints, indexes)
-- Dependencies: 20251120_000007__mega__checks__schema.sql
-- Idempotent: yes
-- Rollback: alter table public.megasena_check_items drop constraint if exists megasena_check_items_pkey; alter table public.megasena_check_items add primary key (check_id, position);
-- Author: system | CreatedAt: 2025-11-21 00:01:40Z

begin;

alter table if exists public.megasena_check_items
  drop constraint if exists megasena_check_items_pkey;

drop index if exists ux_megasena_check_items_check_numbers;

alter table public.megasena_check_items
  add primary key (check_id, numbers);

commit;


