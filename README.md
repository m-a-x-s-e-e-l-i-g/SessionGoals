# SessionGoals

SessionGoals is a SvelteKit app for planning parkour and freerunning progression.

Create personal goals, explore and track list-based challenges, log daily activity, and search parkour spots. The current MVP focuses on a fast product loop with a typed mock data layer and server-side integration points.

Tagline: Train what's next. Plan your session.

## What is implemented

- Dashboard with recent goals, lists, activity summary, and action spots
- Goals flow: browse, filter by status, search, create, and view goal detail pages
- Lists flow: browse lists, follow/explore, create lists, and view list detail pages
- Activity flow: log sessions, view streak and weekly stats, review recent session history, and inspect a heatmap
- People and inspiration views for discovery and profile-level browsing
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
| Data (MVP) | In-memory typed mock modules under `src/lib/data` |
| Server integration | SvelteKit server routes |
| External APIs | parkour.spot (optional, env-gated) |
| Planned persistence | Supabase |

## Project structure

Key areas:

- `src/routes`: pages and API endpoints
- `src/routes/api/parkour-spot/spots/+server.ts`: server endpoint for spot search
- `src/lib/data`: in-memory data access modules
- `src/lib/components`: reusable UI components
- `src/lib/server`: server-only integration helpers (parkour.spot, Supabase)

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

If you skip environment variables, the app still runs with mock data, but external spot search will be unavailable.

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
| `PUBLIC_SUPABASE_URL` | No (for current MVP) | Supabase project URL for future/auth integration |
| `PUBLIC_SUPABASE_ANON_KEY` | No (for current MVP) | Supabase anon key |
| `PARKOUR_SPOT_API_URL` | No | Base URL for parkour.spot API (defaults to `https://parkour.spot/api/v1`) |
| `PARKOUR_SPOT_API_KEY` | Yes (for spot search) | API key used by server-side spot search |
| `PARKOUR_SPOT_BEARER_TOKEN` | No (future callback use) | Bearer token for verifying parkour.spot callbacks |

## Spots integration behavior

- Spots page server load checks if `PARKOUR_SPOT_API_KEY` is present.
- If missing, the page shows an integration warning and returns no remote spots.
- If configured, searches call parkour.spot via server code in `src/lib/server/parkourspot.ts`.
- API route `GET /api/parkour-spot/spots` proxies queries and sets cache headers.

## Current MVP constraints

- Data in `src/lib/data` is in-memory mock data.
- Writes are not persisted across server restarts/reloads.
- Supabase adapter code exists, but persistence is not fully wired as the default data source.

## Quality checks

Run:

```bash
npm run check
```

This validates Svelte + TypeScript types across routes and components.

## Roadmap ideas

- Switch primary data layer from mock modules to Supabase-backed repositories
- Add authentication and per-user data ownership
- Add richer spot ingestion/sync workflows
- Add tests for data modules and critical routes
