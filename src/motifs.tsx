import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** A motif is line art that draws itself, stroke by stroke, the moment the word is spoken. */
export type Part = {d: string; w?: number; fill?: boolean};

/** Everything lives in a 0..100 box. Order is drawing order. */
export const MOTIFS: Record<string, Part[]> = {
  ghar: [
    {d: 'M 20 84 L 20 46 L 80 46 L 80 84 z'},
    {d: 'M 12 48 L 50 20 L 88 48'},
    {d: 'M 42 84 L 42 62 L 58 62 L 58 84'},
    {d: 'M 28 54 L 38 54 L 38 64 L 28 64 z'},
    {d: 'M 62 54 L 72 54 L 72 64 L 62 64 z'},
    {d: 'M 8 84 L 92 84', w: 0.8},
  ],
  ped: [
    {d: 'M 48 86 L 48 44'},
    {d: 'M 48 56 L 30 42 L 22 32'},
    {d: 'M 48 50 L 66 36 L 74 26'},
    {d: 'M 48 66 L 34 58'},
    {d: 'M 48 62 L 62 52'},
    {d: 'M 26 34 q 24 -24 48 -6', w: 0.8},
    {d: 'M 18 40 q 30 -34 64 -12', w: 0.6},
    {d: 'M 10 86 L 90 86', w: 0.8},
  ],
  kauaa: [
    {d: 'M 30 56 q 8 -14 26 -10 q 16 4 18 14 q -18 10 -34 6 q -10 -3 -10 -10 z'},
    {d: 'M 62 48 a 7 7 0 1 1 0.1 0'},
    {d: 'M 70 46 L 84 44 L 70 50'},
    {d: 'M 30 58 L 12 66 L 32 62'},
    {d: 'M 44 66 L 44 76 M 54 66 L 54 76'},
    {d: 'M 18 80 L 82 80', w: 0.8},
  ],
  aag: [
    {d: 'M 50 84 q -16 -12 -10 -28 q 4 10 10 10 q -6 -18 8 -28 q -2 14 8 22 q 6 6 4 14 q -2 8 -20 10 z'},
    {d: 'M 32 84 q -8 -8 -5 -18 q 3 8 7 8 q -3 -10 4 -16 q 0 10 6 14 q 3 6 -1 12 z'},
    {d: 'M 70 84 q -8 -8 -5 -18 q 3 8 7 8 q -3 -10 4 -16 q 0 10 6 14 q 3 6 -1 12 z'},
    {d: 'M 14 86 L 86 86', w: 0.8},
  ],
  nadi: [
    {d: 'M 8 46 q 20 -8 42 0 q 22 8 42 0', w: 0.9},
    {d: 'M 8 58 q 20 -8 42 0 q 22 8 42 0', w: 0.9},
    {d: 'M 8 70 q 20 -8 42 0 q 22 8 42 0', w: 0.9},
    {d: 'M 26 34 q 16 -6 32 0', w: 0.6},
  ],
  brahmand: [
    {d: 'M 50 50 a 14 14 0 1 1 0.1 0'},
    {d: 'M 50 50 m -30 0 a 30 12 0 1 0 60 0 a 30 12 0 1 0 -60 0', w: 0.7},
    {d: 'M 20 50 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0', w: 0.5},
    {d: 'M 84 24 l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 l 5 -2 z', w: 0.5},
    {d: 'M 14 70 l 1.6 4 l 4 1.6 l -4 1.6 l -1.6 4 l -1.6 -4 l -4 -1.6 l 4 -1.6 z', w: 0.5},
  ],
  samay: [
    {d: 'M 50 50 a 30 30 0 1 1 0.1 0'},
    {d: 'M 50 30 L 50 50 L 64 58'},
    {d: 'M 50 20 L 50 25 M 80 50 L 75 50 M 50 80 L 50 75 M 20 50 L 25 50', w: 0.6},
  ],
  eent: [
    {d: 'M 14 46 L 86 46 M 14 58 L 86 58 M 14 70 L 86 70 M 14 82 L 86 82', w: 0.8},
    {d: 'M 32 46 L 32 58 M 62 46 L 62 58', w: 0.6},
    {d: 'M 22 58 L 22 70 M 50 58 L 50 70 M 76 58 L 76 70', w: 0.6},
    {d: 'M 36 70 L 36 82 M 66 70 L 66 82', w: 0.6},
    {d: 'M 10 84 L 90 84', w: 0.8},
  ],
  paisa: [
    {d: 'M 50 40 a 18 10 0 1 1 0.1 0'},
    {d: 'M 32 40 L 32 52 a 18 10 0 0 0 36 0 L 68 40', w: 0.8},
    {d: 'M 32 52 L 32 64 a 18 10 0 0 0 36 0 L 68 52', w: 0.8},
    {d: 'M 32 64 L 32 76 a 18 10 0 0 0 36 0 L 68 64', w: 0.8},
  ],
  man: [
    {d: 'M 50 82 q -26 -8 -26 -30 q 0 -24 26 -28 q 26 4 26 28 q 0 22 -26 30 z'},
    {d: 'M 50 64 q -10 -2 -10 -10 q 0 -10 10 -11 q 10 1 10 11 q 0 8 -10 10 z', w: 0.7},
    {d: 'M 50 52 q -4 6 0 12 q 4 6 0 12', w: 0.6},
  ],
  akash: [
    {d: 'M 26 60 q -12 0 -12 -10 q 0 -10 12 -9 q 2 -13 16 -13 q 13 0 16 11 q 14 -1 14 10 q 0 11 -13 11 z'},
    {d: 'M 48 74 q -8 0 -8 -6 q 0 -7 8 -6 q 2 -8 11 -8 q 9 0 11 8 q 9 0 9 7 q 0 5 -9 5 z', w: 0.8},
  ],
  dharti: [
    {d: 'M 50 52 a 26 26 0 1 1 0.1 0'},
    {d: 'M 24 52 q 26 -14 52 0 q -26 14 -52 0', w: 0.7},
    {d: 'M 50 26 q -14 26 0 52 q 14 -26 0 -52', w: 0.7},
    {d: 'M 16 86 L 84 86', w: 0.8},
  ],
  saans: [
    {d: 'M 50 56 a 8 8 0 1 1 0.1 0'},
    {d: 'M 50 56 a 20 20 0 1 1 0.1 0', w: 0.7},
    {d: 'M 50 56 a 32 32 0 1 1 0.1 0', w: 0.5},
  ],
  sapna: [
    {d: 'M 62 32 a 22 22 0 1 0 14 40 a 26 26 0 1 1 -14 -40 z'},
    {d: 'M 26 40 l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 l 5 -2 z', w: 0.6},
    {d: 'M 32 68 l 1.6 4 l 4 1.6 l -4 1.6 l -1.6 4 l -1.6 -4 l -4 -1.6 l 4 -1.6 z', w: 0.6},
  ],
  dar: [
    {d: 'M 50 22 L 72 60 L 28 60 z'},
    {d: 'M 50 34 L 50 48', w: 1},
    {d: 'M 50 53 l 0.1 0', w: 1.4},
    {d: 'M 20 78 q 30 -10 60 0', w: 0.7},
  ],
  aadmi: [
    {d: 'M 50 30 a 8 8 0 1 1 0.1 0'},
    {d: 'M 50 38 L 50 64'},
    {d: 'M 50 44 L 34 54 M 50 44 L 66 54'},
    {d: 'M 50 64 L 38 86 M 50 64 L 62 86'},
    {d: 'M 14 88 L 86 88', w: 0.8},
  ],
  sookha: [
    {d: 'M 10 62 L 90 62', w: 0.9},
    {d: 'M 26 62 L 22 86 M 50 62 L 54 86 M 72 62 L 68 86', w: 0.6},
    {d: 'M 22 72 L 38 74 M 54 70 L 68 73', w: 0.5},
    {d: 'M 50 34 a 12 12 0 1 1 0.1 0'},
    {d: 'M 50 14 L 50 8 M 70 34 L 76 34 M 30 34 L 24 34 M 64 20 L 68 16 M 36 20 L 32 16', w: 0.6},
  ],
};

