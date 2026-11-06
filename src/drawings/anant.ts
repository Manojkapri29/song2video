/**
 * Pencil drawings for the "अनंत दुनियाओं के पीछे का रहस्य" explainer, in a 0..100 x 0..70 box.
 * Yoga Vasishtha imagery: the crow on the wish-tree, the river of time, the dissolution,
 * and the silence that is left. Figures stay small and faceless.
 */
import {Drawing, hatch, stipple} from '../kit/Pencil';

const seated = (x: number, y: number, s = 1): Drawing => [
  {d: `M ${x} ${y - 7 * s} a ${2 * s} ${2 * s} 0 1 1 0.1 0`, w: 0.5},
  {d: `M ${x - 4 * s} ${y} q ${4 * s} ${-6 * s} ${8 * s} 0 z`, w: 0.5},
  {d: `M ${x - 5 * s} ${y} q ${5 * s} ${2 * s} ${10 * s} 0`, w: 0.4},
];

/** 1. A spiral galaxy over a small seated figure — the infinite worlds. */
export const galaxy: Drawing = [
  {d: 'M 50 26 q 10 -8 18 2 q 7 9 -3 16 q -12 8 -24 0 q -13 -9 -4 -22 q 10 -14 28 -8', w: 0.5},
  {d: 'M 50 26 q -8 2 -10 10 q -2 9 8 12 q 11 3 15 -6', w: 0.4, o: 0.6},
  {d: 'M 50 32 q -4 2 -4 6 q 0 5 5 6', w: 0.35, o: 0.5},
  {d: 'M 48 36 a 1.4 1.4 0 1 1 0.1 0', w: 0.5},
  ...seated(50, 62, 0.9),
  {d: 'M 0 66 L 100 66', w: 0.4, o: 0.35},
  ...stipple(0, 2, 100, 24, {n: 170, seed: 101, o: 0.3}),
  ...stipple(2, 44, 96, 18, {n: 90, seed: 102, o: 0.2}),
  ...hatch(28, 20, 44, 30, {n: 60, seed: 103, angle: 35, len: 5, o: 0.14}),
];

/** 2. Kakbhushundi — a crow on the bare branch of the wish-tree on Sumeru. */
export const crow: Drawing = [
  // the wish-tree: a real trunk with branches, not one diagonal
  {d: 'M 30 68 C 31 56 30 46 32 36 C 33 28 34 22 34 16', w: 0.9},
  {d: 'M 33 34 C 42 32 50 28 58 22', w: 0.6},
  {d: 'M 32 44 C 24 42 18 38 12 32', w: 0.55},
  {d: 'M 33 26 C 41 25 48 22 54 17', w: 0.5},
  {d: 'M 32 54 C 25 53 20 50 15 45', w: 0.45},
  {d: 'M 46 28 l 5 -5 M 52 25 l 5 -4 M 22 38 l -5 -4 M 26 48 l -5 -3', w: 0.35, o: 0.5},
  // the crow, large enough to read: body, head, beak, tail, feet on the branch
  {d: 'M 52 22 q 8 -6 16 -2 q 9 5 6 13 q -3 8 -13 8 q -11 0 -13 -8 q -2 -7 4 -11 z', w: 0.7},
  {d: 'M 52 20 a 4.6 4.6 0 1 1 0.1 0', w: 0.7},
  {d: 'M 48 19 l -7 2 l 7 2', w: 0.6},
  {d: 'M 49.5 18 a 0.7 0.7 0 1 1 0.1 0', w: 0.5},
  {d: 'M 70 30 l 13 7 l -11 1', w: 0.6},
  {d: 'M 56 28 q 7 -3 13 2 q -5 6 -12 4', w: 0.5},
  {d: 'M 58 41 l -1 5 M 64 41 l 1 5', w: 0.5},
  {d: 'M 55 46 l -4 2 M 55 46 l 0 3 M 66 46 l 4 2 M 66 46 l 0 3', w: 0.45},
  {d: 'M 44 44 C 54 46 64 46 74 43', w: 0.6},
  {d: 'M 0 62 L 14 48 L 26 62 M 74 62 L 88 44 L 100 62', w: 0.45, o: 0.5},
  {d: 'M 0 66 L 100 66', w: 0.45, o: 0.4},
  ...stipple(0, 2, 100, 16, {n: 120, seed: 111, o: 0.24}),
  ...hatch(0, 48, 100, 18, {n: 70, seed: 112, angle: -60, len: 7, o: 0.2}),
  ...hatch(50, 22, 24, 20, {n: 44, seed: 113, angle: 25, len: 4, o: 0.2}),
];

