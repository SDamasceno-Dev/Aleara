### Allowed Emails (Admin Allowlist)

How to apply (choose one):

1. Supabase SQL Editor

- Open your project's SQL editor.
- Paste the contents of `migrations/20251115_000001_allowed_emails.sql`.
- Run it once (it's idempotent).

2. Supabase CLI

- Ensure CLI is authenticated and linked to the project.
- From `web/`, run:
  - `supabase db push` (if you adopt full migration flow), or
  - `supabase db query supabase/migrations/20251115_000001_allowed_emails.sql`

What it does:

- Enables `citext` and `pg_trgm`
- Creates `public.allowed_emails (email citext primary key, created_at, created_by)`
- Adds trigram index for fast substring search: `lower(email) gin_trgm_ops`
- Enables RLS and restricts SELECT/INSERT/DELETE to `public.is_admin()`

Expected checks:

- As ADMIN: SELECT/INSERT/DELETE succeed
- As USER: all operations denied
- Searches with `lower(email) ilike '%term%'` are fast for lists at scale
