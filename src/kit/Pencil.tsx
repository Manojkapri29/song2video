import React from 'react';
import {interpolate} from 'remotion';

/**
 * Pencil drawing primitives. A drawing is a list of strokes in a 0..100 x 0..70 box;
 * each stroke draws itself in order, the way a hand would lay it down.
 *
 * `pathLength={1}` normalises every path, so the dash animation needs no measuring.
 */
export type Stroke = {d: string; w?: number; o?: number; hatch?: boolean};
export type Drawing = Stroke[];

const INK = '#3a3029';

/** Deterministic noise so every render lays the same dots down. */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Cross-hatch fill for a box: short parallel strokes at `angle`, enough of them to read
 * as tone rather than as lines. This is what separates an outline from an ink drawing.
 */
export const hatch = (
  x: number, y: number, w: number, h: number,
  {n = 28, angle = -55, len = 6, seed = 1, o = 0.22, jitter = 1}: Partial<{
    n: number; angle: number; len: number; seed: number; o: number; jitter: number;
  }> = {},
): Stroke[] => {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
  return Array.from({length: n}, (_, i) => {
    const px = x + rnd(seed + i * 2.1) * w + (rnd(seed + i) - 0.5) * jitter;
    const py = y + rnd(seed + i * 3.7) * h + (rnd(seed + i * 1.3) - 0.5) * jitter;
    return {d: `M ${px.toFixed(2)} ${py.toFixed(2)} l ${dx.toFixed(2)} ${dy.toFixed(2)}`,
            w: 0.22, o: o * (0.6 + rnd(seed + i * 5.1) * 0.7), hatch: true};
  });
};

/** Stipple: dots rather than lines, for soft tone (sky, mist, distance). */
export const stipple = (
  x: number, y: number, w: number, h: number,
  {n = 60, seed = 1, o = 0.3, r = 0.18}: Partial<{n: number; seed: number; o: number; r: number}> = {},
): Stroke[] =>
  Array.from({length: n}, (_, i) => {
    const px = x + rnd(seed + i * 1.7) * w;
    const py = y + rnd(seed + i * 4.3) * h;
    return {d: `M ${px.toFixed(2)} ${py.toFixed(2)} l 0.14 0.09`,
            w: r * (0.7 + rnd(seed + i * 2.9) * 0.8) * 1.6,
            o: o * (0.5 + rnd(seed + i * 6.1) * 0.8), hatch: true};
  });



/** Strokes draw one after another across 0..1 of the drawing's own progress. */
export const PencilDrawing: React.FC<{strokes: Drawing; p: number; faded?: number}> =
({strokes, p, faded = 1}) => (
  <svg viewBox="0 0 100 70" style={{width: '100%', height: '100%', overflow: 'visible'}}>
    {strokes.map((s, i) => {
      // outlines draw in sequence; shading fades in across the back half, as a hand shades last
      const slot = 1 / strokes.length;
      const local = s.hatch
        ? interpolate(p, [0.3, 0.85], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
        : interpolate(p, [i * slot, (i + 1) * slot], [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      if (local <= 0) return null;
      return (
        <path key={i} d={s.d} pathLength={1} fill="none" stroke={INK}
          strokeWidth={(s.w ?? 0.35) * (s.hatch ? 0.7 : 1) * 1.35}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={(s.o ?? (s.hatch ? 0.35 : 0.85)) * faded}
          strokeDasharray={1} strokeDashoffset={1 - local} />
      );
    })}
  </svg>
);

/** Warm sketchbook paper: grain, a soft edge shadow, and the faintest rule. */
export const Paper: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', inset: 0, background: '#e8dcc3', overflow: 'hidden'}}>
    <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5}}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity={0.55} />
    </svg>
    <div style={{position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 42% 40%, rgba(255,252,242,.5) 0%, rgba(120,96,62,.26) 100%)'}} />
    {children}
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
      boxShadow: 'inset 0 0 150px rgba(86,66,40,.42)'}} />
  </div>
);
