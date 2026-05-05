# SessionGoals

**A parkour and freerunning progression planner.**

Save moves, plan spot-based goals, collect inspiration, and organize challenge lists. Built with SvelteKit, TypeScript, and Supabase (ready).

> **Tagline:** *Train what's next. Plan your session.*

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | SvelteKit + TypeScript |
| Styling | CSS custom properties (dark theme) |
| Data (MVP) | In-memory mock store |
| Backend (ready) | SvelteKit server routes |
| Database (next) | Supabase (Postgres + Auth + Storage) |
| Spot discovery (next) | parkour.spot API |

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy env template
cp .env.example .env

# 3. Start dev server
npm run dev
```

Open http://localhost:5173.

> **Note on persistence:** The MVP uses an in-memory mock data layer. Data resets on page reload. Persistence will be added when Supabase is connected.
