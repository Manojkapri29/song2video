import React from 'react';
import {Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Theme} from './theme';
import {FONTS} from './Type';

/** A graphic that appears the moment its keyword is spoken. Times are seconds from the voice-over start. */
export type Moment = {at: number; dur: number; kind: string; label: string};

const FPS = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Each graphic is drawn in a 200x140 box, animated from its own local frame. */
const Glyph: React.FC<{kind: string; T: Theme; f: number}> = ({kind, T, f}) => {
  const draw = interpolate(f, [0, 22], [0, 1], clamp);
  switch (kind) {
    case 'mountain': {
      const cloud = (f * 0.5) % 260 - 30;
      return (
        <g>
          <circle cx={150} cy={34} r={22} fill={T.accent2} opacity={0.6} />
          <path pathLength={1} d="M10 130 L70 46 L100 80 L128 34 L190 130 Z" fill="none" stroke={T.accent2}
            strokeWidth={4} strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - draw} />
          <ellipse cx={cloud} cy={70} rx={30} ry={8} fill={T.ink} opacity={0.35} />
          <ellipse cx={cloud + 60} cy={96} rx={22} ry={6} fill={T.ink} opacity={0.25} />
        </g>
      );
    }
    case 'four': {
      const pts = [[100, 22], [178, 70], [100, 118], [22, 70]];
      return (
        <g>
          <circle cx={100} cy={70} r={34} fill="none" stroke={T.accent} strokeWidth={3} opacity={draw} />
          <circle cx={100} cy={70} r={8} fill={T.accent2} opacity={draw} />
          {pts.map(([x, y], i) => {
            const p = interpolate(f, [6 + i * 6, 16 + i * 6], [0, 1], clamp);
            return <circle key={i} cx={x} cy={y} r={14} fill={T.accent2} opacity={p}
              transform={`translate(${(1 - p) * (100 - x) * 0.4} ${(1 - p) * (70 - y) * 0.4})`} />;
          })}
        </g>
      );
    }
    case 'water': {
      return (
        <g>
          {[0, 1, 2].map((i) => {
            const t = ((f + i * 14) % 42) / 42;
            return <ellipse key={i} cx={100} cy={72} rx={20 + t * 70} ry={6 + t * 22} fill="none"
              stroke={T.accent2} strokeWidth={3} opacity={1 - t} />;
          })}
        </g>
      );
    }
    case 'crystal': {
      const a = f * 0.9;
      const hex = Array.from({length: 6}, (_, i) => {
        const r = (Math.PI / 3) * i + (a * Math.PI) / 180;
        return `${100 + Math.cos(r) * 56},${72 + Math.sin(r) * 56}`;
      }).join(' ');
      return (
        <g>
          <polygon points={hex} fill={T.accent} opacity={0.18 * draw} stroke={T.accent2} strokeWidth={3} />
          <line x1={100} y1={16} x2={100} y2={128} stroke={T.accent2} strokeWidth={2} opacity={0.6 * draw} />
          <line x1={44} y1={44} x2={156} y2={100} stroke={T.accent2} strokeWidth={2} opacity={0.6 * draw} />
        </g>
      );
    }
    case 'snow': {
      return (
        <g>
          {Array.from({length: 16}, (_, i) => {
            const x = (i * 37) % 180 + 10;
            const y = ((i * 53 + f * 2.2) % 150) - 10;
            return <circle key={i} cx={x} cy={y} r={2.5 + (i % 3)} fill={T.ink} opacity={0.8} />;
          })}
        </g>
      );
    }
    case 'orbit': {
      const a = f * 0.09 - Math.PI / 2;
      return (
        <g>
          <circle cx={100} cy={70} r={50} fill="none" stroke={T.accent} strokeWidth={4} strokeDasharray="14 10" opacity={draw} />
          <circle cx={100 + Math.cos(a) * 50} cy={70 + Math.sin(a) * 50} r={8} fill={T.accent2} />
          <circle cx={100} cy={70} r={6} fill={T.ink} opacity={draw} />
        </g>
      );
    }
    case 'clock': {
      const h = f * 0.22;
      return (
        <g>
          <circle cx={100} cy={70} r={50} fill="none" stroke={T.accent2} strokeWidth={4} opacity={draw} />
          <line x1={100} y1={70} x2={100 + Math.cos(h) * 34} y2={70 + Math.sin(h) * 34} stroke={T.ink} strokeWidth={5} strokeLinecap="round" />
          <line x1={100} y1={70} x2={100 + Math.cos(h * 12) * 44} y2={70 + Math.sin(h * 12) * 44} stroke={T.accent} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    }
    case 'magnify': {
      const x = 40 + (f * 1.6) % 120;
      return (
        <g>
          {[30, 50, 70, 90, 110].map((y) => <line key={y} x1={30} x2={170} y1={y} y2={y} stroke={T.accent} strokeWidth={2} opacity={0.4} />)}
          <circle cx={x} cy={70} r={24} fill="none" stroke={T.accent2} strokeWidth={5} />
          <line x1={x + 17} y1={87} x2={x + 36} y2={106} stroke={T.accent2} strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    }
    case 'ten': {
      return (
        <g>
          {Array.from({length: 10}, (_, i) => {
            const r = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const lit = f > 4 + i * 3;
            return <circle key={i} cx={100 + Math.cos(r) * 52} cy={70 + Math.sin(r) * 52} r={lit ? 9 : 5}
              fill={lit ? T.accent2 : T.dim} />;
          })}
        </g>
      );
    }
    case 'wave': {
      return (
        <g>
          {Array.from({length: 16}, (_, i) => {
            const h = 16 + 70 * Math.abs(Math.sin(f / 7 + i * 0.6));
            return <rect key={i} x={14 + i * 11} y={105 - h} width={6} height={h} rx={3}
              fill={i % 4 ? T.accent : T.accent2} />;
          })}
        </g>
      );
    }
    case 'eight': {
      const pts = Array.from({length: 8}, (_, i) => {
        const r = (Math.PI * 2 * i) / 8 + Math.PI / 8;
        return `${100 + Math.cos(r) * 56},${70 + Math.sin(r) * 56}`;
      }).join(' ');
      return (
        <g>
          <polygon points={pts} fill="none" stroke={T.accent2} strokeWidth={4} pathLength={1}
            strokeDasharray={1} strokeDashoffset={1 - draw} />
          <circle cx={100} cy={70} r={7} fill={T.accent} opacity={draw} />
        </g>
      );
    }
    default:
      return null;
  }
};

/** Small framed graphic in the upper right, under the chapter tag, shown while its keyword is said. Clear of the centred type. */
const MomentCard: React.FC<{m: Moment; T: Theme; low?: boolean}> = ({m, T, low}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const len = Math.round(m.dur * FPS);
  const inO = interpolate(f, [0, 10], [0, 1], clamp);
  const outO = interpolate(f, [len - 12, len], [1, 0], clamp);
  const o = Math.min(inO, outO);
  return (
    <div style={{position: 'absolute', right: width * 0.045, width: width * 0.17,
      ...(low ? {bottom: height * 0.24} : {top: height * 0.13}),
      opacity: o, transform: `translateX(${(1 - inO) * 60}px)`, padding: width * 0.012,
      background: `${T.bg}d9`, border: `2px solid ${T.accent}`, borderRadius: 18,
      boxShadow: `0 0 40px ${T.accent}44`}}>
      <svg viewBox="0 0 200 140" width="100%" style={{display: 'block'}}>
        <Glyph kind={m.kind} T={T} f={f} />
      </svg>
      <div style={{marginTop: 6, fontFamily: FONTS.sans, fontSize: width / 52, color: T.accent2,
        letterSpacing: 3, textAlign: 'center'}}>{m.label}</div>
    </div>
  );
};

/** Places each moment on the timeline at the frame its keyword is spoken. */
export const Moments: React.FC<{moments: Moment[]; T: Theme; low?: boolean}> = ({moments, T, low}) => (
  <>
    {moments.map((m, i) => (
      <Sequence key={i} from={Math.round(m.at * FPS)} durationInFrames={Math.max(1, Math.round(m.dur * FPS))}>
        <MomentCard m={m} T={T} low={low} />
      </Sequence>
    ))}
  </>
);
