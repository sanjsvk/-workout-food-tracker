import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useData } from '../lib/data';
import { detectPRs, sessionVolume, fmtK, type PRHit } from '../lib/calc';
import { exName } from '../lib/exercises';
import { loadDraft, saveDraft, clearDraft, newDraft } from '../lib/draft';
import { ExercisePicker } from '../components/ExercisePicker';
import { Celebration } from '../components/Celebration';
import type { Routine, WorkoutSession } from '../lib/types';

export function TrainView() {
  const { user } = useAuth();
  const uid = user!.id;
  const { sessions, routines, addSession, goals } = useData();

  const [draft, setDraft] = useState<WorkoutSession | null>(() => loadDraft(uid));
  const [picker, setPicker] = useState(false);
  const [celeb, setCeleb] = useState<PRHit[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState('0:00');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!draft) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((Date.now() - draft.startedAt) / 1000));
      setElapsed(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [draft?.id, draft?.startedAt]);

  const update = (d: WorkoutSession) => {
    setDraft(d);
    saveDraft(uid, d);
  };

  const start = (routine: Routine | null) => update(newDraft(routine, sessions));

  /** Last logged sets per exercise (for "prev" hints). */
  const prevSets = useMemo(() => {
    const m = new Map<string, { weight: number; reps: number }[]>();
    if (!draft) return m;
    for (const ex of draft.exercises) {
      for (const s of sessions) {
        const f = s.exercises.find((e) => e.exerciseId === ex.exerciseId);
        if (f) {
          m.set(ex.exerciseId, f.sets);
          break;
        }
      }
    }
    return m;
  }, [draft?.exercises.map((e) => e.exerciseId).join(','), sessions]);

  const setField = (ei: number, si: number, field: 'weight' | 'reps', raw: string) => {
    if (!draft) return;
    const v = raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0);
    const exercises = draft.exercises.map((ex, i) =>
      i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => (j !== si ? s : { ...s, [field]: v })) }
    );
    update({ ...draft, exercises });
  };

  const toggleDone = (ei: number, si: number) => {
    if (!draft) return;
    const exercises = draft.exercises.map((ex, i) =>
      i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => (j !== si ? s : { ...s, done: !s.done })) }
    );
    update({ ...draft, exercises });
    navigator.vibrate?.(10);
  };

  const addSet = (ei: number) => {
    if (!draft) return;
    const exercises = draft.exercises.map((ex, i) => {
      if (i !== ei) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false }] };
    });
    update({ ...draft, exercises });
  };

  const removeSet = (ei: number, si: number) => {
    if (!draft) return;
    const exercises = draft.exercises
      .map((ex, i) => (i !== ei ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== si) }))
      .filter((ex) => ex.sets.length > 0);
    update({ ...draft, exercises });
  };

  const removeExercise = (ei: number) => {
    if (!draft) return;
    update({ ...draft, exercises: draft.exercises.filter((_, i) => i !== ei) });
  };

  const addExercise = (id: string) => {
    if (!draft) return;
    if (draft.exercises.some((e) => e.exerciseId === id)) return;
    update({ ...draft, exercises: [...draft.exercises, { exerciseId: id, sets: [{ weight: 0, reps: 0, done: false }] }] });
  };

  const cancel = () => {
    if (!draft) return;
    if (window.confirm('Discard this workout?')) {
      clearDraft(uid);
      setDraft(null);
    }
  };

  const finish = async () => {
    if (!draft) return;
    const exercises = draft.exercises
      .map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets.filter((s) => s.done && s.weight > 0 && s.reps > 0).map((s) => ({ weight: s.weight, reps: s.reps })),
      }))
      .filter((ex) => ex.sets.length > 0);
    if (exercises.length === 0) {
      setToast('Tap ✓ on your completed sets first');
      return;
    }
    const final: WorkoutSession = {
      ...draft,
      exercises,
      durationMin: Math.max(1, Math.round((Date.now() - draft.startedAt) / 60000)),
    };
    const hits = detectPRs(sessions, final);
    try {
      await addSession(final);
    } catch (err) {
      console.error(err);
      setToast('Save failed — check your connection and try again');
      return;
    }
    clearDraft(uid);
    setDraft(null);
    const nSets = exercises.reduce((n, e) => n + e.sets.length, 0);
    if (hits.length > 0) setCeleb(hits);
    else setToast(`Workout saved 💪 ${nSets} sets · ${fmtK(sessionVolume(final))} ${goals.unit} volume`);
  };

  if (!draft) {
    return (
      <div className="page">
        <h1 className="page-title">Train</h1>
        <button className="card start-card" onClick={() => start(null)}>
          <span className="start-emoji">⚡</span>
          <span>
            <span className="start-title">Quick start</span>
            <span className="dim start-sub">Empty workout — add exercises as you go</span>
          </span>
        </button>
        <div className="section-label">Start from a routine</div>
        {routines.map((r) => (
          <button key={r.id} className="card routine-start" onClick={() => start(r)}>
            <span className="routine-emoji">{r.emoji ?? '📋'}</span>
            <span className="routine-info">
              <span className="routine-name">{r.name}</span>
              <span className="dim routine-sub">
                {r.items.map((i) => exName(i.exerciseId)).slice(0, 3).join(' · ')}
                {r.items.length > 3 ? ` +${r.items.length - 3}` : ''}
              </span>
            </span>
            <span className="routine-go">›</span>
          </button>
        ))}
        {toast && <div className="toast">{toast}</div>}
        {celeb && <Celebration hits={celeb} unit={goals.unit} onClose={() => setCeleb(null)} />}
      </div>
    );
  }

  return (
    <div className="page workout">
      <div className="workout-head">
        <div>
          <div className="workout-name">{draft.name}</div>
          <div className="workout-timer">⏱ {elapsed}</div>
        </div>
        <div className="workout-actions">
          <button className="btn btn-ghost btn-sm" onClick={cancel}>Discard</button>
          <button className="btn btn-primary btn-sm" onClick={finish}>Finish</button>
        </div>
      </div>

      {draft.exercises.map((ex, ei) => {
        const prev = prevSets.get(ex.exerciseId);
        return (
          <div key={`${ex.exerciseId}-${ei}`} className="card ex-card">
            <div className="ex-head">
              <span className="ex-name">{exName(ex.exerciseId)}</span>
              <button className="btn-icon dim" onClick={() => removeExercise(ei)} aria-label="Remove exercise">✕</button>
            </div>
            <div className="set-grid set-grid-head dim">
              <span>SET</span>
              <span>PREV</span>
              <span>{goals.unit.toUpperCase()}</span>
              <span>REPS</span>
              <span>✓</span>
            </div>
            {ex.sets.map((s, si) => (
              <div key={si} className={`set-grid ${s.done ? 'set-done' : ''}`}>
                <button className="set-num" onClick={() => removeSet(ei, si)} title="Tap to remove set">
                  {si + 1}
                </button>
                <span className="set-prev dim">
                  {prev?.[si] ? `${prev[si].weight}×${prev[si].reps}` : '—'}
                </span>
                <input
                  className="set-input"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={s.weight || ''}
                  placeholder="0"
                  onChange={(e) => setField(ei, si, 'weight', e.target.value)}
                />
                <input
                  className="set-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={s.reps || ''}
                  placeholder="0"
                  onChange={(e) => setField(ei, si, 'reps', e.target.value)}
                />
                <button
                  className={`set-check ${s.done ? 'on' : ''}`}
                  onClick={() => toggleDone(ei, si)}
                  aria-label="Mark set done"
                >
                  ✓
                </button>
              </div>
            ))}
            <button className="btn-link" onClick={() => addSet(ei)}>+ Add set</button>
          </div>
        );
      })}

      <button className="btn btn-ghost add-ex" onClick={() => setPicker(true)}>+ Add exercise</button>

      {picker && <ExercisePicker onPick={addExercise} onClose={() => setPicker(false)} />}
      {toast && <div className="toast">{toast}</div>}
      {celeb && <Celebration hits={celeb} unit={goals.unit} onClose={() => setCeleb(null)} />}
    </div>
  );
}
