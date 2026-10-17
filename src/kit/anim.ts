import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/** Pop in with overshoot. Returns 0..1. */
export const usePop = (delay = 0, damping = 13, stiffness = 190) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, stiffness}});
};

/** 0 -> 1 over `len` frames starting at `delay`, clamped both ends. */
export const useIn = (delay = 0, len = 12) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

/** 1 near the middle, 0 at both edges — for anything that must not pop on a cut. */
export const useInOut = (dur: number, len = 12) => {
  const frame = useCurrentFrame();
  return Math.min(
    interpolate(frame, [0, len], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [dur - len, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
};

/** Per-item delay for a staggered list. */
export const stagger = (i: number, every = 4, from = 0) => from + i * every;

/** Slow push used on every backdrop so nothing is ever frozen. */
export const useKenBurns = (dur: number, zoomFrom = 1.06, zoomTo = 1.16, panPct = 0) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [zoomFrom, zoomTo], {extrapolateRight: 'clamp'});
  const x = interpolate(frame, [0, dur], [0, panPct], {extrapolateRight: 'clamp'});
  return {transform: `scale(${scale}) translateX(${x}%)`};
};

export const sec = (fps: number, s: number) => Math.round(s * fps);
