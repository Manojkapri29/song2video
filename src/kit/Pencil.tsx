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

const INK = '#4a4038';

/** Strokes draw one after another across 0..1 of the drawing's own progress. */
export const PencilDrawing: React.FC<{strokes: Drawing; p: number; faded?: number}> =
({strokes, p, faded = 1}) => (
  <svg viewBox="0 0 100 70" style={{width: '100%', height: '100%', overflow: 'visible'}}>
    {strokes.map((s, i) => {
      const slot = 1 / strokes.length;
      const local = interpolate(p, [i * slot, (i + 1) * slot], [0, 1],
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
  <div style={{position: 'absolute', inset: 0, background: '#efe7d8', overflow: 'hidden'}}>
    <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5}}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity={0.4} />
    </svg>
    <div style={{position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 45%, rgba(255,250,240,.55) 0%, rgba(120,100,78,.16) 100%)'}} />
    {children}
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
      boxShadow: 'inset 0 0 120px rgba(90,74,56,.3)'}} />
  </div>
);
