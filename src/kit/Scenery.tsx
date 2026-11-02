import React from 'react';

/**
 * Hand-drawn vector scenery for the storybook preset.
 *
 * Everything here is plain SVG on a 1920x1080 viewBox, split into named depth layers so the
 * page can drift each one at its own rate. No filters per layer: at 1080p over five thousand
 * frames an feTurbulence on every ridge costs more than the whole render, so the paper texture
 * is a single CSS overlay up in Storybook instead.
 */

export type Palette = {
  sky: [string, string];
  haze: string;
  far: string;
  mid: string;
  near: string;
  ink: string;
  warm: string;   // sun / lamp / flower accent
  snow: string;
};

export const PALETTES: Record<string, Palette> = {
  dawn:    {sky: ['#f7d9a8', '#f0a97f'], haze: '#f6cfae', far: '#9d8aa8', mid: '#6f6484', near: '#4a4260',
            ink: '#2b2338', warm: '#ff9b4a', snow: '#fff3e2'},
  morning: {sky: ['#cfe6f2', '#f6e7cf'], haze: '#e8f0ef', far: '#9fb4ae', mid: '#6f8b7d', near: '#44604f',
            ink: '#25332a', warm: '#f0a93f', snow: '#ffffff'},
  midday:  {sky: ['#bfe0f0', '#eaf3ef'], haze: '#dcebe6', far: '#9dbdb2', mid: '#6b9076', near: '#3f6245',
            ink: '#21321f', warm: '#e8542f', snow: '#ffffff'},
  bloom:   {sky: ['#f3e3ef', '#fae6d9'], haze: '#f6e2e6', far: '#b79cb0', mid: '#8a6f84', near: '#5c4457',
            ink: '#38222f', warm: '#d6355a', snow: '#fff0f3'},
  golden:  {sky: ['#f8d79a', '#e8905a'], haze: '#f3c9a2', far: '#a37f72', mid: '#7a5650', near: '#4e3436',
            ink: '#2c1c1f', warm: '#ffb347', snow: '#ffe9cf'},
  dusk:    {sky: ['#e8a07a', '#8b5f86'], haze: '#d99a8c', far: '#7d6180', mid: '#55425f', near: '#342840',
            ink: '#1d1526', warm: '#ffc46b', snow: '#ffdcc0'},
  storm:   {sky: ['#8fa0ad', '#5b6b79'], haze: '#9fb0ba', far: '#6a7b87', mid: '#4b5a66', near: '#2f3a44',
            ink: '#1a2027', warm: '#e8d59a', snow: '#e6eef3'},
  night:   {sky: ['#1b2a4a', '#0a1020'], haze: '#2b3d63', far: '#2a3755', mid: '#1d2740', near: '#121828',
            ink: '#070a12', warm: '#ffd27a', snow: '#dfe8ff'},
};

/** Deterministic 0..1 noise so a ridge is hand-drawn but identical on every frame. */
const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Where each peak of a ridge sits. Asymmetric on purpose: equal cones read as wallpaper. */
export const peaksOf = (seed: number, baseY: number, height: number, n: number) =>
  Array.from({length: n}, (_, i) => {
    const span = 2040 / n;
    const left = -60 + i * span;
    const h = height * (0.38 + 0.62 * rnd(seed + i));
    // the summit leans left or right inside its own span, so no two shoulders match
    const lean = 0.26 + 0.48 * rnd(seed + i + 31);
    return {left, span, h, x: left + span * lean, y: baseY - h + height * 0.12 * rnd(seed + i + 61)};
  });

/** One mountain ridge as a closed path across the full width. */
export const ridge = (seed: number, baseY: number, height: number, n: number) => {
  const ps = peaksOf(seed, baseY, height, n);
  const d: string[] = [`M -60 1140`, `L -60 ${(baseY - ps[0].h * 0.45).toFixed(0)}`];
  ps.forEach((p, i) => {
    const next = ps[i + 1];
    const valley = next
      ? {x: (p.x + next.x) / 2, y: baseY - height * 0.07 * (0.4 + rnd(seed + i + 101))}
      : {x: 1980, y: baseY - p.h * 0.3};
    // up to the summit with a steep shoulder, down into the valley with a long shallow one
    d.push(`Q ${(p.left + (p.x - p.left) * 0.62).toFixed(0)} ${(p.y + p.h * 0.3).toFixed(0)} ${p.x.toFixed(0)} ${p.y.toFixed(0)}`);
    d.push(`Q ${(p.x + (valley.x - p.x) * 0.45).toFixed(0)} ${(p.y + p.h * 0.42).toFixed(0)} ${valley.x.toFixed(0)} ${valley.y.toFixed(0)}`);
  });
  d.push(`L 1980 1140`, 'Z');
  return d.join(' ');
};

