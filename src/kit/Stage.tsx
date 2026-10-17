import React from 'react';
import {AbsoluteFill, Img, Loop, OffthreadVideo, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Theme} from './theme';
import {useKenBurns} from './anim';
import {Parallax} from './Parallax';

/** Dark themes sink the picture so pale type reads; light themes must not, or it turns to mud. */
const gradeOf = (t: Theme) =>
  t.light ? 'saturate(1.04) contrast(1.04) brightness(.96)' : 'saturate(.85) contrast(1.05) brightness(.62)';
/** Scrim holds the chrome at top and bottom and leaves the middle open for the picture. */
const scrimOf = (t: Theme) => t.light
  ? `linear-gradient(180deg, ${t.bg}a6 0%, ${t.bg}1a 40%, ${t.bg}b3 100%)`
  : `linear-gradient(180deg, ${t.bg}b8 0%, ${t.bg}4d 38%, ${t.bg}db 100%)`;

/** Background layer for every preset: image, stone, or flat, always with a readable scrim. */
export type Backdrop =
  | {kind: 'flat'}
  | {kind: 'image'; src: string}
  /** still + depth map, filmed with a real camera move (see Parallax) */
  | {kind: 'parallax'; src: string; depth: string}
  /** the user's own clip, graded like a still; loopSec (its length) repeats it to fill the shot */
  | {kind: 'video'; src: string; loopSec?: number}
  /** nothing: the caller paints its own backdrop behind this Stage */
  | {kind: 'none'}
  | {kind: 'stone'}
  | {kind: 'gradient'};

export const Embers: React.FC<{theme: Theme; seed?: number; count?: number}> = ({theme, seed = 0, count}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const n = count ?? (height > width ? 24 : 34);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const r = (k: number) => random(`em-${seed}-${i}-${k}`);
        const life = height + 240;
        const y = life - ((frame * (28 + r(1) * 55) / 30 + r(3) * life) % life);
        const p = 1 - y / life;
        const d = 3 + r(4) * 6;
        return (
          <div key={i} style={{position: 'absolute', left: r(0) * width + (r(2) - 0.5) * 220 * p, top: y,
            width: d, height: d, borderRadius: '50%',
            background: r(5) > 0.55 ? theme.accent2 : theme.accent,
            opacity: Math.sin(p * Math.PI) * 0.7, filter: 'blur(1px)'}} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Falling petals — the light-theme counterpart to Embers. */
export const Petals: React.FC<{theme: Theme; seed?: number; count?: number}> = ({theme, seed = 0, count}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const n = count ?? (height > width ? 20 : 28);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const r = (k: number) => random(`pe-${seed}-${i}-${k}`);
        const life = height + 200;
        const y = (frame * (18 + r(1) * 30) / 30 + r(3) * life) % life - 100;
        const p = (y + 100) / life;
        const sway = Math.sin(frame / 26 + r(2) * 6.28) * 70;
        const w = 10 + r(4) * 16;
        return (
          <div key={i} style={{position: 'absolute', left: r(0) * width + sway, top: y,
            width: w, height: w * 0.62,
            borderRadius: '60% 60% 60% 0',
            background: r(5) > 0.5 ? theme.accent : theme.accent2,
            opacity: Math.sin(p * Math.PI) * 0.5,
            transform: `rotate(${frame * (0.6 + r(6)) + r(7) * 360}deg)`}} />
        );
      })}
    </AbsoluteFill>
  );
};

export const Rays: React.FC<{theme: Theme; spin?: number; opacity?: number}> = ({theme, spin = 0.0014, opacity = 0.2}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cx = width / 2;
  const cy = height * 0.46;
  const reach = Math.hypot(width, height);
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity}}>
      {Array.from({length: 18}).map((_, i) => {
        const a = (i / 18) * Math.PI * 2 + frame * spin;
        const r0 = reach * 0.3;                       // hollow core hides the convergence point
        return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0}
          x2={cx + Math.cos(a) * reach} y2={cy + Math.sin(a) * reach}
          stroke={theme.accent2} strokeWidth={i % 2 ? 2 : 6} />;
      })}
    </svg>
  );
};

