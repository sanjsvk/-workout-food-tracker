import { describe, it, expect } from 'vitest';
import {
  epley1RM,
  detectPRs,
  prEvents,
  bestByExercise,
  sessionVolume,
  weeklyVolume,
  dayStreak,
  weekStreak,
  macroTotals,
  progression,
  todayISO,
} from './calc';
import type { WorkoutSession, FoodItem } from './types';

let seq = 0;
function mkSession(date: string, exercises: { id: string; sets: [number, number][] }[]): WorkoutSession {
  return {
    id: `s${++seq}`,
    date,
    startedAt: new Date(date).getTime() + seq,
    exercises: exercises.map((e) => ({
      exerciseId: e.id,
      sets: e.sets.map(([weight, reps]) => ({ weight, reps })),
    })),
  };
}

describe('epley1RM', () => {
  it('returns the weight itself for a single', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });
  it('estimates 1RM for rep sets', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.7, 1);
    expect(epley1RM(105, 5)).toBeCloseTo(122.5, 1);
  });
  it('returns 0 for invalid input', () => {
    expect(epley1RM(0, 5)).toBe(0);
    expect(epley1RM(100, 0)).toBe(0);
  });
});

describe('PR detection', () => {
  const history = [mkSession('2026-01-01', [{ id: 'bench', sets: [[100, 5]] }])];

  it('detects a top-weight PR', () => {
    const s = mkSession('2026-01-08', [{ id: 'bench', sets: [[105, 5]] }]);
    const hits = detectPRs(history, s);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ exerciseId: 'bench', kind: 'weight', value: 105, prev: 100 });
  });

  it('detects an est-1RM PR at same weight, more reps', () => {
    const s = mkSession('2026-01-08', [{ id: 'bench', sets: [[100, 8]] }]);
    const hits = detectPRs(history, s);
    expect(hits).toHaveLength(1);
    expect(hits[0].kind).toBe('e1rm');
    expect(hits[0].value).toBeCloseTo(126.7, 1);
  });

  it('does not flag a first-time exercise as a broken PR', () => {
    const s = mkSession('2026-01-08', [{ id: 'squat', sets: [[140, 5]] }]);
    expect(detectPRs(history, s)).toHaveLength(0);
  });

  it('does not flag a weaker session', () => {
    const s = mkSession('2026-01-08', [{ id: 'bench', sets: [[95, 5]] }]);
    expect(detectPRs(history, s)).toHaveLength(0);
  });
});

describe('prEvents / bestByExercise', () => {
  const sessions = [
    mkSession('2026-01-01', [{ id: 'bench', sets: [[100, 5]] }]),
    mkSession('2026-01-08', [{ id: 'bench', sets: [[105, 5]] }]),
    mkSession('2026-01-15', [{ id: 'bench', sets: [[100, 3]] }]), // weaker, no event
  ];

  it('produces chronological improvement events', () => {
    const ev = prEvents(sessions);
    expect(ev).toHaveLength(2);
    expect(ev[0]).toMatchObject({ exerciseId: 'bench', first: true, weight: 100 });
    expect(ev[1]).toMatchObject({ exerciseId: 'bench', first: false, weight: 105 });
  });

  it('tracks all-time best per exercise', () => {
    const best = bestByExercise(sessions);
    expect(best.get('bench')?.weight).toBe(105);
    expect(best.get('bench')?.e1rm).toBeCloseTo(122.5, 1);
  });
});

describe('volume', () => {
  it('sums weight x reps for a session', () => {
    const s = mkSession('2026-01-01', [{ id: 'bench', sets: [[100, 5], [100, 5]] }]);
    expect(sessionVolume(s)).toBe(1000);
  });

  it('buckets volume into the current week', () => {
    const s = mkSession(todayISO(), [{ id: 'bench', sets: [[100, 5]] }]);
    const weeks = weeklyVolume([s], 8);
    expect(weeks).toHaveLength(8);
    expect(weeks[7].total).toBe(500);
    expect(weeks[0].total).toBe(0);
  });
});

describe('progression', () => {
  it('returns per-session top weight and e1rm, oldest first', () => {
    const rows = progression(
      [
        mkSession('2026-01-08', [{ id: 'bench', sets: [[105, 5]] }]),
        mkSession('2026-01-01', [{ id: 'bench', sets: [[100, 5], [90, 10]] }]),
      ],
      'bench'
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].date).toBe('2026-01-01');
    expect(rows[0].topWeight).toBe(100);
    expect(rows[1].topWeight).toBe(105);
  });
});

describe('streaks', () => {
  it('counts consecutive days including today', () => {
    expect(dayStreak(['2026-01-03', '2026-01-02', '2026-01-01'], '2026-01-03')).toBe(3);
  });
  it('allows a rest-day grace when today has no workout yet', () => {
    expect(dayStreak(['2026-01-03', '2026-01-02'], '2026-01-04')).toBe(2);
  });
  it('breaks after a missed day', () => {
    expect(dayStreak(['2026-01-01'], '2026-01-05')).toBe(0);
  });
  it('counts consecutive training weeks', () => {
    // Jan 15 2026 is a Thursday; weeks start Monday (1/12, 1/5, 12/29)
    const now = new Date(2026, 0, 15);
    expect(weekStreak(['2026-01-13', '2026-01-06'], now)).toBe(2);
    // current week empty -> streak still alive from previous weeks
    expect(weekStreak(['2026-01-06', '2025-12-30'], now)).toBe(2);
    expect(weekStreak(['2025-12-30'], now)).toBe(0);
  });
});

describe('macroTotals', () => {
  it('sums and rounds macros', () => {
    const items: FoodItem[] = [
      { id: '1', name: 'Chicken', meal: 'lunch', calories: 220.4, protein: 40.2, carbs: 0, fat: 5.1 },
      { id: '2', name: 'Rice', meal: 'lunch', calories: 260.3, protein: 5.3, carbs: 56.4, fat: 0.6 },
    ];
    expect(macroTotals(items)).toEqual({ calories: 481, protein: 46, carbs: 56, fat: 6 });
  });
  it('handles empty days', () => {
    expect(macroTotals([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
