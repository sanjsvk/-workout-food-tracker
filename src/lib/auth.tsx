import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, cloudEnabled } from './supabase';

export interface AppUser {
  id: string;
  mode: 'local' | 'cloud';
  email?: string;
  name: string;
}

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  cloudEnabled: boolean;
  signInGoogle(): Promise<void>;
  signInEmail(email: string, pw: string): Promise<string | null>;
  signUpEmail(email: string, pw: string): Promise<string | null>;
  useLocal(): void;
  signOut(): Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const LOCAL_FLAG = 'repfuel:localMode';

function localUser(): AppUser {
  return { id: 'local', mode: 'local', name: 'Athlete' };
}

function mapUser(session: Session | null): AppUser | null {
  if (!session) return null;
  const u = session.user;
  const name =
    (u.user_metadata?.full_name as string | undefined) ||
    (u.user_metadata?.name as string | undefined) ||
    u.email?.split('@')[0] ||
    'Athlete';
  return { id: u.id, mode: 'cloud', email: u.email ?? undefined, name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(LOCAL_FLAG) === '1') {
      setUser(localUser());
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(mapUser(data.session));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(mapUser(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const api: AuthCtx = {
    user,
    loading,
    cloudEnabled,
    async signInGoogle() {
      if (!supabase) return;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    },
    async signInEmail(email, pw) {
      if (!supabase) return 'Cloud sync is not configured';
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      return error ? error.message : null;
    },
    async signUpEmail(email, pw) {
      if (!supabase) return 'Cloud sync is not configured';
      const { data, error } = await supabase.auth.signUp({ email, password: pw });
      if (error) return error.message;
      if (data.session === null) return 'CHECK_EMAIL';
      return null;
    },
    useLocal() {
      localStorage.setItem(LOCAL_FLAG, '1');
      setUser(localUser());
    },
    async signOut() {
      if (user?.mode === 'local') {
        localStorage.removeItem(LOCAL_FLAG);
      } else if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
