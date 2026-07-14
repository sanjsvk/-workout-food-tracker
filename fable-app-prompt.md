# Prompt for Fable

Build a mobile-first fitness and food tracking app. Prioritize a fully working, polished core experience over a long feature list — if something has to be cut for time, cut food tracking depth before workout tracking depth.

**Standing constraint: use only free-tier / no-cost services throughout** (backend, hosting, auth, any nutrition API, charting libraries). Flag anywhere a free tier has a real limitation I should know about.

## Platform
- Mobile-first, installable to a phone's home screen (PWA is fine if that's the most reliable path to "feels like an app" in one shot; use React Native/Expo instead if you can deliver that more reliably in a single build). Pick whichever gets me a real, usable app fastest — just tell me which you chose and why.

## Auth & Data
- Google sign-in (or a simple email-based account system if Google auth adds too much setup risk).
- Multi-user support with a free-tier backend/database (e.g. Supabase or Firebase) — usage per user will be small, so free tier limits are not a concern.
- Each user's data (workouts, food logs) should be private to their account.

## Core Feature: Workout Tracking (primary — build this fully)
- Log sets, reps, and weight per exercise
- Track personal records (PRs) automatically over time
- Pre-built routines/templates users can follow, plus ability to create custom routines
- Progress charts/analytics — make these interactive and genuinely enjoyable to look at, not just static charts: e.g. scrubbable strength-progression lines, volume trends, animated streaks/consistency tracking, satisfying PR-hit moments (visual celebration when a PR is broken), and an at-a-glance dashboard (e.g. progress rings) rather than a plain data table

## Core Feature: Food Tracking (secondary)
- Log meals with full macros (protein/carbs/fat) and calories
- Ideally include a searchable food database rather than pure manual entry (use a free/public nutrition API if one is feasible in this build; otherwise fall back to manual entry with macro fields — your call based on what's reliably buildable in one shot)

## Design
- No fixed style requirement — choose a cohesive, intentional visual direction rather than generic defaults. Should feel like a real fitness app, not a form.

## Code Organization
- This will run in Claude Code with GitHub access available, so initialize a git repo, structure it cleanly (sensible folder structure, README with setup/run steps, .gitignore, clear separation of UI / data layer / API calls), and commit as you build — don't just hand me files at the end.
- Include a lean layer of tests focused on core logic (e.g. macro calculations, PR detection, data persistence) rather than full end-to-end coverage — I'd rather have a working app with light tests than a stalled build chasing full coverage.

## Priorities if trade-offs are needed
1. Working auth + data persistence across sessions
2. Full workout logging + PR tracking
3. Routines/templates + progress charts
4. Food logging with macros
5. Food database search (nice-to-have)
6. Test coverage and repo polish (do this once the app itself works — don't let it block a working build)
