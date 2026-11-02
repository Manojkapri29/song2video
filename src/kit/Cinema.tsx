import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Film grain: a fractal-noise tile, shifted every couple of frames so it crawls like celluloid.
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
  "</filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Cinematic wrapper for any scene: slow push-in, warm grade, vignette, film grain. */
export const Cinema: React.FC<{children: React.ReactNode; dur: number; grain?: boolean}> =
({children, dur, grain = true}) => {
  const frame = useCurrentFrame();
  const push = 1 + (frame / Math.max(1, dur)) * 0.05;
  const jitter = (Math.floor(frame / 2) % 8) * 29;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push})`, filter: 'contrast(1.08) saturate(0.92) sepia(0.08)'}}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none'}} />
      {grain && (
        <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${jitter}px ${jitter * 0.6}px`,
          opacity: 0.1, mixBlendMode: 'overlay', pointerEvents: 'none'}} />
      )}
    </AbsoluteFill>
  );
};
