# Migrations convention

File name format:

- `YYYYMMDD_HHMMSS__domain__target__action.sql`
- Example: `20251120_000007__mega__checks__schema.sql`

Header block at the top of every file:

```
-- Title: <short and clear>
-- Description: <what + why (1-3 lines)>
-- Affects: <schemas/objects>
-- Dependencies: <other migrations/functions> | none
-- Idempotent: <yes/no>
-- Rollback: <steps or brief SQL> | n/a
-- Author: <name/alias> | CreatedAt: <YYYY-MM-DD HH:MM:SSZ>
```

General rules:

- Prefer idempotent guards (`if not exists`, `drop ... if exists`, `do $$ begin if not exists (...) then ... end if; end $$;`).
- Wrap multi-statement structural changes with `begin; ... commit;`.
- RLS: enable RLS and create policies for `select/insert/update/delete` with `USING` and `WITH CHECK` symmetric.
- Object naming:
  - Primary key: `pk_<table>`
  - Foreign key: `fk_<table>_<col>__<ref>`
  - Unique: `uq_<table>_<cols>`
  - Index: `ix_<table>__<cols>` (or `ux_...` when unique)
  - Policy: `<table>_<action>_<scope>`
  - Trigger: `trg_<table>_<event>_<purpose>`
  - Function: `fn_<domain>_<purpose>`
