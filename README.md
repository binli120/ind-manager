# FilynAI IND Manager

FilynAI IND Manager is a Next.js application for IND submission workflows: document authoring, review, gap analysis, project coordination, and regulated team operations.

## What This App Contains
- Next.js App Router frontend (`app/`, `components/`)
- Route handlers for auth/admin/project/S3/NCD APIs (`app/api/**/route.ts`)
- Supabase-backed auth + data access (`lib/supabase`)
- Redux Toolkit state layer (`lib/store`)
- TipTap-based document editing and analysis-related utilities

## Tech Stack
- Next.js 15 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- Redux Toolkit
- Supabase (Auth + Postgres)
- AWS S3 integration for project document trees

## Quick Start
### Prerequisites
- Node.js 20+
- pnpm 10+
- Supabase project + keys
- (Optional) Supabase CLI for migrations/types

### Install
```bash
pnpm install
```

### Configure Environment
Create `.env.local` and set the required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY`)
- `NEXT_PUBLIC_AUTH_REDIRECT_URL`

For full env documentation, see `/Users/blee/dev/bin/ind-manager/ENV_VARS.md`.

### Run
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000).

## Code Structure

```text
app/
  (pages)/                  UI routes (workspace/admin/submission/analysis/design)
  api/                      Server route handlers (14 route modules)
  auth/                     Auth pages (login, reset, signup)
  layout.tsx                Root layout
  middleware.ts             Auth/session route protection

components/                 Feature and shared UI components
hooks/                      Reusable React hooks
lib/
  common/                   Route constants, shared helpers
  supabase/                 Supabase clients + typed schema
  rate-limit/               Request throttling helpers
  store/                    Redux slices, mappers, API adapters
  projects/, users/, ...    Feature services/repositories/view models

mock/                       Mock dataset used by `/api/mock/projects`
scripts/                    Operational scripts (migrations, type generation, utilities)
supabase/
  config.toml               Supabase project config
  migrations/               SQL migrations (tracked in git)
```

## Critical Commands

### Build + Run
```bash
pnpm build
pnpm start
```

### Lint + Fix
```bash
pnpm lint
pnpm lint:fix
```

### Test
```bash
pnpm test
pnpm test:watch
pnpm run test:api
```

`test:api` is the critical API route security/regression suite and collects coverage for `app/api/**/route.ts`.

### Targeted Test Debugging
```bash
pnpm exec jest app/api/__tests__/security-routes.test.ts
pnpm exec jest app/api/__tests__/proxy-and-s3-routes.test.ts
pnpm exec jest lib/rate-limit/__tests__/rate-limit-helpers.test.ts
```

### Type/Compile Sanity Check
```bash
pnpm exec tsc --noEmit
```

### Supabase Operations
```bash
bash scripts/apply-migration.sh
bash scripts/gen-types.sh
```

Use this order for schema changes:
1. Create/edit SQL migration in `supabase/migrations/`
2. Apply migration
3. Regenerate `lib/supabase/schema.d.ts`

## API Surface (Route Handlers)
Primary route modules:
- `/api/auth`
- `/api/users`
- `/api/users/[id]`
- `/api/admin/proxy`
- `/api/admin/users/invite`
- `/api/admin/users/resend-invite`
- `/api/health`
- `/api/mock/projects`
- `/api/s3/new-project`
- `/api/projects/[projectId]/asset`
- `/api/projects/[projectId]/section-file`
- `/api/projects/[projectId]/sections`
- `/api/ncd/assets/section`
- `/api/ncd/assets/summary`

## Debug Playbook

### 1) Page/Route 404s
- Check route constants in `/Users/blee/dev/bin/ind-manager/lib/common/routes.ts`
- Confirm matching page file exists under `/Users/blee/dev/bin/ind-manager/app/(pages)/.../page.tsx`

### 2) Auth or Permission Failures
- Validate Supabase env vars and session cookies
- Inspect:
  - `/Users/blee/dev/bin/ind-manager/middleware.ts`
  - `/Users/blee/dev/bin/ind-manager/app/api/auth/route.ts`
  - `/Users/blee/dev/bin/ind-manager/lib/auth/`

### 3) API Request Failures
- Hit health endpoint: `GET /api/health`
- Run API test suite: `pnpm run test:api`
- Check route-specific handlers in `/Users/blee/dev/bin/ind-manager/app/api/**/route.ts`

### 4) S3/Document Tree Issues
- Verify `AWS_REGION`, `DOC_REPOSITORY_BUCKET`, AWS credentials
- Inspect:
  - `/Users/blee/dev/bin/ind-manager/app/api/projects/[projectId]/sections/route.ts`
  - `/Users/blee/dev/bin/ind-manager/app/api/projects/[projectId]/asset/route.ts`
  - `/Users/blee/dev/bin/ind-manager/app/api/projects/[projectId]/section-file/route.ts`

### 5) Schema Drift / DB Type Mismatch
- Ensure migration file exists in `supabase/migrations/`
- Re-apply migration and regenerate types
- Do not change `lib/supabase/schema.d.ts` without a matching migration

## Additional Docs
- Architecture: `/Users/blee/dev/bin/ind-manager/ARCHITECTURE.md`
- Environment variables: `/Users/blee/dev/bin/ind-manager/ENV_VARS.md`
