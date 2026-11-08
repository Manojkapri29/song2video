import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS} from '../kit/Type';

/**
 * Engagement Short: one question, a three-second countdown, a reveal, one CTA.
 *
 * The channel's five earlier quiz posts asked hard recall questions ("how many parvas in the
 * Mahabharata") and took zero comments. Everything here is built so the answer costs the viewer
 * nothing: finish a line everyone already knows, or pick A or B. The countdown exists to make
 * them answer BEFORE the reveal, which is what turns a watcher into a commenter.
 *
 * Vertical 1080x1920. Text stays inside the safe box so YouTube's own UI never covers it.
 */

export type Beats = {question: number; count: number; reveal: number; why: number; cta: number; end: number};
export type QuizProps = {
  kind: 'fill' | 'ab';
  hook: string;
  question: string;
  lead?: string;          // fill: the words before the blank
  tail?: string;          // fill: the words after the blank
  options?: string[];     // ab: exactly two
  answer: string;
  why?: string;
  cta: string;
  beats: Beats;
  audio?: string;
  tag?: string;
};

const INK = '#fff6e8';
const DIM = 'rgba(255,224,184,.45)';
const GOLD = '#ffc24b';
const SAFFRON = '#ff7a1a';

export const quizFrames = (b: Beats, fps = 30) => Math.ceil(b.end * fps);

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/>" +
  "</filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** 0 before `at`, 1 shortly after — every element enters off one of these. */
