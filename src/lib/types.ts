export interface Exercise {
  id: string;
  name: string;
  muscle: string;
}

export interface SetEntry {
  weight: number;
  reps: number;
  done?: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  sets: SetEntry[];
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD local
  startedAt: number; // epoch ms
  durationMin?: number;
  name?: string;
  exercises: SessionExercise[];
}

export interface RoutineItem {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
}

export interface Routine {
  id: string;
  name: string;
  emoji?: string;
  items: RoutineItem[];
  builtin?: boolean;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  meal: MealSlot;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  qty?: string;
}

export interface FoodDay {
  date: string; // YYYY-MM-DD
  items: FoodItem[];
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  workoutsPerWeek: number;
  unit: 'lb' | 'kg';
}

export interface PRRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  e1rm: number;
  date: string;
}
