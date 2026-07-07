import type { WorkoutSession, FoodItem, PRRecord } from './types';

/** Epley estimated one-rep max. */
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDateShort(iso: string): string {
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtK(v: number): string {
  return v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
}

/** All-time best set (by est. 1RM) per exercise. */
export function bestByExercise(sessions: WorkoutSession[]): Map<string, PRRecord> {
  const best = new Map<string, PRRecord>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (set.weight <= 0 || set.reps <= 0) continue;
        const e = epley1RM(set.weight, set.reps);
        const cur = best.get(ex.exerciseId);
        if (!cur || e > cur.e1rm || (e === cur.e1rm && set.weight > cur.weight)) {
          best.set(ex.exerciseId, { exerciseId: ex.exerciseId, weight: set.weight, reps: set.reps, e1rm: e, date: s.date });
        }
      }
    }
  }
  return best;
}

export interface PRHit {
  exerciseId: string;
  kind: 'weight' | 'e1rm';
  value: number;
  prev: number;
}

/** PRs broken by `session` relative to `history` (history must not include the session). */
export function detectPRs(history: WorkoutSession[], session: WorkoutSession): PRHit[] {
  const prevBest = bestByExercise(history);
  const hits: PRHit[] = [];
  const seen = new Set<string>();
  for (const ex of session.exercises) {
    if (seen.has(ex.exerciseId)) continue;
    seen.add(ex.exerciseId);
    let topW = 0;
    let topE = 0;
    for (const st of ex.sets) {
      if (st.weight > 0 && st.reps > 0) {
        topW = Math.max(topW, st.weight);
        topE = Math.max(topE, epley1RM(st.weight, st.reps));
      }
    }
    const prev = prevBest.get(ex.exerciseId);
    if (!prev) continue; // first time doing an exercise is a baseline, not a broken PR
    if (topW > prev.weight) hits.push({ exerciseId: ex.exerciseId, kind: 'weight', value: topW, prev: prev.weight });
    else if (topE > prev.e1rm) hits.push({ exerciseId: ex.exerciseId, kind: 'e1rm', value: topE, prev: prev.e1rm });
  }
  return hits;
}

export interface PREvent {
  exerciseId: string;
  e1rm: number;
  weight: number;
  reps: number;
  date: string;
  first: boolean;
}

/** Chronological PR history (every time an exercise's est. 1RM improved). */
export function prEvents(sessions: WorkoutSession[]): PREvent[] {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.startedAt - b.startedAt);
  const best = new Map<string, number>();
  const out: PREvent[] = [];
  for (const s of sorted) {
    const top = new Map<string, { e: number; w: number; r: number }>();
    for (const ex of s.exercises) {
      for (const st of ex.sets) {
        if (st.weight <= 0 || st.reps <= 0) continue;
        const e = epley1RM(st.weight, st.reps);
        const t = top.get(ex.exerciseId);
        if (!t || e > t.e) top.set(ex.exerciseId, { e, w: st.weight, r: st.reps });
      }
    }
    for (const [id, t] of top) {
      const b = best.get(id);
      if (b === undefined || t.e > b) {
        out.push({ exerciseId: id, e1rm: t.e, weight: t.w, reps: t.r, date: s.date, first: b === undefined });
        best.set(id, t.e);
      }
    }
  }
  return out;
}

export function sessionVolume(s: WorkoutSession): number {
  let v = 0;
  for (const ex of s.exercises) {
    for (const st of ex.sets) {
      if (st.weight > 0 && st.reps > 0) v += st.weight * st.reps;
    }
  }
  return Math.round(v);
}

/** Monday 00:00 of the week containing d. */
export function weekStart(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function weeklyVolume(sessions: WorkoutSession[], weeks = 8, now = new Date()): { label: string; total: number }[] {
  const cur = weekStart(now);
  const slots: { label: string; total: number; key: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = new Date(cur);
    ws.setDate(ws.getDate() - 7 * i);
    slots.push({ label: `${ws.getMonth() + 1}/${ws.getDate()}`, total: 0, key: ws.getTime() });
  }
  for (const s of sessions) {
    const key = weekStart(parseISODate(s.date)).getTime();
    const slot = slots.find((o) => o.key === key);
    if (slot) slot.total += sessionVolume(s);
  }
  return slots.map(({ label, total }) => ({ label, total }));
}

/** Per-session top weight and est. 1RM for one exercise, oldest first. */
export function progression(sessions: WorkoutSession[], exerciseId: string): { date: string; topWeight: number; e1rm: number }[] {
  const rows: { date: string; topWeight: number; e1rm: number }[] = [];
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.startedAt - b.startedAt);
  for (const s of sorted) {
    let w = 0;
    let e = 0;
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const st of ex.sets) {
        if (st.weight > 0 && st.reps > 0) {
          w = Math.max(w, st.weight);
          e = Math.max(e, epley1RM(st.weight, st.reps));
        }
      }
    }
    if (w > 0) rows.push({ date: s.date, topWeight: w, e1rm: e });
  }
  return rows;
}

/** Consecutive training days ending today (or yesterday, as grace). */
export function dayStreak(dates: string[], today = todayISO()): number {
  const set = new Set(dates);
  let streak = 0;
  const cur = parseISODate(today);
  if (!set.has(todayISO(cur))) cur.setDate(cur.getDate() - 1);
  while (set.has(todayISO(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

/** Consecutive calendar weeks (Mon–Sun) with at least one workout, counting back from this week. */
export function weekStreak(dates: string[], now = new Date()): number {
  const weeks = new Set(dates.map((d) => weekStart(parseISODate(d)).getTime()));
  const cur = weekStart(now);
  if (!weeks.has(cur.getTime())) cur.setDate(cur.getDate() - 7); // current week not over yet
  let streak = 0;
  while (weeks.has(cur.getTime())) {
    streak++;
    cur.setDate(cur.getDate() - 7);
  }
  return streak;
}

export function macroTotals(items: FoodItem[]): { calories: number; protein: number; carbs: number; fat: number } {
  const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const i of items) {
    t.calories += i.calories;
    t.protein += i.protein;
    t.carbs += i.carbs;
    t.fat += i.fat;
  }
  return {
    calories: Math.round(t.calories),
    protein: Math.round(t.protein),
    carbs: Math.round(t.carbs),
    fat: Math.round(t.fat),
  };
}
