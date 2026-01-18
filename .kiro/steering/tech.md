# Technology Stack

## Core Framework

- **Next.js 15** (App Router) - React framework with server-side rendering
- **React 18** - UI library
- **TypeScript 5** - Type-safe JavaScript

## State Management

- **Redux Toolkit** - Global state management
- **React Context** - Auth and theme providers

## Styling & UI

- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Icon library
- **class-variance-authority (cva)** - Component variant management
- **tailwind-merge** - Utility for merging Tailwind classes

## Backend & Database

- **Supabase** - PostgreSQL database with authentication
- **Supabase Auth** - JWT-based authentication with cookies
- **pgvector** - Vector embeddings for AI features
- **Next.js API Routes** - Serverless API endpoints

## Document Editing

- **Tiptap** - Rich text editor with extensions
- **Tiptap Pro Extensions** - AI, import/export capabilities
- **PDF.js** - PDF rendering and parsing
- **Mammoth** - DOCX to HTML conversion
- **pdf-lib** - PDF manipulation

## Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Storybook** - Component development and documentation

## Deployment

- **Vercel** - Hosting and deployment platform
- **Vercel Analytics** - Usage tracking

## Common Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)

# Build
npm run build        # Create production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Database
./scripts/gen-types.sh       # Generate TypeScript types from Supabase schema
./scripts/apply-migration.sh # Apply database migrations
```

## Environment Variables

Required environment variables (see `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Auth redirect URL
