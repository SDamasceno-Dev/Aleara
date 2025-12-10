-- Title: Quina user sets add title and marked_idx
-- Description: Adds optional metadata fields for naming saved combination sets and tracking a marked index from the source numbers UI.

alter table if exists public.quina_user_sets
  add column if not exists title text,
  add column if not exists marked_idx integer;

comment on column public.quina_user_sets.title is 'Optional user-provided name for this set of generated combinations.';
comment on column public.quina_user_sets.marked_idx is 'Optional index (0-based) of the marked source number in the UI.';


