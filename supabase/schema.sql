-- Repfuel database schema for Supabase (free tier)
-- Run this in your Supabase project: SQL Editor -> New query -> paste -> Run

create table if not exists public.workout_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.food_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists workout_sessions_user_date on public.workout_sessions (user_id, date desc);

-- Row-level security: each user can only touch their own rows
alter table public.workout_sessions enable row level security;
alter table public.routines enable row level security;
alter table public.food_days enable row level security;

create policy "own sessions" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own routines" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own food days" on public.food_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