/** Which word summons which motif. Longer keys first, so कल्पवृक्ष wins over वृक्ष. */
const KEYS: [string, string][] = [
  ['कल्पवृक्ष', 'ped'], ['काकभुशुण्डि', 'kauaa'], ['ब्रह्मांड', 'brahmand'],
  ['वास्तविकता', 'sapna'], ['मेहमान', 'ghar'], ['सीमेंट', 'eent'], ['धोखेबाज़', 'man'],
  ['दुनियाओं', 'brahmand'], ['दुनिया', 'brahmand'], ['सन्नाटा', 'akash'],
  ['साँसों', 'saans'], ['ठहराव', 'saans'], ['ठहरे', 'saans'], ['ठहर', 'saans'],
  ['सपने', 'sapna'], ['जागने', 'sapna'], ['प्रलय', 'aag'], ['जलती', 'aag'],
  ['जलकर', 'aag'], ['राख', 'aag'], ['आग', 'aag'], ['सूखा', 'sookha'],
  ['बारिश', 'nadi'], ['नदी', 'nadi'], ['बहने', 'nadi'],
  ['आकाश', 'akash'], ['धरती', 'dharti'], ['समय', 'samay'], ['लकीर', 'samay'],
  ['ईंट', 'eent'], ['पैसा', 'paisa'], ['कमाई', 'paisa'], ['घर', 'ghar'],
  ['वासिष्ठ', 'aadmi'], ['शांति', 'saans'], ['जले', 'aag'], ['कौआ', 'kauaa'], ['पेड़', 'ped'], ['राम', 'aadmi'], ['द्रष्टा', 'aadmi'],
  ['देखने', 'aadmi'], ['मन', 'man'], ['डर', 'dar'], ['बोझ', 'dar'], ['गुस्सा', 'aag'],
];

/** The first word of a line that names something we can draw. */
export const motifIn = (words: {w: string; start: number}[]) => {
  for (const word of words) {
    for (const [k, m] of KEYS) {
      if (word.w.includes(k)) return {motif: m, at: word.start};
    }
  }
  return null;
};

/** Draws itself over `build` seconds, holds, then leaves. */
export const Motif: React.FC<{name: string; len: number; color: string; accent: string; size: number}> =
({name, len, color, accent, size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const parts = MOTIFS[name];
  const build = Math.min(fps * 1.3, len * 0.45);
  const on = Math.min(
    interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [len - 12, len], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  if (!parts) return null;
  const each = build / parts.length;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{opacity: on, overflow: 'visible'}}>
      <g style={{filter: `drop-shadow(0 0 ${size * 0.02}px ${accent}cc)`}}>
        {parts.map((p, i) => {
          // each stroke starts where the one before it finished, so the thing assembles
          const d = interpolate(frame, [i * each * 0.8, i * each * 0.8 + each * 1.6], [1, 0],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <path key={i} d={p.d} fill="none" stroke={i === parts.length - 1 ? accent : color}
              strokeWidth={(p.w ?? 1.2) * 1.3} strokeLinecap="round" strokeLinejoin="round"
              pathLength={1} strokeDasharray={1} strokeDashoffset={d} opacity={0.92} />
          );
        })}
      </g>
    </svg>
  );
};
