import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * animate.css, ported to frames.
 *
 * animate.css itself is CSS @keyframes on a wall clock. Remotion renders one frame at a
 * time in a paused page, so a CSS animation either sits at 0% for the whole render or
 * tears. These are the same curves driven by `frame`, so they render deterministically.
 *
 * Each entry maps 0..1 progress to a transform/opacity/filter triple.
 */
export type Anim = {t: string; o: number; f?: string};
export type AnimName =
  | 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight'
  | 'zoomIn' | 'zoomInUp' | 'bounceIn' | 'bounceInUp' | 'backInUp' | 'backInDown'
  | 'flipInX' | 'flipInY' | 'rotateIn' | 'lightSpeedInRight' | 'slideInUp'
  | 'jackInTheBox' | 'rollIn' | 'blurIn';

const back = (k: number) => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
const out3 = (k: number) => 1 - Math.pow(1 - k, 3);
/** animate.css bounceIn: 0 .2 .4 .6 .8 1 keyframe scale ladder, smoothed. */
const bounce = (k: number) =>
  interpolate(k, [0, 0.2, 0.4, 0.6, 0.8, 1], [0.3, 0.6, 1.1, 0.9, 1.03, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** p is 0..1 through the entry. 1 is always the resting state. */
export const animAt = (name: AnimName, p: number, px: number): Anim => {
  const k = Math.min(1, Math.max(0, p));
  const e = out3(k);
  const o = Math.min(1, k * 2.2);           // every entry is opaque by the time it settles
  switch (name) {
    case 'fadeIn': return {t: 'none', o: k};
    case 'fadeInUp': return {t: `translateY(${(1 - e) * px}px)`, o};
    case 'fadeInDown': return {t: `translateY(${(1 - e) * -px}px)`, o};
    case 'fadeInLeft': return {t: `translateX(${(1 - e) * -px}px)`, o};
    case 'fadeInRight': return {t: `translateX(${(1 - e) * px}px)`, o};
    case 'zoomIn': return {t: `scale(${0.4 + 0.6 * e})`, o};
    case 'zoomInUp': return {t: `translateY(${(1 - e) * px * 1.4}px) scale(${0.3 + 0.7 * e})`, o};
    case 'bounceIn': return {t: `scale(${bounce(k)})`, o};
    case 'bounceInUp': return {t: `translateY(${(1 - bounce(k)) * px}px) scale(${bounce(k)})`, o};
    case 'backInUp': return {t: `translateY(${(1 - back(k)) * px * 1.6}px) scale(${0.7 + 0.3 * back(k)})`, o};
    case 'backInDown': return {t: `translateY(${(back(k) - 1) * px * 1.6}px) scale(${0.7 + 0.3 * back(k)})`, o};
    case 'flipInX': return {t: `perspective(${px * 12}px) rotateX(${(1 - e) * 80}deg)`, o};
    case 'flipInY': return {t: `perspective(${px * 12}px) rotateY(${(1 - e) * 80}deg)`, o};
    case 'rotateIn': return {t: `rotate(${(1 - e) * -160}deg) scale(${0.6 + 0.4 * e})`, o};
    case 'lightSpeedInRight':
      return {t: `translateX(${(1 - e) * px * 3}px) skewX(${(1 - e) * -24}deg)`, o};
    case 'slideInUp': return {t: `translateY(${(1 - e) * px * 2}px)`, o: 1};
    case 'jackInTheBox':
      return {t: `scale(${bounce(k)}) rotate(${(1 - e) * 26}deg)`, o};
    case 'rollIn': return {t: `translateX(${(1 - e) * -px * 2}px) rotate(${(1 - e) * -110}deg)`, o};
    case 'blurIn': return {t: `scale(${1.06 - 0.06 * e})`, o, f: `blur(${(1 - e) * 14}px)`};
  }
};

/** Exit mirrors the entry, half the travel — nothing in animate.css leaves harder than it arrives. */
export const outAt = (p: number, px: number): Anim => {
  const k = Math.min(1, Math.max(0, p));
  return {t: `translateY(${k * -px * 0.5}px) scale(${1 - k * 0.06})`, o: 1 - k, f: `blur(${k * 6}px)`};
};

/** Wraps children in one animate.css entry and its mirrored exit. */
export const Animate: React.FC<{
  name: AnimName; len: number; inSec?: number; outSec?: number; px?: number;
  style?: React.CSSProperties; children: React.ReactNode;
}> = ({name, len, inSec = 0.55, outSec = 0.4, px, style, children}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const travel = px ?? width * 0.05;
  const inF = Math.max(1, Math.round(fps * inSec));
  const outF = Math.max(1, Math.round(fps * outSec));
  const a = frame >= len - outF
    ? outAt((frame - (len - outF)) / outF, travel)
    : animAt(name, frame / inF, travel);
  return (
    <div style={{...style, opacity: a.o, transform: a.t, filter: a.f,
      willChange: 'transform, opacity'}}>{children}</div>
  );
};

/** Deterministic pick, so line i always gets the same effect. */
export const pickAnim = (list: AnimName[], i: number) => list[i % list.length];
