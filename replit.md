# FinalCode

## Overview

FinalCode is an AI-powered "vibe coding" platform that allows users to build web applications by describing what they want in natural language. The platform combines a browser-based code editor with AI code generation, live preview, and deployment capabilities.

**Core Purpose:** Enable users to create, edit, preview, and deploy web applications using AI assistance, all within a browser-based IDE.

**Key Capabilities:**
- AI-powered fullstack code generation (supports OpenAI and Anthropic models)
- Generate frontend (HTML, CSS, JS) and backend (Node.js, Express, SQLite, JWT auth)
- CodeMirror-based code editor with syntax highlighting
- Nested file tree for fullstack project structures
- Live preview with React/JSX support via Babel
- In-browser JavaScript execution using WebContainers (npm install, server start)
- Project persistence via Supabase
- **Chat history persistence** - AI conversation messages stored in database per project
- **Project checkpoints/rollback** - Automatic snapshots when AI generates code, with rollback support
- Subscription billing via Stripe
- One-click deployment to Cloudflare Pages
- Replit-style Git panel with GitHub integration (pull, push, fetch, sync)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** Next.js 14 with App Router (located in `/frontend`)
- React 18 with TypeScript
- Tailwind CSS for styling with a dark, Replit-inspired theme
- CodeMirror 6 for the code editor
- WebContainers API for in-browser Node.js execution

**Key Design Patterns:**
- Server Components for auth-protected routes with client components for interactive UI
- Server Actions for authentication flows (`/app/actions/auth.ts`)
- Custom hooks for cross-cutting concerns (debouncing, keyboard shortcuts, cross-origin isolation detection)
- Modal-based UI for settings, projects, and AI configuration

**Special Headers Required:** The app requires COOP/COEP headers for WebContainers support, configured in both `middleware.ts` and `next.config.js`.

### Backend Architecture

**Primary Backend:** Next.js API Routes (serverless)
- `/api/ai/chat` - Managed AI mode with server-side API keys
- `/api/stripe/*` - Stripe payment processing
- `/api/usage` - Usage tracking and limits
- `/api/deploy` - Cloudflare Pages deployment
- `/api/preview` - Temporary preview link generation

**Secondary Backend:** FastAPI server in `/backend` (minimal, primarily for health checks)

### AI Integration

**Dual-Mode Architecture:**
1. **Managed Mode (default):** Server-side API keys with per-user rate limits and daily caps
2. **BYOK Mode (optional):** User-provided keys stored only in browser localStorage

**Supported Providers:**
- OpenAI (GPT-5.2, GPT-4.1, GPT-4o)
- Anthropic (Claude Opus 4.5, Claude Sonnet 4, Claude 3.5 Sonnet/Haiku)

Settings and API keys for BYOK mode are stored client-side in localStorage (`finalcode:ai_settings_v2`).

### Data Storage

**Database:** Supabase (PostgreSQL)
- Normalized schema with `projects` and `project_files` tables
- `chat_messages` table for AI conversation history per project
- `project_checkpoints` table for rollback snapshots with JSONB file storage
- Row-Level Security (RLS) for user data isolation
- Subscriptions and usage tracking tables for monetization

**Client-Side Storage:**
- localStorage for AI settings, last project ID, and rate limiting state
- No sensitive data persisted client-side

### Authentication

**Provider:** Supabase Auth
- Email/password authentication
- GitHub OAuth
- Server-side session management via `@supabase/ssr`
- Auth callback handling at `/auth/callback`

**Graceful Degradation:** When Supabase environment variables are missing, the app redirects to `/admin-setup` with configuration instructions.

### Subscription & Billing

**Provider:** Stripe
- Three-tier model: Free, Pro ($15/mo), Team ($30/user/mo)
- Checkout sessions via `/api/stripe/checkout`
- Webhook handling for subscription lifecycle events
- Usage limits enforced per plan (projects, AI requests per day)

## External Dependencies

### Required Services
- **Supabase:** Authentication, database, and user management
  - Environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Optional Services
- **Stripe:** Payment processing and subscriptions
  - Environment: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`
  
- **OpenAI/Anthropic:** AI code generation (managed mode)
  - Environment: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
  
- **Cloudflare Pages:** Deployment target
  - Environment: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

- **Sentry:** Error tracking
  - Environment: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`

- **Vercel Analytics:** Usage analytics (auto-enabled on Vercel deployment)

### Key NPM Dependencies
- `@webcontainer/api` - In-browser Node.js runtime
- `@supabase/ssr` - Server-side Supabase client
- `codemirror` / `@codemirror/*` - Code editor
- `stripe` / `@stripe/stripe-js` - Payment integration
- `@sentry/nextjs` - Error monitoring
- `react-markdown` - Markdown rendering in AI chat