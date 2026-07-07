import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { DataProvider, useData } from './lib/data';
import { loadDraft, saveDraft, newDraft } from './lib/draft';
import { AuthView } from './views/AuthView';
import { Dashboard } from './views/Dashboard';
import { TrainView } from './views/TrainView';
import { RoutinesView } from './views/RoutinesView';
import { FoodView } from './views/FoodView';
import type { Routine } from './lib/types';

type Tab = 'home' | 'train' | 'routines' | 'food';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'train', label: 'Train', icon: '🏋️' },
  { id: 'routines', label: 'Routines', icon: '📋' },
  { id: 'food', label: 'Food', icon: '🍽️' },
];

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Splash() {
  return (
    <div className="splash">
      <img src="/icon.svg" alt="" className="splash-logo" />
      <div className="splash-brand">REPFUEL</div>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <AuthView />;
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const { user, signOut } = useAuth();
  const { ready, sessions } = useData();
  const [tab, setTab] = useState<Tab>('home');
  const [trainKey, setTrainKey] = useState(0);
  const [menu, setMenu] = useState(false);

  if (!ready) return <Splash />;

  const startRoutine = (r: Routine) => {
    const uid = user!.id;
    const existing = loadDraft(uid);
    if (existing && !window.confirm('A workout is already in progress. Discard it and start this routine?')) {
      setTab('train');
      return;
    }
    saveDraft(uid, newDraft(r, sessions));
    setTrainKey((k) => k + 1);
    setTab('train');
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/icon.svg" alt="" className="topbar-logo" />
          <span>REPFUEL</span>
        </div>
        <button className="avatar" onClick={() => setMenu(!menu)} aria-label="Account menu">
          {user!.name[0]?.toUpperCase() ?? 'A'}
        </button>
        {menu && (
          <div className="menu" onClick={() => setMenu(false)}>
            <div className="menu-user">
              <div className="menu-name">{user!.name}</div>
              <div className="dim menu-email">{user!.email ?? 'Local device account'}</div>
            </div>
            <button className="menu-item danger" onClick={() => signOut()}>Sign out</button>
          </div>
        )}
      </header>

      <main className="content">
        {tab === 'home' && <Dashboard onTrain={() => setTab('train')} />}
        {tab === 'train' && <TrainView key={trainKey} />}
        {tab === 'routines' && <RoutinesView onStart={startRoutine} />}
        {tab === 'food' && <FoodView />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'tab-on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
