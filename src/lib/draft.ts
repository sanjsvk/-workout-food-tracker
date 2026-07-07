import type { WorkoutSession, Routine } from './types';
import { todayISO } from './calc';
import { bestByExercise } from './calc';

function draftKey(uid: string) {
  return `repfuel:${uid}:draft`;
}

export function loadDraft(uid: string): WorkoutSession | null {
  try {
    const raw = localStorage.getItem(draftKey(uid));
    return raw ? (JSON.parse(raw) as WorkoutSession) : null;
  } catch {
    return null;
  }
}

export function saveDraft(uid: string, d: WorkoutSession): void {
  localStorage.setItem(draftKey(uid), JSON.stringify(d));
}

export function clearDraft(uid: string): void {
  localStorage.removeItem(draftKey(uid));
}

/** New in-progress workout; routine items are prefilled with target reps and last-used weights. */
export function newDraft(routine: Routine | null, sessions: WorkoutSession[]): WorkoutSession {
  const best = bestByExercise(sessions);
  return {
    id: crypto.randomUUID(),
    date: todayISO(),
    startedAt: Date.now(),
    name: routine?.name ?? 'Workout',
    exercises: (routine?.items ?? []).map((item) => ({
      exerciseId: item.exerciseId,
      sets: Array.from({ length: item.targetSets }, () => ({
        weight: best.get(item.exerciseId)?.weight ?? 0,
        reps: item.targetReps,
        done: false,
      })),
    })),
  };
}
