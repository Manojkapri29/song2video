import React from 'react';
import {Blob, Motes, Ridge, rnd, Scene, shade, Sky, Stars} from './kit/Flat2D';

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
    <Ridge seed={51} color="#1a0b05" base={68} amp={16} peaks={6} shift={-2 + k * 2} w={104} h={100} />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      {/* flames: flat tongues whose height answers each syllable */}
      {Array.from({length: 9}, (_, i) => {
        const x = 8 + i * 10.5;
        const sway = Math.sin(t * 2.2 + i) * 1.4;
        const hgt = (16 + (i % 3) * 9) * (0.75 + beat * 0.85);
        const b = 90;      // the letterbox eats the last 7%, so the fire stands on 90
        return (
          <path key={i}
            d={`M ${x - 4.2} ${b} Q ${x - 2 + sway} ${b - hgt * 0.6} ${x + sway} ${b - hgt}
                Q ${x + 2.2 + sway} ${b - hgt * 0.55} ${x + 4.2} ${b} z`}
            fill={i % 2 ? accent : shade(accent, 1.25)} opacity={0.55 + beat * 0.35} />
        );
      })}
    </svg>
    <Motes n={60} seed={57} t={t} color={shade(accent, 1.3)} speed={0.11} size={0.34} />
  </>
);


/** 3. The river of time: bands of water sliding past, a moon that does not move with them. */
const river: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top={shade(tint, 0.45)} bottom={shade(tint, 1.35)} glow={`${accent}22`} at={[28, 40]} />
    <svg viewBox="0 0 100 100" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <circle cx={30} cy={32} r={7} fill={shade(accent, 1.15)} opacity={0.3 + mood * 0.2} />
    </svg>
    <Ridge seed={61} color={shade(tint, 0.35)} base={62} amp={9} peaks={6} shift={-2 + k * 2} w={104} h={100} />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <rect x={-10} y={62} width={120} height={48} fill={shade(tint, 0.6)} />
      {Array.from({length: 11}, (_, i) => {
        const y = 65 + i * 3.4;
        const off = ((t * (2 + i * 0.5) + i * 23) % 140) - 20;
        return <rect key={i} x={off} y={y} width={16 + i * 2} height={0.8}
          fill="#fff" opacity={(0.14 + (i / 11) * 0.22) * (0.7 + beat * 0.7)} rx={0.4} />;
      })}
      {/* the moon, broken on the water */}
      {Array.from({length: 8}, (_, i) => (
        <rect key={`m${i}`} x={28 - i * 0.5 + Math.sin(t * 1.6 + i) * 0.8} y={65 + i * 4}
          width={4 + i * 1.6} height={1.1} rx={0.5} fill={shade(accent, 1.25)}
          opacity={(0.34 - i * 0.035) * (0.7 + beat * 0.5)} />
      ))}
    </svg>
    <Blob x={50} y={64} r={30} color={shade(tint, 1.5)} o={0.16 + mood * 0.1} blur={90} />
  </>
);

/** 4. The one who wants: a figure at the edge of a sea, and the sun it will not reach. */
const prince: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top={shade(tint, 0.4)} bottom={shade(accent, 1.1)} glow={`${accent}55`} at={[58, 64]} />
    <svg viewBox="0 0 100 100" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <circle cx={58} cy={60} r={11 + beat * 0.6} fill={shade(accent, 1.3)} opacity={0.6 + mood * 0.25} />
    </svg>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <rect x={-10} y={70} width={120} height={40} fill={shade(tint, 0.42)} />
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} x={54 - i * 0.9} y={72 + i * 3.6} width={8 + i * 2.4} height={1.1}
          fill={shade(accent, 1.25)} opacity={(0.3 - i * 0.03) * (0.7 + beat * 0.6)} rx={0.5} />
      ))}
      <rect x={-10} y={92} width={120} height={20} fill="#0b0806" />
      {/* the figure, small against all of it */}
      <g transform={`translate(${40 + k * 3} 92) scale(0.5625 1)`}>
        <ellipse cx={0} cy={-11} rx={2} ry={2.4} fill="#0b0806" />
        <path d="M -3 0 Q -3 -10 0 -10 Q 3 -10 3 0 z" fill="#0b0806" />
      </g>
    </svg>
    <Motes n={20} seed={71} t={t} color={shade(accent, 1.3)} speed={0.025} size={0.22} />
  </>
);

/** 5. One house, two ways of seeing it: the same walls warm on one side, cold on the other. */
const house: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top={shade(tint, 0.42)} bottom={shade(tint, 1.2)} glow={`${accent}2a`} at={[30, 70]} />
    <Ridge seed={81} color={shade(tint, 0.3)} base={80} amp={7} peaks={5} shift={-2 + k * 2} w={104} h={100} />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <rect x={-10} y={88} width={120} height={22} fill="#0b0806" />
      {/* lived in */}
      <g>
        <path d="M 18 88 L 18 66 L 42 66 L 42 88 z" fill="#0f0a07" />
        <path d="M 14 67 L 30 54 L 46 67 z" fill="#0f0a07" />
        <rect x={26} y={74} width={8} height={10} fill={shade(accent, 1.35)}
          opacity={0.55 + beat * 0.4} />
      </g>
      {/* only bricks */}
      <g opacity={0.9}>
        <path d="M 60 88 L 60 66 L 84 66 L 84 88 z" fill="none" stroke={shade(tint, 1.9)} strokeWidth={0.5} />
        <path d="M 56 67 L 72 54 L 88 67" fill="none" stroke={shade(tint, 1.9)} strokeWidth={0.5} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={60} y1={71 + i * 4.4} x2={84} y2={71 + i * 4.4}
            stroke={shade(tint, 1.6)} strokeWidth={0.28} opacity={0.6} />
        ))}
      </g>
      <line x1={51} y1={46} x2={51} y2={88} stroke={shade(tint, 1.7)} strokeWidth={0.22} opacity={0.4} />
    </svg>
    <Blob x={30} y={76} r={16} color={accent} o={0.12 + mood * 0.14} blur={80} />
  </>
);

