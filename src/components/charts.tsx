import { useId, useRef, useState } from 'react';
import { fmtK } from '../lib/calc';

export interface Pt {
  t: number;
  v: number;
  label?: string;
}

/** Scrubbable line chart — drag/touch to inspect points. */
export function LineChart({
  data,
  color = 'var(--accent)',
  height = 170,
  yFmt = (v: number) => String(Math.round(v)),
}: {
  data: Pt[];
  color?: string;
  height?: number;
  yFmt?: (v: number) => string;
}) {
  const [scrub, setScrub] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const W = 360;
  const H = height;
  const PL = 10, PR = 10, PT = 22, PB = 18;

  if (data.length === 0) return <div className="chart-empty">No data yet — log a workout to see progress</div>;

  const ts = data.map((d) => d.t);
  const vs = data.map((d) => d.v);
  const t0 = Math.min(...ts), t1 = Math.max(...ts);
  const v0 = Math.min(...vs), v1 = Math.max(...vs);

  const x = (t: number) => (t1 === t0 ? W / 2 : PL + ((t - t0) / (t1 - t0)) * (W - PL - PR));
  const y = (v: number) => (v1 === v0 ? H / 2 : PT + (1 - (v - v0) / (v1 - v0)) * (H - PT - PB));

  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(d.t).toFixed(1)},${y(d.v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(t1).toFixed(1)},${H - PB} L${x(t0).toFixed(1)},${H - PB} Z`;

  const pick = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    let bi = 0;
    let bd = Infinity;
    data.forEach((d, i) => {
      const dd = Math.abs(x(d.t) - px);
      if (dd < bd) {
        bd = dd;
        bi = i;
      }
    });
    setScrub(bi);
  };

  const s = scrub !== null ? data[scrub] : null;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="chart"
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        pick(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0 || e.pointerType === 'touch') pick(e.clientX);
      }}
      onPointerUp={() => setScrub(null)}
      onPointerCancel={() => setScrub(null)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(d.t)}
          cy={y(d.v)}
          r={i === scrub ? 5 : 2.6}
          fill={i === scrub ? color : 'var(--bg)'}
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
      {s && (
        <g>
          <line x1={x(s.t)} x2={x(s.t)} y1={PT - 8} y2={H - PB} stroke="var(--dim)" strokeDasharray="3 3" />
          <text x={Math.min(Math.max(x(s.t), 55), W - 55)} y={13} textAnchor="middle" className="chart-label">
            {yFmt(s.v)}
            {s.label ? ` · ${s.label}` : ''}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Animated progress ring. */
export function Ring({
  value,
  max,
  size = 96,
  stroke = 9,
  color = 'var(--accent)',
  label,
  sub,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-arc"
        />
      </svg>
      <div className="ring-center">
        <div className="ring-value">{label}</div>
        {sub && <div className="ring-sub">{sub}</div>}
      </div>
    </div>
  );
}

/** Tappable weekly bars. */
export function Bars({ data, color = 'var(--accent)' }: { data: { label: string; value: number }[]; color?: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bars">
      {data.map((d, i) => (
        <button key={i} className="bar-col" onClick={() => setSel(sel === i ? null : i)}>
          <div className="bar-val">{sel === i ? fmtK(d.value) : ' '}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 2)}%`,
                background: color,
                opacity: sel === null || sel === i ? 1 : 0.35,
              }}
            />
          </div>
          <div className="bar-label">{d.label}</div>
        </button>
      ))}
    </div>
  );
}
