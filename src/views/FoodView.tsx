import { useEffect, useState } from 'react';
import { useData } from '../lib/data';
import { macroTotals, todayISO, parseISODate, fmtDateShort } from '../lib/calc';
import { searchFoods, scalePer100, type FoodHit } from '../lib/nutrition';
import { Ring } from '../components/charts';
import type { FoodDay, FoodItem, MealSlot, Goals } from '../lib/types';

const MEALS: { slot: MealSlot; label: string; emoji: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { slot: 'lunch', label: 'Lunch', emoji: '🥗' },
  { slot: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { slot: 'snack', label: 'Snacks', emoji: '🍎' },
];

export function FoodView() {
  const { goals, setGoals, loadFoodDay, saveFoodDay, todayFood } = useData();
  const [date, setDate] = useState(todayISO());
  const [day, setDay] = useState<FoodDay | null>(null);
  const [adding, setAdding] = useState<MealSlot | null>(null);
  const [showGoals, setShowGoals] = useState(false);

  useEffect(() => {
    let live = true;
    loadFoodDay(date).then((d) => {
      if (live) setDay(d);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // stay in sync if today's food changes elsewhere
  useEffect(() => {
    if (date === todayFood.date) setDay(todayFood);
  }, [todayFood, date]);

  const shift = (days: number) => {
    const d = parseISODate(date);
    d.setDate(d.getDate() + days);
    setDate(todayISO(d));
  };

  const save = (items: FoodItem[]) => {
    const next = { date, items };
    setDay(next);
    saveFoodDay(next).catch((err) => console.error('food save failed', err));
  };

  if (!day) return <div className="page dim">Loading…</div>;

  const totals = macroTotals(day.items);
  const isToday = date === todayISO();

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Food</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowGoals(true)}>⚙ Goals</button>
      </div>

      <div className="date-nav">
        <button className="btn-icon" onClick={() => shift(-1)} aria-label="Previous day">‹</button>
        <span className="date-label">{isToday ? 'Today' : fmtDateShort(date)}</span>
        <button className="btn-icon" onClick={() => shift(1)} disabled={isToday} aria-label="Next day">›</button>
      </div>

      <div className="card food-summary">
        <Ring
          value={totals.calories}
          max={goals.calories}
          size={110}
          stroke={11}
          color="var(--cal)"
          label={String(totals.calories)}
          sub={`/ ${goals.calories} kcal`}
        />
        <div className="macro-bars">
          <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="var(--prot)" />
          <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color="var(--carb)" />
          <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color="var(--fat)" />
        </div>
      </div>

      {MEALS.map((m) => {
        const items = day.items.filter((i) => i.meal === m.slot);
        const kcal = Math.round(items.reduce((n, i) => n + i.calories, 0));
        return (
          <div key={m.slot} className="card meal-card">
            <div className="meal-head">
              <span>
                {m.emoji} {m.label} {kcal > 0 && <span className="dim">· {kcal} kcal</span>}
              </span>
              <button className="btn-icon accent" onClick={() => setAdding(m.slot)} aria-label={`Add to ${m.label}`}>＋</button>
            </div>
            {items.map((i) => (
              <div key={i.id} className="food-row">
                <div className="food-info">
                  <span className="food-name">{i.name}</span>
                  {i.qty && <span className="dim food-qty"> {i.qty}</span>}
                </div>
                <span className="food-macros dim">
                  {Math.round(i.calories)} kcal · P{Math.round(i.protein)} C{Math.round(i.carbs)} F{Math.round(i.fat)}
                </span>
                <button className="btn-icon dim" onClick={() => save(day.items.filter((x) => x.id !== i.id))} aria-label="Remove">✕</button>
              </div>
            ))}
          </div>
        );
      })}

      {adding && (
        <AddFoodSheet
          meal={adding}
          onAdd={(item) => save([...day.items, item])}
          onClose={() => setAdding(null)}
        />
      )}
      {showGoals && <GoalsModal goals={goals} onSave={setGoals} onClose={() => setShowGoals(false)} />}
    </div>
  );
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <div className="macro-bar">
      <div className="macro-bar-head">
        <span>{label}</span>
        <span className="dim">
          {value} / {goal}g
        </span>
      </div>
      <div className="macro-track">
        <div className="macro-fill" style={{ width: `${Math.min((value / Math.max(goal, 1)) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function AddFoodSheet({ meal, onAdd, onClose }: { meal: MealSlot; onAdd: (i: FoodItem) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'search' | 'manual'>('search');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<FoodHit[]>([]);
  const [sel, setSel] = useState<FoodHit | null>(null);
  const [grams, setGrams] = useState('100');

  const [mName, setMName] = useState('');
  const [mCal, setMCal] = useState('');
  const [mP, setMP] = useState('');
  const [mC, setMC] = useState('');
  const [mF, setMF] = useState('');

  const doSearch = async () => {
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    setSel(null);
    try {
      setResults(await searchFoods(q.trim()));
    } catch {
      setErr('Search failed — Open Food Facts may be rate-limiting. Try again in a minute or add manually.');
    } finally {
      setBusy(false);
    }
  };

  const addSelected = () => {
    if (!sel) return;
    const g = Math.max(1, parseFloat(grams) || 100);
    const m = scalePer100(sel.per100, g);
    onAdd({
      id: crypto.randomUUID(),
      name: sel.brand ? `${sel.name} (${sel.brand})` : sel.name,
      meal,
      qty: `${g}g`,
      ...m,
    });
    onClose();
  };

  const addManual = () => {
    const p = parseFloat(mP) || 0;
    const c = parseFloat(mC) || 0;
    const f = parseFloat(mF) || 0;
    const cal = mCal !== '' ? parseFloat(mCal) || 0 : Math.round(p * 4 + c * 4 + f * 9);
    if (!mName.trim() || cal <= 0) return;
    onAdd({ id: crypto.randomUUID(), name: mName.trim(), meal, calories: cal, protein: p, carbs: c, fat: f });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Add food</div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="seg seg-wide">
          <button className={tab === 'search' ? 'seg-on' : ''} onClick={() => setTab('search')}>🔍 Search</button>
          <button className={tab === 'manual' ? 'seg-on' : ''} onClick={() => setTab('manual')}>✏️ Manual</button>
        </div>

        {tab === 'search' ? (
          <>
            <div className="search-row">
              <input
                className="input"
                placeholder="e.g. greek yogurt"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={doSearch} disabled={busy || !q.trim()}>
                {busy ? '…' : 'Search'}
              </button>
            </div>
            {err && <div className="auth-msg">{err}</div>}
            <div className="picker-list">
              {results.map((r) => (
                <div key={r.id}>
                  <button className={`picker-item food-hit ${sel?.id === r.id ? 'sel' : ''}`} onClick={() => setSel(sel?.id === r.id ? null : r)}>
                    <span className="food-hit-name">
                      {r.name}
                      {r.brand && <span className="dim"> · {r.brand}</span>}
                    </span>
                    <span className="dim food-hit-macros">
                      {Math.round(r.per100.calories)} kcal · P{Math.round(r.per100.protein)} C{Math.round(r.per100.carbs)} F{Math.round(r.per100.fat)} /100g
                    </span>
                  </button>
                  {sel?.id === r.id && (
                    <div className="grams-row">
                      <input
                        className="input grams-input"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={grams}
                        onChange={(e) => setGrams(e.target.value)}
                      />
                      <span className="dim">grams</span>
                      <button className="btn btn-primary btn-sm" onClick={addSelected}>Add</button>
                    </div>
                  )}
                </div>
              ))}
              {!busy && results.length === 0 && q && !err && <div className="dim picker-empty">Search to find foods (data: Open Food Facts)</div>}
            </div>
          </>
        ) : (
          <>
            <input className="input" placeholder="Food name" value={mName} onChange={(e) => setMName(e.target.value)} />
            <div className="manual-grid">
              <label>Calories<input className="input" type="number" inputMode="numeric" placeholder="auto" value={mCal} onChange={(e) => setMCal(e.target.value)} /></label>
              <label>Protein (g)<input className="input" type="number" inputMode="decimal" value={mP} onChange={(e) => setMP(e.target.value)} /></label>
              <label>Carbs (g)<input className="input" type="number" inputMode="decimal" value={mC} onChange={(e) => setMC(e.target.value)} /></label>
              <label>Fat (g)<input className="input" type="number" inputMode="decimal" value={mF} onChange={(e) => setMF(e.target.value)} /></label>
            </div>
            <div className="dim manual-hint">Leave calories blank to auto-calculate from macros (4/4/9).</div>
            <button className="btn btn-primary" onClick={addManual} disabled={!mName.trim()}>Add food</button>
          </>
        )}
      </div>
    </div>
  );
}

function GoalsModal({ goals, onSave, onClose }: { goals: Goals; onSave: (g: Goals) => void; onClose: () => void }) {
  const [g, setG] = useState(goals);
  const num = (v: string, fb: number) => Math.max(0, parseInt(v) || fb);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Daily goals</div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="manual-grid">
          <label>Calories<input className="input" type="number" value={g.calories} onChange={(e) => setG({ ...g, calories: num(e.target.value, 2200) })} /></label>
          <label>Protein (g)<input className="input" type="number" value={g.protein} onChange={(e) => setG({ ...g, protein: num(e.target.value, 150) })} /></label>
          <label>Carbs (g)<input className="input" type="number" value={g.carbs} onChange={(e) => setG({ ...g, carbs: num(e.target.value, 220) })} /></label>
          <label>Fat (g)<input className="input" type="number" value={g.fat} onChange={(e) => setG({ ...g, fat: num(e.target.value, 70) })} /></label>
          <label>Workouts / week<input className="input" type="number" value={g.workoutsPerWeek} onChange={(e) => setG({ ...g, workoutsPerWeek: num(e.target.value, 4) })} /></label>
          <label>Weight unit
            <select className="input select" value={g.unit} onChange={(e) => setG({ ...g, unit: e.target.value as 'lb' | 'kg' })}>
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            onSave(g);
            onClose();
          }}
        >
          Save goals
        </button>
      </div>
    </div>
  );
}
