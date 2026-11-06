import React from 'react';
import {Blob, Motes, Ridge, Scene, shade, Sky, Stars} from './kit/Flat2D';

/** 1. The infinite worlds: a slow cosmos, rings opening outward as the question is asked. */
const galaxy: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top="#070a1c" bottom={shade(tint, 0.9)} glow={`${accent}33`} at={[50, 55]} />
    <Blob x={38} y={44} r={26} color={shade(tint, 1.8)} o={0.35 + mood * 0.2} blur={110} />
    <Blob x={64} y={58} r={18} color={accent} o={0.14 + beat * 0.1} blur={120} />
    <Stars n={160} seed={3} beat={beat} top={1} />
    {/* round things need a square viewport, or 16:9 flattens them into ellipses */}
    <svg viewBox="0 0 100 100"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      {[0, 1, 2, 3].map((i) => {
        const p = ((k * 0.9 + i * 0.25) % 1);
        return <circle key={i} cx={50} cy={50} r={6 + p * 46} fill="none"
          stroke={accent} strokeWidth={0.12} opacity={(1 - p) * 0.5} />;
      })}
      <circle cx={50} cy={50} r={5 + beat * 0.8} fill={shade(tint, 2.4)} opacity={0.9} />
      <circle cx={50} cy={50} r={8 + beat * 1.4} fill="none" stroke={accent}
        strokeWidth={0.25} opacity={0.3 + beat * 0.4} />
    </svg>
  </>
);

/** 2. The crow on the wish-tree: a bare branch against dusk, one bird that will not ask. */
const crow: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top={shade(tint, 0.5)} bottom={shade(tint, 1.5)} glow={`${accent}2e`} at={[72, 66]} />
    <svg viewBox="0 0 100 100"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <circle cx={72} cy={54} r={9} fill={shade(accent, 1.1)} opacity={0.22 + mood * 0.18} />
    </svg>
    <Ridge seed={11} color={shade(tint, 0.42)} base={78} amp={14} peaks={7}
      shift={-2 + k * 1.5} w={104} h={100} />
    <Ridge seed={23} color={shade(tint, 0.24)} base={88} amp={10} peaks={5}
      shift={-3 + k * 3} w={106} h={100} />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', left: `${-2 + k * 4}%`, top: 0, width: '104%', height: '100%'}}>
      {/* the bare wish-tree */}
      <path d="M 22 100 L 24 52 L 20 36 M 24 52 L 32 40 L 40 34 M 24 60 L 14 48 L 8 44
        M 24 46 L 30 30 M 24 70 L 34 62" stroke="#0b0806" strokeWidth={0.9} fill="none"
        strokeLinecap="round" />
      {/* the crow, breathing with the voice */}
      {/* the 100x100 box is stretched to 16:9, so the bird is squeezed back on x */}
      <g transform={`translate(32 36) scale(${0.5625 * (1 + beat * 0.05)} ${1 + beat * 0.05})`}>
        <ellipse cx={0} cy={0} rx={5.4} ry={3.4} fill="#0b0806" />
        <circle cx={4.4} cy={-2.6} r={2.1} fill="#0b0806" />
        <path d="M 6.2 -2.9 L 10 -2.2 L 6.2 -1.6 z" fill="#0b0806" />
        <path d="M -5 0.4 L -12 2.4 L -4.6 2.1 z" fill="#0b0806" />
        <path d="M -1 3.2 L -1 5.2 M 2 3.2 L 2 5.2" stroke="#0b0806" strokeWidth={0.5} />
      </g>
    </svg>
    <Motes n={26} seed={31} t={t} color={accent} speed={0.03} size={0.26} />
  </>
);

/** 6. The dissolution: everything burns, and the one who watches does not. */
const pralaya: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top="#120603" bottom={shade(tint, 1.1)} glow={`${accent}55`} at={[50, 88]} />
    <Blob x={50} y={92} r={38} color={accent} o={0.3 + mood * 0.35} blur={130} />
    <Ridge seed={51} color="#1a0b05" base={74} amp={18} peaks={6} shift={-2 + k * 2} w={104} h={100} />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      {/* flames: flat tongues whose height answers each syllable */}
      {Array.from({length: 9}, (_, i) => {
        const x = 8 + i * 10.5;
        const sway = Math.sin(t * 2.2 + i) * 1.4;
        const hgt = (9 + (i % 3) * 5) * (0.75 + beat * 0.85);
        return (
          <path key={i}
            d={`M ${x - 3.4} 100 Q ${x - 1.6 + sway} ${100 - hgt * 0.6} ${x + sway} ${100 - hgt}
                Q ${x + 1.8 + sway} ${100 - hgt * 0.55} ${x + 3.4} 100 z`}
            fill={i % 2 ? accent : shade(accent, 1.25)} opacity={0.55 + beat * 0.35} />
        );
      })}
    </svg>
    <Motes n={60} seed={57} t={t} color={shade(accent, 1.3)} speed={0.11} size={0.34} />
  </>
);

/** Scenes in the same order as the drawings and photographs. */
export const SCENES_2D: Record<string, Scene[]> = {
  anant: [galaxy, crow, galaxy, crow, crow, pralaya, crow, crow, galaxy],
};
export const scenesOf = (name?: string): Scene[] => SCENES_2D[name ?? ''] ?? [];