/** 7. The silence after everything: fog, and no one left to call it empty. */
const silence: Scene = ({t, k, mood, tint}) => (
  <>
    <Sky top={shade(tint, 0.5)} bottom={shade(tint, 1.1)} />
    {[0, 1, 2, 3, 4].map((i) => (
      <Blob key={i} x={((t * (1.2 + i * 0.5) + i * 31) % 130) - 15} y={54 + i * 9}
        r={22 + i * 5} color={shade(tint, 1.7)} o={0.1 + mood * 0.06} blur={110} />
    ))}
    <Ridge seed={91} color={shade(tint, 0.6)} base={76} amp={6} peaks={4} shift={-2} w={104} h={100} />
    <Ridge seed={93} color={shade(tint, 0.4)} base={88} amp={4} peaks={3} shift={-3 + k * 2} w={106} h={100} />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      {Array.from({length: 9}, (_, i) => {
        const x = 6 + i * 11 + rnd(97 + i) * 4;
        const top = 52 + rnd(99 + i) * 10;
        return (
          <g key={i} opacity={0.5 - (i % 3) * 0.12}>
            <line x1={x} y1={90} x2={x} y2={top} stroke="#0d0f0d" strokeWidth={0.5} />
            <line x1={x} y1={top + 6} x2={x - 3} y2={top + 1} stroke="#0d0f0d" strokeWidth={0.3} />
            <line x1={x} y1={top + 9} x2={x + 3.4} y2={top + 3} stroke="#0d0f0d" strokeWidth={0.3} />
          </g>
        );
      })}
    </svg>
    <Blob x={50} y={74} r={40} color={shade(tint, 1.9)} o={0.14 + mood * 0.08} blur={120} />
  </>
);

/** 8. The breath that stops: a lake so still the sky is in it, rings on every word. */
const breath: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top={shade(tint, 0.42)} bottom={shade(tint, 1.25)} glow={`${accent}26`} at={[50, 50]} />
    <Ridge seed={101} color={shade(tint, 0.34)} base={56} amp={13} peaks={5} shift={-2 + k * 1.5} w={104} h={100} />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <rect x={-10} y={56} width={120} height={56} fill={shade(tint, 0.78)} />
      {/* the mountains again, upside down */}
      <g transform="translate(0 112) scale(1 -1)" opacity={0.35}>
        <polygon points="-10,56 10,46 30,52 50,42 70,50 90,44 110,52 110,10 -10,10"
          fill={shade(tint, 0.34)} />
      </g>
      {/* rings that answer each syllable */}
      {[0, 1, 2].map((i) => {
        const p = ((t * 0.32 + i * 0.33) % 1);
        return <ellipse key={i} cx={50} cy={82} rx={6 + p * 40} ry={(6 + p * 40) * 0.17}
          fill="none" stroke="#fff" strokeWidth={0.25}
          opacity={(1 - p) * (0.12 + beat * 0.3)} />;
      })}
    </svg>
    <Motes n={16} seed={107} t={t} color="#fff" speed={0.018} size={0.18} />
  </>
);

/** 9. The dream in which the universe floats: worlds above a sleeping land. */
const dream: Scene = ({t, k, beat, mood, tint, accent}) => (
  <>
    <Sky top="#05061a" bottom={shade(tint, 1.1)} glow={`${accent}2a`} at={[66, 30]} />
    <Stars n={190} seed={113} beat={beat} top={0.85} />
    <Blob x={62} y={30} r={24} color={shade(tint, 2)} o={0.22 + mood * 0.16} blur={120} />
    <svg viewBox="0 0 100 100" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      {[0, 1, 2].map((i) => {
        const y = 28 + i * 9 + Math.sin(t * 0.4 + i * 2) * 1.6;
        return (
          <g key={i} opacity={0.5 + beat * 0.3}>
            <circle cx={24 + i * 26} cy={y} r={3.4 - i * 0.7} fill={shade(accent, 1.2)} opacity={0.7} />
            <ellipse cx={24 + i * 26} cy={y} rx={6.4 - i * 1.2} ry={1.5}
              fill="none" stroke={accent} strokeWidth={0.2}
              transform={`rotate(${-18 + i * 14} ${24 + i * 26} ${y})`} />
          </g>
        );
      })}
    </svg>
    <Ridge seed={117} color="#07060c" base={84} amp={11} peaks={6} shift={-2 + k * 1.5} w={104} h={100} />
    <Motes n={22} seed={119} t={t} color={shade(accent, 1.2)} speed={0.02} size={0.2} />
  </>
);

/** Scenes in the same order as the drawings and photographs. */
export const SCENES_2D: Record<string, Scene[]> = {
  anant: [galaxy, crow, river, prince, house, pralaya, silence, breath, dream],
};
export const scenesOf = (name?: string): Scene[] => SCENES_2D[name ?? ''] ?? [];
