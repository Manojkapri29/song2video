import React from 'react';

/** What every 2D scene is handed: the clock, two loudness envelopes, and the passage's colour. */
export type SceneProps = {
  t: number;        // seconds into the video
  k: number;        // 0..1 progress through this scene
  beat: number;     // 0..1, loudness over 0.05s — syllables
  mood: number;     // 0..1, loudness over 0.5s — the passage
  tint: string;     // the block's colour
  accent: string;
  w: number;
  h: number;
};

export type Scene = React.FC<SceneProps>;

/** Deterministic 0..1 — every run draws the same sky. */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const shade = (c: string, f: number) => {
  const v = [1, 3, 5].map((i) => Math.round(Math.min(255, Math.max(0,
    parseInt(c.slice(i, i + 2), 16) * f))));
  return `rgb(${v[0]},${v[1]},${v[2]})`;
};

/** Flat two-stop sky, the whole backdrop of every scene. */
export const Sky: React.FC<{top: string; bottom: string; glow?: string; at?: [number, number]}> =
({top, bottom, glow, at = [50, 72]}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${top}, ${bottom})`}} />
    {glow ? <div style={{position: 'absolute', inset: 0,
      background: `radial-gradient(circle at ${at[0]}% ${at[1]}%, ${glow} 0%, rgba(0,0,0,0) 58%)`}} /> : null}
  </>
);

/** One silhouette ridge. `depth` 0 is far (small parallax), 1 is near. */
export const Ridge: React.FC<{seed: number; color: string; base: number; amp: number;
  peaks: number; shift: number; w: number; h: number}> =
({seed, color, base, amp, peaks, shift, w, h}) => {
  const pts: string[] = [];
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * 120 - 10;
    const y = base - (rnd(seed + i) * amp) - (i % 2 ? amp * 0.3 : 0);
    pts.push(`${x},${y}`);
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', left: `${shift}%`, top: 0, width: `${w}%`, height: `${h}%`}}>
      <polygon points={`-10,110 ${pts.join(' ')} 110,110`} fill={color} />
    </svg>
  );
};

/** A field of flat dots that brighten on the beat. */
export const Stars: React.FC<{n: number; seed: number; beat: number; size?: number; top?: number}> =
({n, seed, beat, size = 3, top = 0.72}) => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none"
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    {Array.from({length: n}, (_, i) => {
      const x = rnd(seed + i) * 100;
      const y = rnd(seed + i + 500) * 100 * top;
      const tw = 0.3 + 0.7 * rnd(seed + i + 900);
      return <circle key={i} cx={x} cy={y} r={(size * (0.4 + tw * 0.6)) / 18}
        fill="#fff" opacity={(0.25 + tw * 0.45) * (0.7 + beat * 0.6)} />;
    })}
  </svg>
);

/** Soft colour blob — nebula, mist, smoke. */
export const Blob: React.FC<{x: number; y: number; r: number; color: string; o?: number; blur?: number}> =
({x, y, r, color, o = 0.5, blur = 70}) => (
  <div style={{position: 'absolute', left: `${x - r}%`, top: `${y - r}%`,
    width: `${r * 2}%`, height: `${r * 2}%`, borderRadius: '50%', background: color,
    opacity: o, filter: `blur(${blur}px)`}} />
);

/** Particles rising — embers, dust, fireflies. */
export const Motes: React.FC<{n: number; seed: number; t: number; color: string; speed?: number; size?: number}> =
({n, seed, t, color, speed = 0.05, size = 0.4}) => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none"
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    {Array.from({length: n}, (_, i) => {
      const life = (t * speed * (0.5 + rnd(seed + i)) + rnd(seed + i + 70)) % 1;
      const x = rnd(seed + i + 140) * 100 + Math.sin(t * 0.6 + i) * 1.6;
      return <circle key={i} cx={x} cy={100 - life * 95} r={size * (0.5 + rnd(seed + i + 210))}
        fill={color} opacity={(1 - life) * 0.7} />;
    })}
  </svg>
);