/** 3. The river of time, and someone sitting on its bank letting it pass. */
export const river: Drawing = [
  {d: 'M -2 34 Q 26 28 50 36 T 102 32', w: 0.55},
  {d: 'M -2 46 Q 28 40 52 48 T 102 44', w: 0.55},
  {d: 'M 6 38 q 10 -3 18 1 M 34 42 q 10 -3 18 1 M 64 40 q 10 -3 18 1', w: 0.3, o: 0.45},
  {d: 'M 14 42 q 8 -2 14 1 M 48 45 q 8 -2 14 1', w: 0.3, o: 0.4},
  ...seated(22, 60, 1),
  {d: 'M 0 62 Q 30 58 60 61 T 100 58', w: 0.5},
  {d: 'M 70 30 L 78 18 L 86 30', w: 0.4, o: 0.45},
  ...stipple(0, 2, 100, 16, {n: 100, seed: 121, o: 0.22}),
  ...hatch(0, 34, 100, 14, {n: 70, seed: 122, angle: -12, len: 8, o: 0.16}),
  ...hatch(0, 58, 100, 12, {n: 50, seed: 123, angle: -58, len: 7, o: 0.2}),
];

/** 4. The young prince home from pilgrimage, empty inside. */
export const prince: Drawing = [
  {d: 'M 24 68 L 24 20 L 68 20 L 68 68', w: 0.6},
  {d: 'M 20 22 L 46 8 L 72 22', w: 0.55},
  {d: 'M 36 68 L 36 34 Q 46 28 56 34 L 56 68', w: 0.5},
  {d: 'M 46 34 L 46 68', w: 0.3, o: 0.45},
  {d: 'M 78 52 a 2.4 2.4 0 1 1 0.1 0', w: 0.5},
  {d: 'M 74 56 q 4 -3 8 0 l 2 12 q -6 2 -12 0 z', w: 0.5},
  {d: 'M 76 50 q 3 3 6 0', w: 0.3, o: 0.5},
  {d: 'M 0 68 L 100 68', w: 0.45, o: 0.4},
  ...hatch(24, 20, 44, 48, {n: 80, seed: 131, angle: -62, len: 6, o: 0.18}),
  ...hatch(70, 56, 24, 14, {n: 34, seed: 132, angle: -50, len: 5, o: 0.22}),
  ...stipple(0, 2, 100, 14, {n: 70, seed: 133, o: 0.18}),
];

/** 5. One house, two ways of seeing it: a home on the left, bricks on the right. */
export const house: Drawing = [
  {d: 'M 10 66 L 10 30 L 48 30 L 48 66', w: 0.6},
  {d: 'M 6 32 L 29 16 L 52 32', w: 0.55},
  {d: 'M 22 66 L 22 44 Q 29 40 36 44 L 36 66', w: 0.5},
  {d: 'M 38 36 h 6 v 6 h -6 z', w: 0.45},
  {d: 'M 40 48 c -2.4 0 -2.8 -3 0 -3.6 c 2 -0.5 4 -0.5 5.6 0 c 2.8 0.6 2.4 3.6 0 3.6 z', w: 0.45},
  {d: 'M 42.5 44 q 0 -3 0.4 -4 q 0.4 1 0.4 4', w: 0.4},
  {d: 'M 54 66 L 54 10', w: 0.3, o: 0.35},
  {d: 'M 62 66 L 62 30 L 96 30 L 96 66', w: 0.55},
  {d: 'M 58 32 L 79 16 L 100 32', w: 0.5},
  {d: 'M 62 38 L 96 38 M 62 46 L 96 46 M 62 54 L 96 54 M 62 62 L 96 62', w: 0.3, o: 0.55},
  {d: 'M 70 30 L 70 38 M 86 30 L 86 38 M 66 38 L 66 46 M 80 38 L 80 46', w: 0.3, o: 0.5},
  {d: 'M 74 46 L 74 54 M 90 46 L 90 54 M 68 54 L 68 62 M 84 54 L 84 62', w: 0.3, o: 0.5},
  {d: 'M 0 66 L 100 66', w: 0.45, o: 0.4},
  ...hatch(10, 30, 40, 36, {n: 56, seed: 141, angle: -62, len: 6, o: 0.18}),
  ...stipple(2, 4, 96, 12, {n: 60, seed: 142, o: 0.16}),
];

