# Workout Food Tracker - Mobile App

## Overview
Building a mobile-first fitness and food tracking app. Polished, fully working core experience > long feature list.

## Platform & Tech
- **Mobile-first**: PWA (React + web) OR React Native/Expo — choose whichever delivers a real, usable, installable app **fastest** in one shot. Justify the choice.
- **Auth**: Google Sign-In preferred; fall back to simple email-based auth if setup risk is too high.
- **Backend**: Free-tier only (Supabase or Firebase). Flag any real free-tier limitations.
- **No external UI libraries** — build UI components from scratch or use minimal, free alternatives.

## Feature Priorities (in order)
1. **Working auth + multi-user data persistence** (this unlocks everything)
2. **Workout logging fully fleshed out**:
   - Log sets, reps, weight per exercise
   - Auto-track personal records (PRs) over time
   - Pre-built routine templates + ability to create custom routines
3. **Progress analytics** (make these feel great, not just functional):
   - Interactive, scrubbable strength-progression charts
   - Volume trends over time
   - Visual celebration when PRs are broken (animated moments)
   - Animated streaks/consistency tracking
   - At-a-glance dashboard (progress rings, not tables)
4. **Food logging** (with full macros: protein/carbs/fat/calories):
   - Searchable food database if free API exists and is reliable; otherwise manual entry with macro fields
5. **Test coverage & repo polish** (do this once the app works — don't let it block a working build)

## Design
- Cohesive, intentional visual direction — feels like a real fitness app, not a generic form.
- Dark mode support (optional but nice).
- Mobile-first, responsive.

## Code Standards
- Clean folder structure (UI / data layer / API calls separation).
- Initialize git repo, commit as you build.
- README with setup/run steps, .gitignore, clear structure.
- **Tests**: Lean layer covering core logic only (macro calculations, PR detection, data persistence). Don't chase full coverage — a working app with light tests > stalled build.

## Tradeoffs to Know
- **Food tracking depth is the first thing to cut if time is tight** (not workout tracking).
- Analytics should be visually engaging and interactive — spending effort here is worthwhile.
- One-shot build: prioritize shipping over perfect code. Polish comes after working.

## Constraints
- Free tier only — no paid services, no external cost.
- Multi-user support (private per-account data).
- Installable to phone home screen (PWA or native).
