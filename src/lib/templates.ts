import type { Routine } from './types';

export const BUILTIN_ROUTINES: Routine[] = [
  {
    id: 'tpl-push',
    name: 'Push Day',
    emoji: '🔥',
    builtin: true,
    items: [
      { exerciseId: 'bench', targetSets: 4, targetReps: 6 },
      { exerciseId: 'ohp', targetSets: 3, targetReps: 8 },
      { exerciseId: 'incline-db', targetSets: 3, targetReps: 10 },
      { exerciseId: 'lat-raise', targetSets: 3, targetReps: 12 },
      { exerciseId: 'tri-pushdown', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: 'tpl-pull',
    name: 'Pull Day',
    emoji: '🧲',
    builtin: true,
    items: [
      { exerciseId: 'deadlift', targetSets: 3, targetReps: 5 },
      { exerciseId: 'pulldown', targetSets: 4, targetReps: 8 },
      { exerciseId: 'row', targetSets: 3, targetReps: 8 },
      { exerciseId: 'rear-delt', targetSets: 3, targetReps: 15 },
      { exerciseId: 'curl', targetSets: 3, targetReps: 10 },
    ],
  },
  {
    id: 'tpl-legs',
    name: 'Leg Day',
    emoji: '🦵',
    builtin: true,
    items: [
      { exerciseId: 'squat', targetSets: 4, targetReps: 6 },
      { exerciseId: 'rdl', targetSets: 3, targetReps: 8 },
      { exerciseId: 'leg-press', targetSets: 3, targetReps: 10 },
      { exerciseId: 'leg-curl', targetSets: 3, targetReps: 12 },
      { exerciseId: 'calf-raise', targetSets: 4, targetReps: 15 },
    ],
  },
  {
    id: 'tpl-upper',
    name: 'Upper Body',
    emoji: '💪',
    builtin: true,
    items: [
      { exerciseId: 'bench', targetSets: 3, targetReps: 8 },
      { exerciseId: 'row', targetSets: 3, targetReps: 8 },
      { exerciseId: 'ohp', targetSets: 3, targetReps: 10 },
      { exerciseId: 'pulldown', targetSets: 3, targetReps: 10 },
      { exerciseId: 'curl', targetSets: 2, targetReps: 12 },
      { exerciseId: 'tri-pushdown', targetSets: 2, targetReps: 12 },
    ],
  },
  {
    id: 'tpl-full',
    name: 'Full Body',
    emoji: '⚡',
    builtin: true,
    items: [
      { exerciseId: 'squat', targetSets: 3, targetReps: 8 },
      { exerciseId: 'bench', targetSets: 3, targetReps: 8 },
      { exerciseId: 'row', targetSets: 3, targetReps: 8 },
      { exerciseId: 'ohp', targetSets: 2, targetReps: 10 },
      { exerciseId: 'plank', targetSets: 3, targetReps: 1 },
    ],
  },
];
