import { useEffect, useRef } from 'react';
import type { PRHit } from '../lib/calc';
import { exName } from '../lib/exercises';

const COLORS = ['#b6f043', '#4cc9f0', '#f0b429', '#f072a9', '#ffffff'];

/** Full-screen confetti + PR summary shown when a personal record is broken. */
export function Celebration({ hits, unit, onClose }: { hits: PRHit[]; unit: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    navigator.vibrate?.([60, 40, 120]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);

    interface P {
      x: number; y: number; vx: number; vy: number;
      w: number; h: number; rot: number; vr: number; color: string;
    }
    const parts: P[] = Array.from({ length: 140 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.5,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3.5,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (now - start < 3200) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="celebrate-overlay">
      <canvas ref={canvasRef} className="celebrate-canvas" />
      <div className="celebrate-card">
        <div className="celebrate-trophy">🏆</div>
        <div className="celebrate-title">NEW PR!</div>
        <div className="celebrate-list">
          {hits.map((h, i) => (
            <div key={i} className="celebrate-row">
              <span className="celebrate-ex">{exName(h.exerciseId)}</span>
              <span className="celebrate-delta">
                {h.kind === 'weight' ? 'Top weight' : 'Est. 1RM'}: {h.prev} → <b>{h.value}</b> {unit}
              </span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onClose}>
          Keep going 💪
        </button>
      </div>
    </div>
  );
}
