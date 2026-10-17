import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadTeko} from '@remotion/google-fonts/Teko';
import {loadFont as loadTiro} from '@remotion/google-fonts/TiroDevanagariHindi';
import {loadFont as loadYatra} from '@remotion/google-fonts/YatraOne';
import {Theme} from './theme';
import {usePop, useIn, stagger} from './anim';

export const FONTS = {
  sans: loadTeko('normal', {weights: ['700'], subsets: ['devanagari', 'latin']}).fontFamily,
  serif: loadTiro('normal', {weights: ['400'], subsets: ['devanagari', 'latin']}).fontFamily,
  display: loadYatra('normal', {weights: ['400'], subsets: ['devanagari', 'latin']}).fontFamily,
};
export const faceOf = (t: Theme) => FONTS[t.display];

/** Karaoke line: the whole line is readable, each word lights up on its own cue. */
export type Word = {w: string; start: number; end: number};
export const KineticLine: React.FC<{
  words: Word[]; t0: number; theme: Theme; size: number; highlight?: boolean; face?: string;
}> = ({words, t0, theme, size, highlight, face}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const family = face ?? faceOf(theme);
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline',
      gap: `${size * 0.22}px ${size * 0.3}px`, lineHeight: 1.1}}>
      {words.map((w, i) => {
        const cue = Math.max(0, Math.round((Math.max(w.start, t0) - t0) * fps));
        const local = frame - cue;
        const sung = local >= 0;
        const pop = sung ? popAt(local, fps) : 0;
        const wipe = sung ? interpolate(local, [2, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', fontFamily: family, fontSize: size,
            fontWeight: 700, color: sung ? (highlight ? theme.accent2 : theme.ink) : theme.dim,
            transform: `translateY(${(1 - pop) * size * 0.22}px) scale(${0.88 + 0.12 * pop})`,
            textShadow: theme.light
              ? (sung
                ? `0 0 ${size * 0.22}px rgba(255,255,255,.95), 0 ${size * 0.03}px ${size * 0.06}px rgba(0,0,0,.22)`
                : `0 0 ${size * 0.18}px rgba(255,255,255,.85)`)
              : (sung
                ? `0 0 ${size * 0.3}px ${theme.accent}8c, 0 ${size * 0.06}px ${size * 0.12}px rgba(0,0,0,.75)`
                : `0 ${size * 0.04}px ${size * 0.1}px rgba(0,0,0,.7)`)}}>
            <span style={{position: 'absolute', left: '-4%', right: '-4%', bottom: '-6%', height: size * 0.08,
              background: highlight ? theme.accent : theme.accent2, opacity: 0.8,
              transformOrigin: 'left', transform: `scaleX(${wipe})`}} />
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

// Plain function, not a hook: it runs inside a map, so it must not call useX.
const popAt = (local: number, fps: number) => {
  const k = Math.max(0, local) / (fps * 0.45);
  return k >= 1 ? 1 : 1 - Math.pow(1 - k, 3);
};

/** Heading that reveals word by word on a fixed stagger — for titles and bullets. */
export const Heading: React.FC<{text: string; theme: Theme; size: number; delay?: number; face?: string}> =
({text, theme, size, delay = 0, face}) => {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${size * 0.18}px ${size * 0.28}px`}}>
      {words.map((w, i) => <HeadWord key={i} w={w} theme={theme} size={size}
        delay={stagger(i, 3, delay)} face={face ?? faceOf(theme)} />)}
    </div>
  );
};

const HeadWord: React.FC<{w: string; theme: Theme; size: number; delay: number; face: string}> =
({w, theme, size, delay, face}) => {
  const pop = usePop(delay);
  return (
    <span style={{fontFamily: face, fontSize: size, fontWeight: 700, color: theme.ink,
      opacity: pop, transform: `translateY(${(1 - pop) * size * 0.3}px)`,
      textShadow: `0 ${size * 0.05}px ${size * 0.12}px rgba(0,0,0,.6)`}}>{w}</span>
  );
};

/** Number that counts up — the explainer workhorse. */
export const Counter: React.FC<{
  to: number; theme: Theme; size: number; delay?: number; len?: number; suffix?: string; prefix?: string;
}> = ({to, theme, size, delay = 0, len = 30, suffix = '', prefix = ''}) => {
  const v = useIn(delay, len);
  const shown = Math.round(to * (1 - Math.pow(1 - v, 3)));
  return (
    <span style={{fontFamily: FONTS.sans, fontSize: size, fontWeight: 700, color: theme.accent2,
      letterSpacing: 2, textShadow: `0 0 ${size * 0.25}px ${theme.accent}80`}}>
      {prefix}{shown.toLocaleString('en-IN')}{suffix}
    </span>
  );
};

/** Name plate that slides in from the left edge. */
export const LowerThird: React.FC<{title: string; sub?: string; theme: Theme; delay?: number}> =
({title, sub, theme, delay = 0}) => {
  const {width, height} = useVideoConfig();
  const p = usePop(delay, 18, 110);
  return (
    <div style={{position: 'absolute', left: width * 0.06, bottom: height * 0.14,
      transform: `translateX(${(1 - p) * -width * 0.5}px)`, display: 'flex', alignItems: 'stretch'}}>
      <div style={{width: width * 0.008, background: theme.accent}} />
      <div style={{background: `${theme.bg}d9`, padding: `${height * 0.018}px ${width * 0.025}px`,
        backdropFilter: 'blur(6px)'}}>
        <div style={{fontFamily: faceOf(theme), fontSize: width / 26, color: theme.ink, lineHeight: 1.1}}>{title}</div>
        {sub && <div style={{fontFamily: FONTS.sans, fontSize: width / 56, letterSpacing: 4,
          color: theme.accent2, marginTop: height * 0.006}}>{sub}</div>}
      </div>
    </div>
  );
};
