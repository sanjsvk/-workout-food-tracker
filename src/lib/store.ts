import type { WorkoutSession, Routine, FoodDay } from './types';

/**
 * Storage abstraction. Two implementations:
 *  - LocalStore  (localStorage, zero setup, single "local" user)
 *  - SupabaseStore (multi-user cloud sync, see supabase.ts)
 */
export interface Store {
  listSessions(uid: string): Promise<WorkoutSession[]>;
  saveSession(uid: string, s: WorkoutSession): Promise<void>;
  deleteSession(uid: string, id: string): Promise<void>;
  listRoutines(uid: string): Promise<Routine[]>;
  saveRoutine(uid: string, r: Routine): Promise<void>;
  deleteRoutine(uid: string, id: string): Promise<void>;
  getFoodDay(uid: string, date: string): Promise<FoodDay>;
  saveFoodDay(uid: string, day: FoodDay): Promise<void>;
}

const PREFIX = 'repfuel';

export class LocalStore implements Store {
  private key(uid: string, kind: string): string {
    return `${PREFIX}:${uid}:${kind}`;
  }

  private read<T>(k: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write(k: string, v: unknown): void {
    localStorage.setItem(k, JSON.stringify(v));
  }

  async listSessions(uid: string): Promise<WorkoutSession[]> {
    return this.read<WorkoutSession[]>(this.key(uid, 'sessions'), []).sort(
      (a, b) => b.date.localeCompare(a.date) || b.startedAt - a.startedAt
    );
  }

  async saveSession(uid: string, s: WorkoutSession): Promise<void> {
    const all = this.read<WorkoutSession[]>(this.key(uid, 'sessions'), []);
    const i = all.findIndex((x) => x.id === s.id);
    if (i >= 0) all[i] = s;
    else all.push(s);
    this.write(this.key(uid, 'sessions'), all);
  }

  async deleteSession(uid: string, id: string): Promise<void> {
    const all = this.read<WorkoutSession[]>(this.key(uid, 'sessions'), []);
    this.write(
      this.key(uid, 'sessions'),
      all.filter((x) => x.id !== id)
    );
  }

  async listRoutines(uid: string): Promise<Routine[]> {
    return this.read<Routine[]>(this.key(uid, 'routines'), []);
  }

  async saveRoutine(uid: string, r: Routine): Promise<void> {
    const all = this.read<Routine[]>(this.key(uid, 'routines'), []);
    const i = all.findIndex((x) => x.id === r.id);
    if (i >= 0) all[i] = r;
    else all.push(r);
    this.write(this.key(uid, 'routines'), all);
  }

  async deleteRoutine(uid: string, id: string): Promise<void> {
    const all = this.read<Routine[]>(this.key(uid, 'routines'), []);
    this.write(
      this.key(uid, 'routines'),
      all.filter((x) => x.id !== id)
    );
  }

  async getFoodDay(uid: string, date: string): Promise<FoodDay> {
    const days = this.read<FoodDay[]>(this.key(uid, 'food'), []);
    return days.find((d) => d.date === date) ?? { date, items: [] };
  }

  async saveFoodDay(uid: string, day: FoodDay): Promise<void> {
    const days = this.read<FoodDay[]>(this.key(uid, 'food'), []);
    const i = days.findIndex((d) => d.date === day.date);
    if (i >= 0) days[i] = day;
    else days.push(day);
    this.write(this.key(uid, 'food'), days);
  }
}
