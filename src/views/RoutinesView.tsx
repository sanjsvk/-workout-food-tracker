import { useState } from 'react';
import { useData } from '../lib/data';
import { exName } from '../lib/exercises';
import { ExercisePicker } from '../components/ExercisePicker';
import type { Routine, RoutineItem } from '../lib/types';

export function RoutinesView({ onStart }: { onStart: (r: Routine) => void }) {
  const { routines, saveRoutine, deleteRoutine } = useData();
  const [editing, setEditing] = useState<Routine | null>(null);

  const builtins = routines.filter((r) => r.builtin);
  const custom = routines.filter((r) => !r.builtin);

  const newRoutine = () =>
    setEditing({ id: crypto.randomUUID(), name: '', items: [] });

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Routines</h1>
        <button className="btn btn-primary btn-sm" onClick={newRoutine}>+ New</button>
      </div>

      {custom.length > 0 && <div className="section-label">My routines</div>}
      {custom.map((r) => (
        <RoutineCard
          key={r.id}
          r={r}
          onStart={onStart}
          onEdit={() => setEditing(r)}
          onDelete={() => {
            if (window.confirm(`Delete "${r.name}"?`)) deleteRoutine(r.id);
          }}
        />
      ))}

      <div className="section-label">Templates</div>
      {builtins.map((r) => (
        <RoutineCard key={r.id} r={r} onStart={onStart} />
      ))}

      {editing && (
        <RoutineEditor
          initial={editing}
          onSave={(r) => {
            saveRoutine(r);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function RoutineCard({
  r,
  onStart,
  onEdit,
  onDelete,
}: {
  r: Routine;
  onStart: (r: Routine) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="card routine-card">
      <div className="routine-row">
        <span className="routine-emoji">{r.emoji ?? '📋'}</span>
        <div className="routine-info">
          <div className="routine-name">{r.name}</div>
          <div className="dim routine-sub">
            {r.items.map((i) => `${exName(i.exerciseId)} ${i.targetSets}×${i.targetReps}`).join(' · ')}
          </div>
        </div>
      </div>
      <div className="routine-btns">
        <button className="btn btn-primary btn-sm" onClick={() => onStart(r)}>Start</button>
        {onEdit && <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>}
        {onDelete && <button className="btn btn-ghost btn-sm danger" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}

function RoutineEditor({
  initial,
  onSave,
  onClose,
}: {
  initial: Routine;
  onSave: (r: Routine) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [items, setItems] = useState<RoutineItem[]>(initial.items);
  const [picker, setPicker] = useState(false);

  const setItem = (i: number, patch: Partial<RoutineItem>) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{initial.name ? 'Edit routine' : 'New routine'}</div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <input
          className="input"
          placeholder="Routine name (e.g. Push A)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="editor-items">
          {items.map((it, i) => (
            <div key={i} className="editor-row">
              <span className="editor-ex">{exName(it.exerciseId)}</span>
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                min={1}
                value={it.targetSets || ''}
                onChange={(e) => setItem(i, { targetSets: Math.max(1, parseInt(e.target.value) || 1) })}
              />
              <span className="dim">×</span>
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                min={1}
                value={it.targetReps || ''}
                onChange={(e) => setItem(i, { targetReps: Math.max(1, parseInt(e.target.value) || 1) })}
              />
              <button className="btn-icon dim" onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <button className="btn-link" onClick={() => setPicker(true)}>+ Add exercise</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim() || items.length === 0}
          onClick={() => onSave({ ...initial, name: name.trim(), items })}
        >
          Save routine
        </button>
        {picker && (
          <ExercisePicker
            onPick={(id) => setItems((prev) => [...prev, { exerciseId: id, targetSets: 3, targetReps: 10 }])}
            onClose={() => setPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
