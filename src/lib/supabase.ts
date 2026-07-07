import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Store } from './store';
import type { WorkoutSession, Routine, FoodDay } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when env vars are not configured — the app falls back to local device mode. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const cloudEnabled = supabase !== null;

/**
 * Cloud store backed by Supabase Postgres with row-level security.
 * Rows store full documents as jsonb for parity with LocalStore.
 * Schema: see supabase/schema.sql
 */
export class SupabaseStore implements Store {
  constructor(private sb: SupabaseClient) {}

  async listSessions(uid: string): Promise<WorkoutSession[]> {
    const { data, error } = await this.sb
      .from('workout_sessions')
      .select('data')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => r.data as WorkoutSession);
  }

  async saveSession(uid: string, s: WorkoutSession): Promise<void> {
    const { error } = await this.sb
      .from('workout_sessions')
      .upsert({ id: s.id, user_id: uid, date: s.date, data: s });
    if (error) throw error;
  }

  async deleteSession(uid: string, id: string): Promise<void> {
    const { error } = await this.sb.from('workout_sessions').delete().eq('user_id', uid).eq('id', id);
    if (error) throw error;
  }

  async listRoutines(uid: string): Promise<Routine[]> {
    const { data, error } = await this.sb.from('routines').select('data').eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r) => r.data as Routine);
  }

  async saveRoutine(uid: string, r: Routine): Promise<void> {
    const { error } = await this.sb.from('routines').upsert({ id: r.id, user_id: uid, data: r });
    if (error) throw error;
  }

  async deleteRoutine(uid: string, id: string): Promise<void> {
    const { error } = await this.sb.from('routines').delete().eq('user_id', uid).eq('id', id);
    if (error) throw error;
  }

  async getFoodDay(uid: string, date: string): Promise<FoodDay> {
    const { data, error } = await this.sb
      .from('food_days')
      .select('data')
      .eq('user_id', uid)
      .eq('date', date)
      .maybeSingle();
    if (error) throw error;
    return data ? (data.data as FoodDay) : { date, items: [] };
  }

  async saveFoodDay(uid: string, day: FoodDay): Promise<void> {
    const { error } = await this.sb
      .from('food_days')
      .upsert({ user_id: uid, date: day.date, data: day }, { onConflict: 'user_id,date' });
    if (error) throw error;
  }
}
