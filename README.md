<p align="center">
  <img src="static/images/brand/sessiongoals-brand-cobalt.svg" alt="SessionGoals" width="320" />
</p>

<p align="center"><em>Train what's next. Plan your session.</em></p>

---

SessionGoals is a training companion for parkour and freerunning athletes. Set goals, track your sessions, follow challenge lists, and keep an eye on your favourite spots — all in one place.

---

## What you can do

### Dashboard

Get a quick overview of your active goals, upcoming sessions, and recent activity as soon as you open the app.

---

### Goals

Create and manage personal training goals. Filter by status, search by name, and drill into a goal to see all the details. Goals can be tied to a specific spot so you always know where to train next.

---

### Activity

Log every session — parkour, conditioning, or other training. See your current streak, weekly stats, and a full year heatmap of your training history.

---

### Lists

Create curated goal lists and share them publicly. Follow lists from other athletes to add a structured challenge to your training.

---

### Spots

Browse your action spots on a map and search for new places to train via [parkour.spot](https://parkour.spot). Link spots to goals so your training always has a location.

---

### People & Library

Discover other athletes, explore their public profiles, and browse a shared movement library for inspiration and reference.

---

## Sign in

SessionGoals uses Google sign-in. Create an account to start tracking your progress.

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
