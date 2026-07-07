# Repfuel — Workout & Food Tracker

A mobile-first PWA for tracking workouts, personal records, and nutrition. Built with React + TypeScript + Vite, using only free-tier services.

**Train. Eat. Progress.**

## Features

**Workout tracking (fully built)**
- Set-by-set logging (weight × reps) with previous-session hints and prefilled weights
- Automatic PR detection (top weight + Epley estimated 1RM) with a confetti celebration when you break one
- 5 built-in routine templates (Push / Pull / Legs / Upper / Full Body) + custom routine builder
- In-progress workouts survive page refreshes and app restarts
- Interactive analytics: scrubbable strength-progression charts, weekly volume bars, animated progress rings, week/day streak tracking

**Food tracking**
- Per-day macro dashboard (calories, protein, carbs, fat) against editable goals
- Meal-based logging (breakfast / lunch / dinner / snacks)
- Food search via [Open Food Facts](https://world.openfoodfacts.org/) (free, no API key) with gram-based portion scaling
- Manual entry with automatic calorie calculation from macros (4/4/9)

**Accounts & sync**
- Google sign-in or email/password via Supabase (free tier), with per-user private data enforced by Postgres row-level security
- **Zero-setup local mode**: works immediately on one device with no backend configured

## Quick start (local mode — no setup)

```bash
npm install
npm run dev
```

Open http://localhost:5173, tap **"Continue without an account"**, and start logging. All data stays in the browser's localStorage.

## Tests

```bash
npm test
```

Covers the core logic: 1RM estimation, PR detection, streaks, weekly volume, macro totals, and localStorage persistence.

## Enable accounts & cloud sync (Supabase, free tier)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, run the contents of [`supabase/schema.sql`](supabase/schema.sql) (creates tables + row-level security policies).
3. Copy `.env.example` to `.env` and fill in the values from **Settings → API**:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Restart the dev server. Email/password sign-in now works out of the box.
5. *(Optional)* For Google sign-in: **Authentication → Providers → Google** in the Supabase dashboard, and add a Google OAuth client (free) per [Supabase's guide](https://supabase.com/docs/guides/auth/social-login/auth-google). Add your site URL (and `http://localhost:5173` for dev) to the redirect allowlist.

## Deploy (free)

The app is a static build — any free static host works:

```bash
npm run build   # outputs dist/
```

- **Vercel / Netlify** (recommended): import the repo, framework = Vite, build command `npm run build`, output `dist`. Set the two `VITE_SUPABASE_*` env vars in the dashboard if you use cloud sync.
- Once deployed over HTTPS, open the site on your phone and use **Add to Home Screen** — it installs as a standalone app (manifest + service worker included, works offline for the app shell).

## Free-tier limitations to know

- **Supabase free tier**: projects **pause after ~1 week of inactivity** — you must un-pause them in the dashboard. 500 MB database and 50k monthly active users, which is far more than enough here.
- **Open Food Facts**: rate-limited (~10 search requests/min) and product data quality varies. The app degrades gracefully — manual macro entry always works.
- **Google OAuth**: free, but requires one-time setup of a Google Cloud OAuth client. Email/password auth needs zero extra setup.
- **Local mode**: data lives in one browser's localStorage — clearing site data deletes it, and there's no cross-device sync. Goals/settings are stored locally even in cloud mode.

## Project structure

```
src/
  lib/            # data layer + pure logic (no UI)
    types.ts        # domain models
    calc.ts         # 1RM, PR detection, streaks, volume, macros  ← tested
    store.ts        # Store interface + LocalStore (localStorage) ← tested
    supabase.ts     # Supabase client + SupabaseStore (cloud)
    nutrition.ts    # Open Food Facts API client
    auth.tsx        # AuthProvider (Google / email / local mode)
    data.tsx        # DataProvider (app state + persistence)
    draft.ts        # in-progress workout persistence
    exercises.ts    # exercise catalog
    templates.ts    # built-in routines
  components/     # reusable UI (charts, celebration, exercise picker)
  views/          # screens (Dashboard, Train, Routines, Food, Auth)
supabase/
  schema.sql      # tables + row-level security policies
public/           # PWA manifest, service worker, icon
```

## Tech decisions

- **PWA over React Native**: one build that runs everywhere and installs to the home screen, with no app-store or native toolchain risk.
- **jsonb document storage**: cloud rows mirror the local data shapes exactly, so `LocalStore` and `SupabaseStore` are interchangeable behind one `Store` interface.
- **Hand-rolled SVG charts**: no chart library needed; enables the touch-scrub interaction and keeps the bundle at ~59 KB gzipped.
