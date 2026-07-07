import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { WorkoutSession, Routine, FoodDay, Goals } from './types';
import { LocalStore, type Store } from './store';
import { SupabaseStore, supabase } from './supabase';
import { BUILTIN_ROUTINES } from './templates';
import { todayISO } from './calc';
import { useAuth } from './auth';

const DEFAULT_GOALS: Goals = { calories: 2200, protein: 150, carbs: 220, fat: 70, workoutsPerWeek: 4, unit: 'lb' };

interface DataCtx {
  ready: boolean;
  sessions: WorkoutSession[];
  routines: Routine[]; // builtin + custom
  todayFood: FoodDay;
  goals: Goals;
  addSession(s: WorkoutSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
  saveRoutine(r: Routine): Promise<void>;
  deleteRoutine(id: string): Promise<void>;
  loadFoodDay(date: string): Promise<FoodDay>;
  saveFoodDay(day: FoodDay): Promise<void>;
  setGoals(g: Goals): void;
}

const Ctx = createContext<DataCtx | null>(null);

function goalsKey(uid: string) {
  return `repfuel:${uid}:goals`;
}

function loadGoals(uid: string): Goals {
  try {
    const raw = localStorage.getItem(goalsKey(uid));
    return raw ? { ...DEFAULT_GOALS, ...JSON.parse(raw) } : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const user = auth.user!; // only mounted when signed in
  const uid = user.id;

  const store = useMemo<Store>(
    () => (user.mode === 'cloud' && supabase ? new SupabaseStore(supabase) : new LocalStore()),
    [uid, user.mode]
  );

  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [customRoutines, setCustomRoutines] = useState<Routine[]>([]);
  const [todayFood, setTodayFood] = useState<FoodDay>({ date: todayISO(), items: [] });
  const [goals, setGoalsState] = useState<Goals>(() => loadGoals(uid));

  useEffect(() => {
    let live = true;
    setReady(false);
    Promise.all([store.listSessions(uid), store.listRoutines(uid), store.getFoodDay(uid, todayISO())])
      .then(([s, r, f]) => {
        if (!live) return;
        setSessions(s);
        setCustomRoutines(r);
        setTodayFood(f);
        setReady(true);
      })
      .catch((err) => {
        console.error('Failed to load data', err);
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [store, uid]);

  const routines = useMemo(() => [...BUILTIN_ROUTINES, ...customRoutines], [customRoutines]);

  const sortSessions = (list: WorkoutSession[]) =>
    [...list].sort((a, b) => b.date.localeCompare(a.date) || b.startedAt - a.startedAt);

  const api: DataCtx = {
    ready,
    sessions,
    routines,
    todayFood,
    goals,
    async addSession(s) {
      await store.saveSession(uid, s);
      setSessions((prev) => sortSessions([s, ...prev.filter((x) => x.id !== s.id)]));
    },
    async deleteSession(id) {
      await store.deleteSession(uid, id);
      setSessions((prev) => prev.filter((x) => x.id !== id));
    },
    async saveRoutine(r) {
      await store.saveRoutine(uid, r);
      setCustomRoutines((prev) => {
        const i = prev.findIndex((x) => x.id === r.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = r;
          return next;
        }
        return [...prev, r];
      });
    },
    async deleteRoutine(id) {
      await store.deleteRoutine(uid, id);
      setCustomRoutines((prev) => prev.filter((x) => x.id !== id));
    },
    async loadFoodDay(date) {
      if (date === todayFood.date) return todayFood;
      return store.getFoodDay(uid, date);
    },
    async saveFoodDay(day) {
      await store.saveFoodDay(uid, day);
      if (day.date === todayISO()) setTodayFood(day);
    },
    setGoals(g) {
      setGoalsState(g);
      localStorage.setItem(goalsKey(uid), JSON.stringify(g));
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData outside DataProvider');
  return v;
}
