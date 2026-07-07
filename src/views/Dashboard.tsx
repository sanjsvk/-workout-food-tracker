import { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useData } from '../lib/data';
import {
  macroTotals,
  weekStreak,
  dayStreak,
  weekStart,
  parseISODate,
  prEvents,
  progression,
  weeklyVolume,
  bestByExercise,
  fmtDateShort,
} from '../lib/calc';
import { exName } from '../lib/exercises';
import { LineChart, Ring, Bars } from '../components/charts';

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Dashboard({ onTrain }: { onTrain: () => void }) {
  const { user } = useAuth();
  const { sessions, todayFood, goals } = useData();

  const totals = macroTotals(todayFood.items);
  const dates = useMemo(() => sessions.map((s) => s.date), [sessions]);
  const wStreak = weekStreak(dates);
  const dStreak = dayStreak(dates);

  const thisWeekKey = weekStart(new Date()).getTime();
  const weekCount = sessions.filter((s) => weekStart(parseISODate(s.date)).getTime() === thisWeekKey).length;

  const events = useMemo(() => prEvents(sessions).slice(-4).reverse(), [sessions]);

  const exOptions = useMemo(() => {
    const ids = [...bestByExercise(sessions).keys()];
    return ids.map((id) => ({ id, name: exName(id) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);

  const [exSel, setExSel] = useState<string | null>(null);
  const [metric, setMetric] = useState<'e1rm' | 'weight'>('e1rm');
  const exId = exSel ?? exOptions[0]?.id ?? null;

  const chartData = useMemo(() => {
    if (!exId) return [];
    return progression(sessions, exId).map((r) => ({
      t: parseISODate(r.date).getTime(),
      v: metric === 'e1rm' ? r.e1rm : r.topWeight,
      label: fmtDateShort(r.date),
    }));
  }, [sessions, exId, metric]);

  const vol = useMemo(() => weeklyVolume(sessions, 8), [sessions]);
  const firstName = user!.name.split(' ')[0];

  if (sessions.length === 0) {
    return (
      <div className="page">
        <div className="hello">
          <div>
            <div className="hello-hi">{greeting()},</div>
            <div className="hello-name">{firstName}</div>
          </div>
        </div>
        <div className="card empty-hero">
          <div className="empty-emoji">🏋️</div>
          <h2>Let's get that first session in</h2>
          <p className="dim">Log your first workout and this page turns into your progress dashboard — PRs, streaks, strength charts and weekly volume.</p>
          <button className="btn btn-primary" onClick={onTrain}>Start a workout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="hello">
        <div>
          <div className="hello-hi">{greeting()},</div>
          <div className="hello-name">{firstName}</div>
        </div>
        <div className="streak-chip" title="Week streak">
          🔥 {wStreak} wk{dStreak > 1 ? ` · ${dStreak}d` : ''}
        </div>
      </div>

      <div className="rings-row card">
        <Ring
          value={weekCount}
          max={goals.workoutsPerWeek}
          label={`${weekCount}/${goals.workoutsPerWeek}`}
          sub="workouts"
          color="var(--accent)"
        />
        <Ring
          value={totals.calories}
          max={goals.calories}
          label={String(totals.calories)}
          sub="kcal today"
          color="var(--cal)"
        />
        <Ring
          value={totals.protein}
          max={goals.protein}
          label={`${totals.protein}g`}
          sub="protein"
          color="var(--prot)"
        />
      </div>

      {events.length > 0 && (
        <div className="card">
          <div className="card-title">Recent PRs</div>
          {events.map((e, i) => (
            <div key={i} className="pr-row">
              <span className="pr-ico">{e.first ? '🎯' : '🏆'}</span>
              <span className="pr-name">{exName(e.exerciseId)}</span>
              <span className="pr-val">
                {e.weight}
                {goals.unit}×{e.reps}
                {e.first ? ' · baseline' : ''}
              </span>
              <span className="pr-date dim">{fmtDateShort(e.date)}</span>
            </div>
          ))}
        </div>
      )}

      {exId && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Strength</div>
            <div className="seg">
              <button className={metric === 'e1rm' ? 'seg-on' : ''} onClick={() => setMetric('e1rm')}>
                Est. 1RM
              </button>
              <button className={metric === 'weight' ? 'seg-on' : ''} onClick={() => setMetric('weight')}>
                Top set
              </button>
            </div>
          </div>
          <select className="input select" value={exId} onChange={(e) => setExSel(e.target.value)}>
            {exOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <LineChart data={chartData} yFmt={(v) => `${Math.round(v)} ${goals.unit}`} />
          <div className="chart-hint dim">drag on the chart to scrub through sessions</div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Weekly volume ({goals.unit})</div>
        <Bars data={vol.map((w) => ({ label: w.label, value: w.total }))} />
      </div>
    </div>
  );
}