/** Snow cap sitting on one peak of a ridge, following the same lean. */
export const SnowCaps: React.FC<{seed: number; baseY: number; height: number; peaks: number; fill: string}> =
({seed, baseY, height, peaks, fill}) => (
  <>
    {peaksOf(seed, baseY, height, peaks).filter((p) => p.h > height * 0.55).map((p, i) => {
      const w = Math.min(p.span * 0.3, p.h * 0.34);
      const drop = p.h * 0.2;
      return (
        <path key={i} d={`M ${p.x - w} ${p.y + drop} Q ${p.x - w * 0.34} ${p.y + drop * 0.22} ${p.x} ${p.y}
          Q ${p.x + w * 0.4} ${p.y + drop * 0.3} ${p.x + w * 0.92} ${p.y + drop * 1.05}
          Q ${p.x + w * 0.3} ${p.y + drop * 0.5} ${p.x - w * 0.1} ${p.y + drop * 0.72}
          Q ${p.x - w * 0.6} ${p.y + drop * 0.5} ${p.x - w} ${p.y + drop} Z`} fill={fill} opacity={0.94} />
      );
    })}
  </>
);

export const Pine: React.FC<{x: number; y: number; s: number; fill: string}> = ({x, y, s, fill}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
    <rect x={-4} y={-18} width={8} height={30} rx={3} />
    <path d="M 0 -150 L 34 -72 L 13 -72 L 44 -14 L -44 -14 L -13 -72 L -34 -72 Z" />
  </g>
);

/** Kumaoni house: stone walls, slate roof, a lit window when `glow` is set. */
export const House: React.FC<{x: number; y: number; s: number; wall: string; roof: string; glow?: string}> =
({x, y, s, wall, roof, glow}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={66} ry={9} fill={roof} opacity={0.3} />
    <rect x={-46} y={-56} width={92} height={58} fill={wall} stroke={roof} strokeWidth={3} />
    <path d="M -64 -54 L 0 -98 L 64 -54 Z" fill={roof} />
    <rect x={-56} y={-57} width={112} height={8} rx={3} fill={roof} />
    {glow
      ? <rect x={-20} y={-44} width={24} height={24} rx={2} fill={glow} />
      : <rect x={-20} y={-44} width={24} height={24} rx={2} fill={roof} opacity={0.55} />}
    <rect x={14} y={-40} width={18} height={42} rx={2} fill={roof} opacity={glow ? 0.5 : 0.7} />
  </g>
);

/**
 * Stepped hill farming terraces — the shape that says Uttarakhand before anything else does.
 * Each step is a filled band plus a visible riser face, so it reads as cut earth rather than
 * as lines drawn on a flat field.
 */
export const Terraces: React.FC<{y: number; rows: number; fill: string; edge: string}> =
({y, rows, fill, edge}) => (
  <g>
    <path d={`M -60 ${y + 30} Q 960 ${y - 40} 1980 ${y + 24} L 1980 1140 L -60 1140 Z`} fill={fill} />
    {Array.from({length: rows}, (_, i) => {
      const ty = y + 34 + i * 58;
      const sag = 54 - i * 6;
      const shade = 0.1 + i * 0.045;
      return (
        <g key={i}>
          {/* riser: the vertical cut face, darker than the flat it holds up */}
          <path d={`M -60 ${ty} Q 960 ${ty - sag} 1980 ${ty - sag * 0.2}
            L 1980 ${ty - sag * 0.2 + 17} Q 960 ${ty - sag + 17} -60 ${ty + 17} Z`}
            fill={edge} opacity={shade + 0.22} />
          {/* flat: the planted step itself */}
          <path d={`M -60 ${ty + 17} Q 960 ${ty - sag + 17} 1980 ${ty - sag * 0.2 + 17}
            L 1980 ${ty - sag * 0.2 + 58} Q 960 ${ty - sag + 58} -60 ${ty + 58} Z`}
            fill={fill} opacity={1 - shade} />
          <path d={`M -60 ${ty + 17} Q 960 ${ty - sag + 17} 1980 ${ty - sag * 0.2 + 17}`}
            stroke={edge} strokeWidth={2.5} fill="none" opacity={0.4} />
        </g>
      );
    })}
  </g>
);

