# Filynai IND Manager

Filynai IND Manager is a Next.js app for managing IND submissions with a
workspace UI for projects, teams, documents, reviews, and gap analysis.
It uses Supabase for auth and data access and includes a document authoring
experience built on TipTap.

## Features
- Workspace views for projects, teams, calendar, submissions, review center, and gap analysis.
- Document authoring with section-based editing, comments, and PDF upload.
- IND submission and post-submission tracking views.
- Tenant and user admin screens (currently local state UI scaffolding).
- Supabase-backed auth and data access with middleware + client guard.
- Mock data mode for demo teams/projects (see "Mock data" below).

## Architecture
- Diagram and system notes live in `ARCHITECTURE.md`.

## Tech stack
- Next.js App Router, React 18, TypeScript
- Redux Toolkit for state management
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase (Postgres + Auth) with generated types
- TipTap editor + PDF utilities
- Vercel Analytics

## Project structure
- `app/`: Next.js routes, layouts, and API handlers.
- `components/`: UI, views, and feature components.
- `lib/`: data access, Redux store, and shared utilities.
- `scripts/`: Supabase tooling scripts.
- `supabase/`: Supabase config (migrations expected in `supabase/migrations`).
- `mock/`: mock API data (projects).

## Local development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with the required environment variables.
3. Start the dev server:
   ```bash
   npm run dev
   ```

Available scripts:
- `npm run dev`: start the dev server.
- `npm run build`: production build.
- `npm run build:bump`: increment build number in `config/build-number.json` (for example, `0.1.000` -> `0.1.001`).
- `npm run start`: run the production server.
- `npm run lint`: run Next.js linting.

## Build number workflow
- Build numbers are tracked in `config/build-number.json` under `buildNumber`.
- Format is `major.minor.patch` with a zero-padded patch value (for example, `0.1.000`).
- Start from `0.1.000`.
- On each merge to `main`, `.github/workflows/bump-build-on-main.yml` automatically increments patch (`0.1.000` -> `0.1.001`).
- For local/manual bumps, run `npm run build:bump`.

## Environment variables
Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key.
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (required for admin invite flow).
- `NEXT_PUBLIC_AUTH_REDIRECT_URL` - full app base URL used in auth emails (for example, `https://ind-manager-v2-dev.vercel.app`).

Optional:
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - override auth redirect URL in dev.
- `NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL` - PDF analysis API base URL (`local`: `http://localhost:8000`, `dev`: your ALB URL).
- `PDF_ANALYSIS_API_BASE_URL` - server-only override for PDF analysis API base URL.
- `NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES` - idle timeout in minutes (default `30`).
- `NEXT_PUBLIC_SESSION_WARNING_SECONDS` - warning countdown in seconds (default `60`).
- `TIPTAP_CONVERSION_APP_ID` - TipTap conversion app ID.
- `TIPTAP_CONVERSION_SECRET` - TipTap conversion secret.
- `CLOUDCONVERT_API_KEY` - CloudConvert API key.
- `TIPTAP_DOCUMENT_SERVER_SECRET_KEY` - TipTap document server secret.
- `OPENAI_API_KEY` - used by optional AI features.
- `NEXT_PUBLIC_LOG_LEVEL` - `debug|info|warn|error` (default is `debug` in dev).

Example template: `.env.example`

## API routes
- `POST /api/auth` - sign up/sign in/sign out (Supabase).
- `GET /api/auth` - get current user (Supabase).
- `GET /api/users` - list users (Supabase).
- `POST /api/users` - create user (Supabase).
- `GET/PUT/DELETE /api/users/[id]` - user CRUD (Supabase).
- `POST /api/admin/proxy` - scoped database proxy for users/tenants (Supabase, admin-only for mutations).
- `GET /api/health` - Supabase connectivity check.
- `GET /api/mock/projects` - mock projects data.

## Mock data
Projects can run in mock mode. In `lib/store/slices/projectsSlice.ts`, using
the `demo-team` workspace triggers project fetching via `GET /api/mock/projects`.
This is intended for UI scaffolding until Supabase data is fully wired.

## Supabase tooling
- Apply migrations:
  ```bash
  bash scripts/apply-migration.sh
  ```
  Requires the Supabase CLI and migrations in `supabase/migrations`.
- Generate typed schema:
  ```bash
  bash scripts/gen-types.sh
  ```
  Requires Supabase CLI and `PROJECT_ID` in `.env.local`.

## Deployment and operations
- Build: `npm run build`
- Start: `npm run start`
- Health check: `GET /api/health`
- Set the required env vars in your hosting provider (Vercel recommended).
- For Supabase schema changes, apply migrations before deploy.

## Ops notes
- Health check endpoint: `GET /api/health`.
- Auth protection is enforced by `middleware.ts` and `AuthGuard`.
- Deploys cleanly to Vercel or any Node hosting that supports Next.js.
