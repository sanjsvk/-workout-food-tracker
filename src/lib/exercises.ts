import type { Exercise } from './types';

export const EXERCISES: Exercise[] = [
  { id: 'bench', name: 'Bench Press', muscle: 'Chest' },
  { id: 'incline-db', name: 'Incline Dumbbell Press', muscle: 'Chest' },
  { id: 'pushup', name: 'Push-Up (weighted)', muscle: 'Chest' },
  { id: 'cable-fly', name: 'Cable Fly', muscle: 'Chest' },
  { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders' },
  { id: 'db-shoulder', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders' },
  { id: 'lat-raise', name: 'Lateral Raise', muscle: 'Shoulders' },
  { id: 'rear-delt', name: 'Rear Delt Fly', muscle: 'Shoulders' },
  { id: 'squat', name: 'Back Squat', muscle: 'Legs' },
  { id: 'front-squat', name: 'Front Squat', muscle: 'Legs' },
  { id: 'leg-press', name: 'Leg Press', muscle: 'Legs' },
  { id: 'rdl', name: 'Romanian Deadlift', muscle: 'Legs' },
  { id: 'lunge', name: 'Walking Lunge', muscle: 'Legs' },
  { id: 'leg-ext', name: 'Leg Extension', muscle: 'Legs' },
  { id: 'leg-curl', name: 'Leg Curl', muscle: 'Legs' },
  { id: 'calf-raise', name: 'Calf Raise', muscle: 'Legs' },
  { id: 'hip-thrust', name: 'Hip Thrust', muscle: 'Glutes' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Back' },
  { id: 'row', name: 'Barbell Row', muscle: 'Back' },
  { id: 'pulldown', name: 'Lat Pulldown', muscle: 'Back' },
  { id: 'pullup', name: 'Pull-Up (weighted)', muscle: 'Back' },
  { id: 'seated-row', name: 'Seated Cable Row', muscle: 'Back' },
  { id: 'db-row', name: 'Dumbbell Row', muscle: 'Back' },
  { id: 'curl', name: 'Barbell Curl', muscle: 'Arms' },
  { id: 'db-curl', name: 'Dumbbell Curl', muscle: 'Arms' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscle: 'Arms' },
  { id: 'tri-pushdown', name: 'Triceps Pushdown', muscle: 'Arms' },
  { id: 'skullcrusher', name: 'Skull Crusher', muscle: 'Arms' },
  { id: 'dip', name: 'Dip (weighted)', muscle: 'Arms' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscle: 'Core' },
  { id: 'leg-raise', name: 'Hanging Leg Raise', muscle: 'Core' },
  { id: 'plank', name: 'Plank (weighted)', muscle: 'Core' },
];

export const EX_BY_ID = new Map(EXERCISES.map((e) => [e.id, e] as const));

export function exName(id: string): string {
  return EX_BY_ID.get(id)?.name ?? id;
}

export const MUSCLE_GROUPS = [...new Set(EXERCISES.map((e) => e.muscle))];
