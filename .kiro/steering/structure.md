# Project Structure

## Directory Organization

```
/app                    # Next.js App Router (pages and API routes)
  /api                  # API route handlers
    /auth               # Authentication endpoints
    /users              # User management endpoints
    /database           # Database operations
    /health             # Health check endpoints
    /mock               # Mock data endpoints
  /auth                 # Auth pages (login, signup, reset password)
  /protected            # Protected/authenticated pages
  globals.css           # Global styles
  layout.tsx            # Root layout
  page.tsx              # Home page

/components             # React components
  /auth                 # Auth-related components (guards, providers, forms)
  /gap-analysis         # Gap analysis dashboard components
  /section-editor       # Document editor components
  /ui                   # Reusable UI components (shadcn/ui)
    /projects           # Project-specific UI
    /teams              # Team management UI
    /tenants            # Tenant management UI
    /users              # User management UI
  /providers            # Context providers (Redux, theme)

/lib                    # Utility libraries and configurations
  /common               # Shared utilities (logger, types)
  /metadata             # Metadata definitions
  /section-editor       # Editor utilities
  /store                # Redux store configuration
    /slices             # Redux slices (auth, projects, teams, documents, ui)
  /supabase             # Supabase client configurations
    client.ts           # Browser client
    server.ts           # Server-side client
    middleware.ts       # Auth middleware
    schema.d.ts         # Database type definitions

/hooks                  # Custom React hooks
  useLogger.ts          # Logging hook
  useProject.ts         # Project management hook
  useTeam.ts            # Team management hook
  useToast.ts           # Toast notification hook

/types                  # TypeScript type definitions
/utils                  # Utility functions and constants
/config                 # Configuration files
/scripts                # Build and deployment scripts
/public                 # Static assets
/styles                 # Additional stylesheets
/mock                   # Mock data for development

middleware.ts           # Next.js middleware (auth protection)
```

## Key Conventions

### File Naming
- **Components**: kebab-case (e.g., `auth-provider.tsx`, `user-menu.tsx`)
- **API Routes**: kebab-case folders with `route.ts` files
- **Hooks**: camelCase with `use` prefix (e.g., `useLogger.ts`)
- **Types**: camelCase (e.g., `section.ts`)
- **Utilities**: camelCase (e.g., `validatePassword.ts`)

### Component Structure
- Use `'use client'` directive for client components
- Server components by default (no directive needed)
- Export named components with React.forwardRef for UI components
- Use TypeScript interfaces for props

### State Management
- Redux slices in `/lib/store/slices`
- Use `createAsyncThunk` for async operations
- Export actions and reducer from each slice
- Use `useAppDispatch` and `useAppSelector` hooks

### API Routes
- RESTful conventions (GET, POST, PUT, DELETE)
- Return `NextResponse.json()` with appropriate status codes
- Use `createServerClient()` for database access
- Handle errors with try-catch and return error responses

### Styling
- Tailwind utility classes for styling
- Use `cn()` utility from `@/lib/utils` to merge classes
- Component variants with `cva` (class-variance-authority)
- Dark mode support via `next-themes`

### Path Aliases
- `@/*` maps to project root (configured in `tsconfig.json`)
- Example: `import { Button } from '@/components/ui/button'`

### Authentication
- Protected routes use middleware (`middleware.ts`)
- Client-side auth guard: `<AuthGuard>` component
- Auth context via `<AuthProvider>` and `useAuth()` hook
- Session management with Supabase cookies

### Database Access
- Use Supabase client (`createClient()` or `createServerClient()`)
- Type-safe queries with generated types (`schema.d.ts`)
- Row-Level Security (RLS) policies enforced at database level
