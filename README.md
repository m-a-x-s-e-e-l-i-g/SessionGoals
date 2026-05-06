# SessionGoals

SessionGoals is a SvelteKit app for planning parkour and freerunning progression.

Create personal goals, explore and track list-based challenges, log daily activity, and search parkour spots. The app now uses Supabase for persistence and auth-backed data ownership.

Tagline: Train what's next. Plan your session.

## What is implemented

- Dashboard with recent goals, lists, activity summary, and action spots
- Authentication via Supabase Auth (Google sign-in only)
- Goals flow: browse, filter by status, search, create, and view goal detail pages
- Lists flow: browse lists, follow/explore, create lists, and view list detail pages
- Activity flow: log parkour and support training types, view streak and weekly stats, review recent session history, and inspect a heatmap
- People and inspiration views for discovery and profile-level browsing
- Public legal pages for Terms of Use and Privacy Policy
- Spots flow:
- Your action spots section from goals tied to spots
- parkour.spot-backed search (when API key is configured)
- API route proxy for spot search with cache headers

## Tech stack

| Layer | Technology |
| --- | --- |
| App framework | SvelteKit 2 |
| Language | TypeScript 5 |
| Build tool | Vite 5 |
| UI | Svelte components + custom CSS tokens |
| Data | Supabase (Postgres + RLS) |
| Server integration | SvelteKit server routes |
| External APIs | parkour.spot (optional, env-gated) |
| Planned persistence | Supabase |

## Project structure

Key areas:

- `src/routes`: pages and API endpoints
- `src/routes/api/parkour-spot/spots/+server.ts`: server endpoint for spot search
- `src/lib/data`: client data modules backed by server API + Supabase
- `src/lib/components`: reusable UI components
- `src/lib/server`: server-only integration helpers (parkour.spot, Supabase)
- `supabase/migrations`: SQL schema and auth/profile sync migrations

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Environment setup (optional for local MVP)

Copy `.env.example` to `.env` and fill what you need.

macOS/Linux:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Supabase auth env vars are required to sign in.

### Run development server

```bash
npm run dev
```

Open http://localhost:5173

## Available scripts

- `npm run dev`: start local dev server
- `npm run build`: create production build
- `npm run preview`: preview production build locally
- `npm run check`: run `svelte-check` with project tsconfig
- `npm run check:watch`: run type checks in watch mode

## Environment variables

Defined in `.env.example`:

| Variable | Required | Description |
| --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by auth |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key used by auth |
| `PARKOUR_SPOT_API_URL` | No | Base URL for parkour.spot API (defaults to `https://parkour.spot/api/v1`) |
| `PARKOUR_SPOT_API_KEY` | Yes (for spot search) | API key used by server-side spot search |
| `PARKOUR_SPOT_BEARER_TOKEN` | No (future callback use) | Bearer token for verifying parkour.spot callbacks |

## Spots integration behavior

- Spots page server load checks if `PARKOUR_SPOT_API_KEY` is present.
- If missing, the page shows an integration warning and returns no remote spots.
- If configured, searches call parkour.spot via server code in `src/lib/server/parkourspot.ts`.
- API route `GET /api/parkour-spot/spots` proxies queries and sets cache headers.

## Database migrations

Apply migrations in your Supabase project using the Supabase CLI:

```bash
supabase db push
```

This repository includes:

- `supabase/migrations/20260506120000_initial_schema.sql`: core schema + RLS policies
- `supabase/migrations/20260506121000_auth_profile_sync.sql`: auth user -> profile sync trigger + base tags seed
- `supabase/migrations/20260506143000_add_activity_types.sql`: activity categories for parkour and support training logs

## Current MVP constraints

- Authentication is required for app routes (except login + legal pages).
- Only Google OAuth is enabled as a sign-in method.
- parkour.spot search still depends on `PARKOUR_SPOT_API_KEY`.

## Supabase auth setup (Google only)

1. Create a Supabase project.
2. In Supabase dashboard, enable Google provider under Authentication > Providers.
3. Configure Google OAuth credentials in Supabase.
4. Add your local callback URL in Supabase Auth settings:
	- `http://localhost:5173/auth/callback`
5. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in `.env`.

## Quality checks

Run:

```bash
npm run check
```

This validates Svelte + TypeScript types across routes and components.

## Roadmap ideas

- Add authentication and per-user data ownership
- Add richer spot ingestion/sync workflows
- Add tests for data modules and critical routes