/** 6. The dissolution: cracked earth, a hard sun, fire taking the mountains. */
export const pralaya: Drawing = [
  {d: 'M 76 16 a 9 9 0 1 1 0.1 0', w: 0.6},
  {d: 'M 76 3 l 0 -3 M 90 16 l 4 0 M 86 6 l 3 -3 M 86 26 l 3 3', w: 0.4, o: 0.6},
  {d: 'M 0 50 L 22 26 L 40 50 M 32 50 L 52 20 L 72 50', w: 0.55},
  {d: 'M 14 42 q 3 -7 7 -2 q 3 -6 6 1 q 4 -5 5 3 q 2 6 -5 7 q -9 2 -13 -2 q -4 -4 0 -7 z', w: 0.5},
  {d: 'M 44 38 q 3 -8 7 -2 q 4 -7 7 2 q 4 -4 4 4 q 1 7 -7 8 q -10 1 -13 -4 q -2 -5 2 -8 z', w: 0.5},
  {d: 'M 18 36 q 2 -5 4 -1 M 50 32 q 2 -5 4 -1', w: 0.35, o: 0.6},
  {d: 'M 0 54 L 100 54', w: 0.6},
  {d: 'M 12 54 l 3 10 M 30 54 l -2 12 M 52 54 l 4 11 M 72 54 l -3 10 M 88 54 l 2 12', w: 0.4, o: 0.6},
  {d: 'M 6 60 l 10 2 M 36 62 l 12 -2 M 62 60 l 11 3', w: 0.3, o: 0.45},
  ...hatch(0, 54, 100, 16, {n: 80, seed: 151, angle: -56, len: 7, o: 0.24}),
  ...hatch(0, 24, 74, 30, {n: 70, seed: 152, angle: 70, len: 6, o: 0.18}),
  ...stipple(0, 2, 100, 22, {n: 110, seed: 153, o: 0.22}),
];

/** 7. What is left: no sky, no earth — only the silence. */
export const silence: Drawing = [
  {d: 'M 50 35 a 0.8 0.8 0 1 1 0.1 0', w: 0.6, o: 0.9},
  {d: 'M 50 25 a 10 10 0 1 1 0.1 0', w: 0.22, o: 0.3},
  {d: 'M 50 13 a 22 22 0 1 1 0.1 0', w: 0.2, o: 0.2},
  ...stipple(0, 0, 100, 70, {n: 420, seed: 161, o: 0.26}),
  ...stipple(26, 12, 48, 46, {n: 120, seed: 162, o: 0.14}),
];

/** 8. The pause between two breaths. */
export const breath: Drawing = [
  ...seated(30, 56, 1.5),
  {d: 'M 42 40 q 12 -4 22 2', w: 0.35, o: 0.5},
  {d: 'M 44 46 q 14 -4 24 3', w: 0.3, o: 0.4},
  {d: 'M 40 34 q 10 -3 18 1', w: 0.4, o: 0.6},
  {d: 'M 72 30 a 6 6 0 1 1 0.1 0', w: 0.3, o: 0.4},
  {d: 'M 72 24 a 13 13 0 1 1 0.1 0', w: 0.24, o: 0.28},
  {d: 'M 72 16 a 21 21 0 1 1 0.1 0', w: 0.2, o: 0.2},
  {d: 'M 0 64 L 100 64', w: 0.45, o: 0.4},
  ...hatch(0, 54, 100, 14, {n: 50, seed: 171, angle: -58, len: 7, o: 0.18}),
  ...stipple(0, 2, 100, 20, {n: 90, seed: 172, o: 0.18}),
];

/** 9. The dream: the sleeper stays, the world inside him rises and falls. */
export const dream: Drawing = [
  {d: 'M 10 62 L 90 62', w: 0.5},
  {d: 'M 18 62 q 4 -8 14 -8 q 18 0 34 0 q 10 0 14 8', w: 0.55},
  {d: 'M 26 54 a 3 3 0 1 1 0.1 0', w: 0.5},
  {d: 'M 20 56 q 8 -5 16 -1', w: 0.4, o: 0.6},
  {d: 'M 60 26 q 8 -7 15 2 q 6 8 -3 14 q -10 7 -20 0 q -11 -8 -3 -18 q 9 -12 24 -7', w: 0.45},
  {d: 'M 62 30 q -6 2 -7 8 q -1 7 7 9', w: 0.35, o: 0.55},
  {d: 'M 60 33 a 1.1 1.1 0 1 1 0.1 0', w: 0.45},
  {d: 'M 44 46 a 1.6 1.6 0 1 1 0.1 0 M 50 40 a 2.2 2.2 0 1 1 0.1 0', w: 0.35, o: 0.5},
  ...stipple(0, 2, 100, 26, {n: 150, seed: 181, o: 0.26}),
  ...hatch(10, 54, 80, 12, {n: 44, seed: 182, angle: -58, len: 6, o: 0.2}),
  ...hatch(46, 18, 46, 30, {n: 50, seed: 183, angle: 30, len: 5, o: 0.14}),
];

export const ANANT_DRAWINGS: Drawing[] =
  [galaxy, crow, river, prince, house, pralaya, silence, breath, dream];
