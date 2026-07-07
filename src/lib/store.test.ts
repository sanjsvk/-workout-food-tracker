import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStore } from './store';
import type { WorkoutSession, Routine } from './types';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  get length() {
    return this.m.size;
  }
}

(globalThis as any).localStorage = new MemStorage();

const session = (id: string, date: string): WorkoutSession => ({
  id,
  date,
  startedAt: new Date(date).getTime(),
  exercises: [{ exerciseId: 'bench', sets: [{ weight: 100, reps: 5 }] }],
});

describe('LocalStore', () => {
  let store: LocalStore;
  const uid = 'test-user';

  beforeEach(() => {
    localStorage.clear();
    store = new LocalStore();
  });

  it('round-trips workout sessions, newest first', async () => {
    await store.saveSession(uid, session('a', '2026-01-01'));
    await store.saveSession(uid, session('b', '2026-01-08'));
    const list = await store.listSessions(uid);
    expect(list.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('upserts a session by id', async () => {
    await store.saveSession(uid, session('a', '2026-01-01'));
    const edited = { ...session('a', '2026-01-01'), name: 'Edited' };
    await store.saveSession(uid, edited);
    const list = await store.listSessions(uid);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Edited');
  });

  it('deletes a session', async () => {
    await store.saveSession(uid, session('a', '2026-01-01'));
    await store.deleteSession(uid, 'a');
    expect(await store.listSessions(uid)).toHaveLength(0);
  });

  it('keeps users isolated', async () => {
    await store.saveSession('user1', session('a', '2026-01-01'));
    expect(await store.listSessions('user2')).toHaveLength(0);
  });

  it('round-trips routines', async () => {
    const r: Routine = { id: 'r1', name: 'My Split', items: [{ exerciseId: 'bench', targetSets: 3, targetReps: 8 }] };
    await store.saveRoutine(uid, r);
    expect(await store.listRoutines(uid)).toHaveLength(1);
    await store.deleteRoutine(uid, 'r1');
    expect(await store.listRoutines(uid)).toHaveLength(0);
  });

  it('returns an empty food day when none is saved', async () => {
    const day = await store.getFoodDay(uid, '2026-01-01');
    expect(day).toEqual({ date: '2026-01-01', items: [] });
  });

  it('upserts food days by date', async () => {
    await store.saveFoodDay(uid, {
      date: '2026-01-01',
      items: [{ id: 'f1', name: 'Oats', meal: 'breakfast', calories: 300, protein: 10, carbs: 54, fat: 6 }],
    });
    await store.saveFoodDay(uid, {
      date: '2026-01-01',
      items: [
        { id: 'f1', name: 'Oats', meal: 'breakfast', calories: 300, protein: 10, carbs: 54, fat: 6 },
        { id: 'f2', name: 'Eggs', meal: 'breakfast', calories: 210, protein: 18, carbs: 1, fat: 15 },
      ],
    });
    const day = await store.getFoodDay(uid, '2026-01-01');
    expect(day.items).toHaveLength(2);
  });

  it('survives corrupted storage', async () => {
    localStorage.setItem('repfuel:test-user:sessions', '{not json');
    expect(await store.listSessions(uid)).toEqual([]);
  });
});
