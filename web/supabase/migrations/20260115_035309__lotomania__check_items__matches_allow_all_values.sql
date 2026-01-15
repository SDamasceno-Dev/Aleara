-- Migration: 20260115_035309__lotomania__check_items__matches_allow_all_values
-- Title: Lotomania check_items matches allow all values
-- Description: Remove constraint that limits matches to 15-20, allowing all values (0-50) to be saved. This enables displaying zero matches in the UI.
-- Affects: public.lotomania_check_items
-- Dependencies: 20260114_082424__lotomania__checks__schema
-- Idempotent: yes
-- Rollback: alter table public.lotomania_check_items add constraint lotomania_check_items_matches_check check (matches between 15 and 20);
-- Author: system | CreatedAt: 2026-01-15 03:53:09Z

begin;

-- Drop the constraint that limits matches to 15-20
alter table public.lotomania_check_items
  drop constraint if exists lotomania_check_items_matches_check;

-- Add a new constraint that allows values from 0 to 50 (the maximum possible matches)
alter table public.lotomania_check_items
  add constraint lotomania_check_items_matches_check
  check (matches >= 0 and matches <= 50);

commit;
