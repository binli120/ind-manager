Supabase migrations live in this directory and must be committed with schema changes.

Workflow:
1. Create a migration: `supabase migration new <short_name>`
2. Edit the generated SQL file in this folder.
3. Apply it: `bash scripts/apply-migration.sh`
4. Regenerate types: `bash scripts/gen-types.sh`

Rule: never change `lib/supabase/schema.d.ts` without a matching migration in this folder.