const StoneWall: React.FC<{theme: Theme; idx: number; dur: number}> = ({theme, idx, dur}) => {
  const {width, height} = useVideoConfig();
  const COLS = 8;                                     // keep bricks ~2:1 at any aspect
  const ROWS = Math.round((COLS * height) / width / 0.5);
  return (
    <AbsoluteFill style={{...useKenBurns(dur, 1.06, 1.16, idx % 2 ? -2 : 2)}}>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`sg${idx}`} cx="50%" cy="44%" r="62%">
            <stop offset="0%" stopColor={theme.accent} stopOpacity={0.22} />
            <stop offset="55%" stopColor={theme.bg} />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill={`url(#sg${idx})`} />
        {Array.from({length: ROWS + 1}).map((_, r) =>
          Array.from({length: COLS + 1}).map((_, c) => {
            const bw = width / COLS;
            const bh = height / ROWS;
            const off = r % 2 ? bw / 2 : 0;
            const shade = 0.03 + random(`st-${idx % 4}-${r}-${c}`) * 0.055;
            return <rect key={`${r}-${c}`} x={c * bw - off} y={r * bh} width={bw - 5} height={bh - 5} rx={5}
              fill={`rgba(255,196,120,${shade})`} stroke="rgba(0,0,0,.45)" strokeWidth={2} />;
          }),
        )}
      </svg>
    </AbsoluteFill>
  );
};

/** A clip filling the shot: repeated from the top when it is shorter than the slot. */
const Clip: React.FC<{src: string; loopSec?: number; filter: string}> = ({src, loopSec, filter}) => {
  const {fps} = useVideoConfig();
  const video = (
    <OffthreadVideo src={staticFile(src)} muted
      style={{width: '100%', height: '100%', objectFit: 'cover', filter}} />
  );
  return loopSec ? <Loop durationInFrames={Math.max(1, Math.round(loopSec * fps))}>{video}</Loop> : video;
};

export const Stage: React.FC<{
  theme: Theme; backdrop?: Backdrop; idx?: number; dur: number;
  embers?: boolean; rays?: boolean; children?: React.ReactNode;
}> = ({theme, backdrop = {kind: 'flat'}, idx = 0, dur, embers, rays, children}) => {
  const {width, height} = useVideoConfig();
  const kb = useKenBurns(dur, 1.08, 1.2, idx % 2 ? -3 : 3);
  return (
    <AbsoluteFill style={{background: backdrop.kind === 'none' ? 'transparent' : theme.bg, overflow: 'hidden'}}>
      {backdrop.kind === 'parallax' && (
        <>
          <Parallax src={backdrop.src} depth={backdrop.depth} idx={idx} dur={dur} filter={gradeOf(theme)} />
          <AbsoluteFill style={{background: scrimOf(theme)}} />
        </>
      )}
      {backdrop.kind === 'video' && (
        <>
          <AbsoluteFill style={useKenBurns(dur, 1.04, 1.1, idx % 2 ? -2 : 2)}>
            <Clip src={backdrop.src} loopSec={backdrop.loopSec} filter={gradeOf(theme)} />
          </AbsoluteFill>
          <AbsoluteFill style={{background: scrimOf(theme)}} />
        </>
      )}
      {backdrop.kind === 'image' && (
        <>
          <AbsoluteFill style={kb}>
            <Img src={staticFile(backdrop.src)} style={{width: '100%', height: '100%', objectFit: 'cover',
              filter: theme.light
                ? 'saturate(1.02) contrast(1) brightness(1.02)'
                : 'saturate(.85) contrast(1.05) brightness(.62)'}} />
          </AbsoluteFill>
          <AbsoluteFill style={{background: theme.light
            ? `linear-gradient(180deg, ${theme.bg}99 0%, ${theme.bg}26 42%, ${theme.bg}bf 100%)`
            : `linear-gradient(180deg, ${theme.bg}b8 0%, ${theme.bg}4d 38%, ${theme.bg}db 100%)`}} />
        </>
      )}
      {backdrop.kind === 'stone' && <StoneWall theme={theme} idx={idx} dur={dur} />}
      {backdrop.kind === 'gradient' && (
        <AbsoluteFill style={{background:
          `radial-gradient(ellipse at 50% 40%, ${theme.accent}33 0%, ${theme.bg} 62%)`}} />
      )}
      {rays && <Rays theme={theme} opacity={theme.light ? 0.1 : 0.2} />}
      {embers && (theme.light ? <Petals theme={theme} seed={idx} /> : <Embers theme={theme} seed={idx} />)}
      <AbsoluteFill style={{background: theme.light
        ? `radial-gradient(ellipse at 50% 48%, rgba(255,255,255,0) 34%, ${theme.bg}9e 100%)`
        : `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 30%, rgba(0,0,0,.78) 100%)`,
        pointerEvents: 'none'}} />
      {children}
      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: theme.light
        ? `inset 0 0 ${Math.min(width, height) * 0.14}px ${theme.bg}`
        : `inset 0 0 ${Math.min(width, height) * 0.16}px rgba(0,0,0,.85)`}} />
    </AbsoluteFill>
  );
};