/** Rhododendron (buransh) sprig — Uttarakhand's state flower, the red one on every hillside. */
export const Buransh: React.FC<{x: number; y: number; s: number; warm: string; leaf: string}> =
({x, y, s, warm, leaf}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 60 Q -6 20 2 -16" stroke={leaf} strokeWidth={6} fill="none" />
    <path d="M 2 18 Q -34 8 -44 -18 Q -12 -16 2 4 Z" fill={leaf} />
    <path d="M 2 30 Q 36 22 48 -4 Q 16 -4 2 16 Z" fill={leaf} opacity={0.85} />
    {[[-18, -34, 15], [10, -44, 17], [-2, -18, 13], [26, -26, 12], [-30, -12, 11]].map(([fx, fy, r], i) => (
      <circle key={i} cx={fx} cy={fy} r={r} fill={warm} opacity={0.92 - i * 0.06} />
    ))}
  </g>
);

/** Standing figure. `pose` changes the silhouette without changing the body. */
export const Figure: React.FC<{x: number; y: number; s: number; fill: string; pose?: 'stand' | 'flute' | 'pot'}> =
({x, y, s, fill, pose = 'stand'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
    <circle cx={0} cy={-104} r={17} />
    <path d="M -15 -86 Q 0 -92 15 -86 L 20 -24 Q 0 -18 -20 -24 Z" />
    <path d="M -17 -24 L -13 34 L -5 34 L -4 -22 Z" />
    <path d="M 17 -24 L 13 34 L 5 34 L 4 -22 Z" />
    {pose === 'stand' && <path d="M -15 -80 L -30 -32 L -23 -29 L -8 -72 Z" />}
    {pose === 'stand' && <path d="M 15 -80 L 30 -32 L 23 -29 L 8 -72 Z" />}
    {pose === 'flute' && (
      <>
        <path d="M -14 -80 L -30 -74 L -29 -66 L -10 -70 Z" />
        <path d="M 14 -80 L 34 -70 L 32 -62 L 10 -70 Z" />
        <rect x={-34} y={-80} width={74} height={5} rx={2.5} transform="rotate(-10 0 -78)" />
      </>
    )}
    {pose === 'pot' && (
      <>
        <path d="M -15 -80 L -26 -104 L -18 -108 L -7 -84 Z" />
        <path d="M 15 -80 L 26 -104 L 18 -108 L 7 -84 Z" />
        <ellipse cx={0} cy={-128} rx={25} ry={19} />
        <rect x={-14} y={-146} width={28} height={10} rx={4} />
      </>
    )}
  </g>
);

export const Birds: React.FC<{seed: number; fill: string; n?: number}> = ({seed, fill, n = 7}) => (
  <g stroke={fill} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.65}>
    {Array.from({length: n}, (_, i) => {
      const x = 240 + rnd(seed + i) * 1400;
      const y = 120 + rnd(seed + i + 40) * 260;
      const w = 13 + rnd(seed + i + 80) * 10;
      return <path key={i} d={`M ${x - w} ${y} q ${w} ${-w * 0.6} ${w} 0 q 0 ${-w * 0.6} ${w} 0`} />;
    })}
  </g>
);

export const Stars: React.FC<{seed: number; fill: string; n?: number}> = ({seed, fill, n = 110}) => (
  <g fill={fill}>
    {Array.from({length: n}, (_, i) => (
      <circle key={i} cx={rnd(seed + i) * 1920} cy={rnd(seed + i + 500) * 620}
        r={0.8 + rnd(seed + i + 900) * 2.1} opacity={0.35 + rnd(seed + i + 300) * 0.6} />
    ))}
  </g>
);

/** Slanted rain. `phase` 0..1 scrolls it so the drops fall. */
export const Rain: React.FC<{phase: number; fill: string; n?: number}> = ({phase, fill, n = 120}) => (
  <g stroke={fill} strokeWidth={2} opacity={0.3} strokeLinecap="round">
    {Array.from({length: n}, (_, i) => {
      const x = rnd(i) * 2200 - 140;
      const y = ((rnd(i + 70) + phase) % 1) * 1240 - 80;
      return <line key={i} x1={x} y1={y} x2={x - 26} y2={y + 74} />;
    })}
  </g>
);

export const PrayerFlags: React.FC<{x: number; y: number; w: number; sag: number}> = ({x, y, w, sag}) => {
  const cols = ['#d94f4f', '#e8c15a', '#4f8fd9', '#5fb87a', '#f2f2f2'];
  const n = 14;
  return (
    <g>
      <path d={`M ${x} ${y} Q ${x + w / 2} ${y + sag} ${x + w} ${y - 34}`} stroke="#3a2a22" strokeWidth={3} fill="none" />
      {Array.from({length: n}, (_, i) => {
        const t = (i + 0.5) / n;
        const fx = x + w * t;
        const fy = y + 2 * sag * t * (1 - t) - 34 * t * t;
        return <rect key={i} x={fx - 11} y={fy} width={22} height={28} rx={2} fill={cols[i % cols.length]} opacity={0.9} />;
      })}
    </g>
  );
};
