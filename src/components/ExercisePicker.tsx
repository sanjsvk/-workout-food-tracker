import { useState } from 'react';
import { EXERCISES, MUSCLE_GROUPS } from '../lib/exercises';

/** Searchable, grouped exercise picker modal. */
export function ExercisePicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const filtered = query ? EXERCISES.filter((e) => e.name.toLowerCase().includes(query)) : EXERCISES;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Add exercise</div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <input
          className="input"
          placeholder="Search exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div className="picker-list">
          {MUSCLE_GROUPS.map((group) => {
            const items = filtered.filter((e) => e.muscle === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div className="picker-group">{group}</div>
                {items.map((e) => (
                  <button
                    key={e.id}
                    className="picker-item"
                    onClick={() => {
                      onPick(e.id);
                      onClose();
                    }}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