const useAt = (at: number, len = 0.35) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return interpolate(frame, [at * fps, (at + len) * fps], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = frame * 0.12;
  const jitter = (Math.floor(frame / 2) % 7) * 37;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 32%, #1d1208 0%, #0b0806 62%, #060403 100%)'}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 0.1}}>
        <svg width={1500} height={1500} viewBox="-250 -250 500 500" style={{transform: `rotate(${spin}deg)`}}>
          {Array.from({length: 24}, (_, i) => (
            <g key={i} transform={`rotate(${i * 15})`}>
              <path d="M 0 -210 Q 26 -150 0 -92 Q -26 -150 0 -210 Z" fill={GOLD} opacity={0.55} />
              <circle cx={0} cy={-232} r={4} fill={SAFFRON} />
            </g>
          ))}
          <circle r={118} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.6} />
          <circle r={160} fill="none" stroke={SAFFRON} strokeWidth={1.5} opacity={0.4} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${jitter}px ${jitter * 0.6}px`,
        opacity: 0.07, mixBlendMode: 'overlay'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,.72) 100%)'}} />
    </AbsoluteFill>
  );
};

/** The 3-2-1 ring. Drawn with a stroke-dash sweep so it empties like a timer. */
const Countdown: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const el = frame - at * fps;
  if (el < 0 || el > 3 * fps + 6) return null;
  const left = Math.max(0, 3 - el / fps);
  const n = Math.min(3, Math.ceil(left) || 1);
  const R = 92;
  const C = 2 * Math.PI * R;
  const beat = spring({frame: el % fps, fps, config: {damping: 11, stiffness: 240}});
  const out = interpolate(el, [3 * fps, 3 * fps + 6], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'relative', width: 230, height: 230, opacity: out}}>
      <svg width={230} height={230} viewBox="-115 -115 230 230" style={{transform: 'rotate(-90deg)'}}>
        <circle r={R} fill="rgba(0,0,0,.35)" stroke="rgba(255,194,75,.18)" strokeWidth={10} />
        <circle r={R} fill="none" stroke={SAFFRON} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - left / 3)} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONTS.display, fontSize: 112, color: GOLD,
        transform: `scale(${0.88 + 0.12 * beat})`}}>{n}</div>
    </div>
  );
};

const Card: React.FC<{children: React.ReactNode; show: number; glow?: boolean}> = ({children, show, glow}) => (
  <div style={{
    opacity: show, transform: `translateY(${(1 - show) * 34}px)`,
    background: 'rgba(22,14,8,.82)', border: `3px solid ${glow ? GOLD : 'rgba(255,194,75,.3)'}`,
    borderRadius: 30, padding: '40px 46px', margin: '0 10px',
    boxShadow: glow ? `0 0 60px rgba(255,194,75,.35)` : '0 18px 50px rgba(0,0,0,.55)',
  }}>{children}</div>
);

export const QuizShort: React.FC<QuizProps> = (p) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const b = p.beats;
  const hookOut = interpolate(frame, [(b.question - 0.3) * fps, b.question * fps], [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const q = useAt(b.question);
  const rev = useAt(b.reveal, 0.28);
  const why = useAt(b.why);
  const cta = useAt(b.cta);
  // the reveal lands with a short shake, so it reads as an answer and not as another card
  const shake = interpolate(frame, [b.reveal * fps, (b.reveal + 0.3) * fps], [12, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flash = interpolate(frame, [b.reveal * fps, (b.reveal + 0.18) * fps, (b.reveal + 0.6) * fps],
    [0, 0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <Backdrop />
      {p.audio && <Audio src={staticFile(p.audio)} />}

      {/* centred between YouTube's own top bar and the bottom description strip */}
      <AbsoluteFill style={{padding: '230px 70px 430px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 34, textAlign: 'center'}}>

        <div style={{fontFamily: FONTS.serif, fontSize: 34, color: DIM, letterSpacing: 3}}>
          {p.tag ?? 'कथा और रहस्य'}
        </div>

        {hookOut > 0 && (
          <div style={{opacity: hookOut, fontFamily: FONTS.display, fontSize: 86, lineHeight: 1.18,
            color: INK, textShadow: `0 0 40px rgba(255,122,26,.5)`}}>{p.hook}</div>
        )}

        {q > 0 && (
          <>
            <Card show={q}>
              <div style={{fontFamily: FONTS.serif, fontSize: 58, lineHeight: 1.45, color: INK}}>
                {p.kind === 'fill' ? (
                  <>
                    {p.lead}
                    <span style={{display: 'inline-block', minWidth: 230, margin: '0 14px',
                      borderBottom: `6px solid ${rev > 0 ? GOLD : SAFFRON}`, color: GOLD,
                      fontFamily: FONTS.display, fontSize: 64,
                      transform: `translateY(${rev > 0 ? 0 : 6}px)`}}>
                      {rev > 0 ? p.answer : '?'}
                    </span>
                    {p.tail}
                  </>
                ) : p.question}
              </div>
            </Card>

            {p.kind === 'ab' && p.options && (
              <div style={{display: 'flex', flexDirection: 'column', gap: 22, width: '100%'}}>
                {p.options.map((o, i) => {
                  const right = rev > 0 && o === p.answer;
                  const wrong = rev > 0 && o !== p.answer;
                  return (
                    <div key={i} style={{
                      opacity: q * (wrong ? 0.35 : 1), display: 'flex', alignItems: 'center', gap: 22,
                      background: right ? 'rgba(255,194,75,.16)' : 'rgba(22,14,8,.8)',
                      border: `3px solid ${right ? GOLD : 'rgba(255,194,75,.26)'}`,
                      borderRadius: 24, padding: '26px 30px', textAlign: 'left',
                      transform: `scale(${right ? 1 + 0.04 * rev : 1})`,
                    }}>
                      <div style={{fontFamily: FONTS.display, fontSize: 52, color: right ? GOLD : SAFFRON,
                        minWidth: 56}}>{String.fromCharCode(65 + i)}</div>
                      <div style={{fontFamily: FONTS.serif, fontSize: 44, lineHeight: 1.3, color: INK}}>{o}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <Countdown at={b.count} />

        {p.kind === 'ab' && rev > 0 && (
          <div style={{opacity: rev, transform: `translateX(${shake * Math.sin(frame)}px)`,
            fontFamily: FONTS.display, fontSize: 72, color: GOLD,
            textShadow: '0 0 46px rgba(255,194,75,.6)'}}>सही जवाब ☝️</div>
        )}

        {why > 0 && p.why && (
          <Card show={why} glow>
            <div style={{fontFamily: FONTS.serif, fontSize: 46, lineHeight: 1.42, color: INK}}>{p.why}</div>
          </Card>
        )}
      </AbsoluteFill>

      {flash > 0 && <AbsoluteFill style={{background: GOLD, opacity: flash, mixBlendMode: 'overlay'}} />}

      {cta > 0 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 330}}>
          <div style={{opacity: cta, transform: `translateY(${(1 - cta) * 26}px)`,
            background: SAFFRON, borderRadius: 999, padding: '26px 52px',
            fontFamily: FONTS.display, fontSize: 56, color: '#1a0d04',
            boxShadow: '0 16px 50px rgba(255,122,26,.45)'}}>{p.cta}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
