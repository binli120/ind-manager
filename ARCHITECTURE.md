# IND-Manager-V2 Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT LAYER                                        │
│                              (Browser / User Interface)                              │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                                      │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                          React Components (64)                              │    │
│  │                                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │  Workspace   │  │   Projects   │  │    Teams     │  │  Documents   │  │    │
│  │  │   Layout     │  │     View     │  │     View     │  │     View     │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │ Submission   │  │     Gap      │  │    Review    │  │   Calendar   │  │    │
│  │  │     View     │  │   Analysis   │  │    Center    │  │     View     │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                                             │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐   │    │
│  │  │                     UI Components (shadcn/ui)                       │   │    │
│  │  │  Button, Input, Dialog, Table, Select, Toast, Calendar, etc.       │   │    │
│  │  └────────────────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                       │                                             │
│                                       ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                          State Management (Redux)                           │    │
│  │                                                                             │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │    │
│  │  │  Auth   │  │Projects │  │  Teams  │  │Documents│  │   UI    │         │    │
│  │  │  Slice  │  │  Slice  │  │  Slice  │  │  Slice  │  │  Slice  │         │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │    │
│  │       │             │             │             │             │            │    │
│  └───────┼─────────────┼─────────────┼─────────────┼─────────────┼────────────┘    │
│          │             │             │             │             │                 │
│  ┌───────┴─────────────┴─────────────┴─────────────┴─────────────┴────────────┐    │
│  │                          Custom Hooks Layer                                 │    │
│  │                    useLogger, useToast, use*                                │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│         Technology Stack: Next.js 14, React 18, TypeScript, Tailwind CSS            │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                       │
│                           (Next.js App Router & Routing)                             │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                          Next.js Middleware                                 │    │
│  │                     (Session Updates & Auth Protection)                     │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                       │                                             │
│                                       ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                          Route Handlers                                     │    │
│  │                                                                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │   Auth   │  │  Public  │  │Protected │  │   API    │  │  Static  │    │    │
│  │  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │  │  Assets  │    │    │
│  │  │ /auth/*  │  │    /     │  │/protected│  │  /api/*  │  │ /public  │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               API / SERVICE LAYER                                    │
│                             (Backend Business Logic)                                 │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                          API Endpoints (/app/api)                           │    │
│  │                                                                             │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │    │
│  │  │   /api/auth     │  │   /api/users    │  │  /api/database  │           │    │
│  │  │  ────────────   │  │  ────────────   │  │  ────────────   │           │    │
│  │  │  • Sign up      │  │  • Get users    │  │  • Select       │           │    │
│  │  │  • Sign in      │  │  • Create user  │  │  • Insert       │           │    │
│  │  │  • Sign out     │  │  • Update user  │  │  • Update       │           │    │
│  │  │  • Get user     │  │  • Delete user  │  │  • Delete       │           │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘           │    │
│  │                                                                             │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │    │
│  │  │                    /api/health                                       │  │    │
│  │  │             Database connection health checks                        │  │    │
│  │  └─────────────────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                       │                                             │
│                                       ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                    Supabase Client Layer                                    │    │
│  │                                                                             │    │
│  │  ┌────────────────────┐              ┌────────────────────┐               │    │
│  │  │  Browser Client    │              │   Server Client    │               │    │
│  │  │  (client.ts)       │              │   (server.ts)      │               │    │
│  │  │  • Client queries  │              │  • SSR queries     │               │    │
│  │  │  • Real-time subs  │              │  • Cookie handling │               │    │
│  │  └────────────────────┘              └────────────────────┘               │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│         Technology Stack: Next.js API Routes, Supabase JS Client                    │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                              │
│                        (Database & Storage)                                          │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                    Supabase PostgreSQL Database                             │    │
│  │                                                                             │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐     │    │
│  │  │                    Core Domain Tables                              │     │    │
│  │  │                                                                    │     │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │     │    │
│  │  │  │    users     │  │    teams     │  │  user_teams  │           │     │    │
│  │  │  │ ──────────── │  │ ──────────── │  │ ──────────── │           │     │    │
│  │  │  │  • id        │  │  • id        │  │  • user_id   │           │     │    │
│  │  │  │  • email     │  │  • name      │  │  • team_id   │           │     │    │
│  │  │  │  • name      │  │  • creator   │  │  • role      │           │     │    │
│  │  │  │  • avatar    │  │  • settings  │  │  • joined_at │           │     │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘           │     │    │
│  │  │                                                                    │     │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │     │    │
│  │  │  │   projects   │  │ ectd_documents│ │  ectd_nodes  │           │     │    │
│  │  │  │ ──────────── │  │ ──────────── │  │ ──────────── │           │     │    │
│  │  │  │  • id        │  │  • id        │  │  • id        │           │     │    │
│  │  │  │  • drug_name │  │  • project   │  │  • parent_id │           │     │    │
│  │  │  │  • sponsor   │  │  • version   │  │  • path      │           │     │    │
│  │  │  │  • team_id   │  │  • content   │  │  • type      │           │     │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘           │     │    │
│  │  └───────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐     │    │
│  │  │              Collaboration & Document Management                   │     │    │
│  │  │                                                                    │     │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │     │    │
│  │  │  │ section_locks   │  │ document_       │  │ document_       │  │     │    │
│  │  │  │                 │  │ comment_threads │  │ comments        │  │     │    │
│  │  │  │  • section_id   │  │  • document_id  │  │  • thread_id    │  │     │    │
│  │  │  │  • locked_by    │  │  • created_by   │  │  • author_id    │  │     │    │
│  │  │  │  • locked_at    │  │  • resolved     │  │  • content      │  │     │    │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │     │    │
│  │  └───────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐     │    │
│  │  │              Compliance & AI Analysis                              │     │    │
│  │  │                                                                    │     │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │     │    │
│  │  │  │ compliance_     │  │ prompt_         │  │ prompt_         │  │     │    │
│  │  │  │ checks          │  │ templates       │  │ analysis_results│  │     │    │
│  │  │  │  • project_id   │  │  • name         │  │  • project_id   │  │     │    │
│  │  │  │  • status       │  │  • content      │  │  • readiness    │  │     │    │
│  │  │  │  • results      │  │  • version      │  │  • gaps         │  │     │    │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │     │    │
│  │  │                                                                    │     │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐                        │     │    │
│  │  │  │   ind_docs      │  │  prompt_        │                        │     │    │
│  │  │  │  (Knowledge)    │  │  experiments    │                        │     │    │
│  │  │  │  • content      │  │  • variants     │                        │     │    │
│  │  │  │  • embedding    │  │  • metrics      │                        │     │    │
│  │  │  │  • metadata     │  │  • analytics    │                        │     │    │
│  │  │  └─────────────────┘  └─────────────────┘                        │     │    │
│  │  └───────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐     │    │
│  │  │                   Security & Extensions                            │     │    │
│  │  │                                                                    │     │    │
│  │  │  • Row-Level Security (RLS) Policies                              │     │    │
│  │  │  • pgvector Extension (Embeddings)                                │     │    │
│  │  │  • Helper Functions: is_team_member(), match_ind_docs()           │     │    │
│  │  └───────────────────────────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                         Supabase Auth Service                               │    │
│  │                 (JWT Tokens, Session Management, RLS)                       │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│         Technology Stack: PostgreSQL, Supabase, pgvector                            │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES LAYER                                     │
│                                                                                      │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐           │
│  │      Tiptap        │  │   CloudConvert     │  │  Vercel Analytics  │           │
│  │  Document Server   │  │   File Conversion  │  │   Usage Tracking   │           │
│  │  ──────────────    │  │   ──────────────   │  │   ──────────────   │           │
│  │  • Document edit   │  │  • Format convert  │  │  • Page views      │           │
│  │  • Collaboration   │  │  • API integration │  │  • User analytics  │           │
│  │  • Real-time sync  │  │                    │  │                    │           │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

User Action (Browser)
        │
        ▼
┌────────────────────┐
│ React Component    │ ──┐
│ (e.g., ProjectView)│   │
└────────────────────┘   │
        │                │
        ▼                │
┌────────────────────┐   │
│ Dispatch Redux     │   │ Client-Side Rendering
│ Action/Thunk       │   │ (React + Redux)
└────────────────────┘   │
        │                │
        ▼                │
┌────────────────────┐   │
│ Redux Middleware   │ ──┘
└────────────────────┘
        │
        ├─────────────────┬─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Route   │  │   Supabase   │  │  External    │
│  /api/*      │  │   Client     │  │  Service     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 │
┌──────────────────────────────┐           │
│   Supabase Server Client     │           │
│   (SSR with Cookies)         │           │
└──────────────────────────────┘           │
        │                                   │
        ▼                                   │
┌──────────────────────────────┐           │
│  PostgreSQL Database         │           │
│  (with RLS Policies)         │           │
└──────────────────────────────┘           │
        │                                   │
        ▼                                   ▼
┌──────────────────────────────────────────────┐
│            Response Data                     │
└──────────────────────────────────────────────┘
        │
        ▼
┌────────────────────┐
│  Redux Store       │
│  State Update      │
└────────────────────┘
        │
        ▼
┌────────────────────┐
│  Component         │
│  Re-render         │
└────────────────────┘
        │
        ▼
┌────────────────────┐
│  Updated UI        │
│  (User sees result)│
└────────────────────┘
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

User navigates to /protected
        │
        ▼
┌────────────────────────┐
│ Next.js Middleware     │
│ (middleware.ts)        │ ───────► No session? ───► Redirect to /auth/login
└────────────────────────┘
        │
        │ Has valid session
        ▼
┌────────────────────────┐
│ Update session cookie  │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ Allow access to page   │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ Auth Guard Component   │ ───────► Verify auth state ───► Show loading/redirect
│ (client-side check)    │
└────────────────────────┘
        │
        │ Authenticated
        ▼
┌────────────────────────┐
│ Render protected page  │
└────────────────────────┘


Login Flow:
User submits credentials ──► /api/auth (POST) ──► Supabase Auth
                                                        │
                                                        ▼
                                              Create session + JWT
                                                        │
                                                        ▼
                                              Set secure cookies
                                                        │
                                                        ▼
                                              Return user data
                                                        │
                                                        ▼
                                           Update Redux authSlice
                                                        │
                                                        ▼
                                           Redirect to dashboard
```

## Document Collaboration Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      REAL-TIME COLLABORATION FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

User A opens document
        │
        ▼
┌──────────────────────┐
│ Fetch document data  │ ──► Redux documentsSlice
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ User A clicks "Edit  │
│ Section 2.5"         │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ Dispatch lockSection │ ──► /api/documents/lock
│ action               │           │
└──────────────────────┘           ▼
        │                   Insert section_locks row
        │                   (user_id, section_id, timestamp)
        │                          │
        │◄─────────────────────────┘
        │ Lock acquired
        ▼
┌──────────────────────┐
│ Enable editing UI    │
└──────────────────────┘
        │
        │ User B tries to edit same section
        ▼                          │
┌──────────────────────┐          │
│ User B clicks "Edit  │          │
│ Section 2.5"         │◄─────────┘
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ Check section_locks  │ ──► Section locked by User A
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ Show "Locked by      │
│ User A" message      │
└──────────────────────┘


User A saves changes
        │
        ▼
┌──────────────────────┐
│ Update document_     │
│ sources table        │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ Create new version   │ ──► ectd_document_versions
│ entry                │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ Release lock         │ ──► Delete from section_locks
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ Broadcast update to  │
│ other users          │
└──────────────────────┘
```

## Key Features Summary

| Feature | Components | Data Layer | External Services |
|---------|-----------|------------|------------------|
| **User Management** | auth-guard, login/signup | users, user_teams | Supabase Auth |
| **Team Collaboration** | teams-view, sidebar | teams, team_settings, team_invites | - |
| **Project Management** | projects-view, data-table | projects, project_settings | - |
| **Document Editing** | document-view, comments-panel | ectd_documents, document_sources | Tiptap Server |
| **Real-time Collaboration** | section locks, comments | section_locks, document_comments | - |
| **Gap Analysis** | gap-analysis-view, gap-scoring-view | prompt_analysis_results, compliance_checks | - |
| **IND Submission** | ind-submission-view, submission-view | projects, ectd_nodes | - |
| **Review Center** | review-center-view | document_comment_threads, document_roles | - |
| **AI Analysis** | prompt templates | ind_docs (embeddings), prompt_* tables | pgvector |
| **File Conversion** | document upload | ectd_documents | CloudConvert API |
| **Analytics** | All views | - | Vercel Analytics |

## Technology Stack Summary

```
Frontend:       Next.js 14 + React 18 + TypeScript
State:          Redux Toolkit
Styling:        Tailwind CSS 4 + shadcn/ui + Radix UI
Backend:        Next.js API Routes (Serverless)
Database:       PostgreSQL (Supabase)
Auth:           Supabase Auth (JWT + Cookies)
Vector Search:  pgvector
Document Edit:  Tiptap
File Convert:   CloudConvert
Deployment:     Vercel
Analytics:      Vercel Analytics
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                             SECURITY LAYERS                                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

Layer 1: Network & Transport
├── HTTPS encryption
└── Secure cookie attributes (httpOnly, secure, sameSite)

Layer 2: Application Middleware
├── Next.js middleware (session validation)
├── Auth Guard component (client-side)
└── API route authentication checks

Layer 3: Database Security
├── Row-Level Security (RLS) policies
│   ├── is_team_member(team_id) → checks user_teams
│   ├── is_team_creator(team_id) → checks teams.creator_id
│   └── document_role_check() → checks document_roles
│
├── Role-Based Access Control (RBAC)
│   ├── Team roles: owner, admin, member
│   └── Document roles: editor, reviewer, viewer
│
└── Secure queries via Supabase client

Layer 4: Authentication & Authorization
├── JWT tokens (issued by Supabase)
├── Session management (server-side cookies)
└── Token refresh mechanism

Layer 5: Data Protection
├── Environment variable encryption
├── API key management
└── Sensitive data masking
```
