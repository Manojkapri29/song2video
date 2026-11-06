/**
 * Pencil drawings for "तेरी गली मेरी मंजिल", one per verse, in a 0..100 x 0..70 box.
 * Hill-village line art drawn in code — no faces, so nothing lands in the uncanny valley.
 */
import {Drawing, hatch, stipple} from '../kit/Pencil';

const ridge = (y: number, a: number, o = 0.45) => ({
  d: `M -2 ${y} Q 12 ${y - a} 24 ${y - a * 0.3} T 48 ${y - a * 0.8} T 72 ${y - a * 0.2} T 102 ${y - a * 0.6}`,
  w: 0.4, o,
});

/** 1. Buransh branch against the ridges — the opening image. */
export const buransh: Drawing = [
  ridge(26, 9, 0.3), ridge(31, 6, 0.38), ridge(36, 4, 0.5),
  {d: 'M 8 68 C 18 56 26 46 34 34 C 38 28 42 24 48 20', w: 0.7},
  {d: 'M 26 48 C 32 46 38 44 43 39', w: 0.5},
  {d: 'M 34 36 C 40 36 46 34 50 30', w: 0.5},
  {d: 'M 44 24 c 2 -3 6 -3 7 0 c 3 -1 5 2 3 4 c 1 3 -2 5 -4 3 c -2 2 -6 1 -6 -2 c -2 -2 -1 -5 0 -5 z', w: 0.45},
  {d: 'M 52 32 c 2 -3 6 -3 7 0 c 3 -1 5 2 3 4 c 1 3 -2 5 -4 3 c -2 2 -6 1 -6 -2 c -2 -2 -1 -5 0 -5 z', w: 0.45},
  {d: 'M 38 40 c 1.6 -2.4 4.8 -2.4 5.6 0 c 2.4 -0.8 4 1.6 2.4 3.2 c 0.8 2.4 -1.6 4 -3.2 2.4 c -1.6 1.6 -4.8 0.8 -4.8 -1.6 c -1.6 -1.6 -0.8 -4 0 -4 z', w: 0.45},
  {d: 'M 62 44 l 0 -6 M 66 46 l 0 -8 M 70 44 l 0 -5', w: 0.3, o: 0.35},
  {d: 'M 0 68 L 100 68', w: 0.4, o: 0.4},
  {d: 'M 14 62 l 6 -4 M 18 64 l 7 -5 M 22 66 l 6 -4', hatch: true, w: 0.3},
  ...stipple(2, 6, 96, 22, {n: 153, seed: 11, o: 0.28}),
  ...hatch(0, 58, 100, 11, {n: 78, seed: 12, angle: -62, len: 11, o: 0.2}),
  ...hatch(36, 20, 30, 26, {n: 44, seed: 13, angle: 25, len: 6, o: 0.22}),
];

/** 2. The naula — a stone water source, a pot, someone filling it, seen from behind. */
export const naula: Drawing = [
  {d: 'M 24 58 L 24 30 Q 40 18 56 30 L 56 58', w: 0.6},
  {d: 'M 30 58 L 30 36 Q 40 28 50 36 L 50 58', w: 0.4, o: 0.5},
  {d: 'M 20 58 L 60 58', w: 0.6},
  {d: 'M 38 42 q 2 4 0 7 M 42 42 q -1 4 0 7', w: 0.35, o: 0.55},
  {d: 'M 34 52 q 6 2 12 0', w: 0.3, o: 0.4},
  {d: 'M 66 58 c -5 0 -6 -6 -1 -8 c 4 -1.5 8 -1.5 11 0 c 5 2 4 8 -1 8 z', w: 0.5},
  {d: 'M 68 50 q 3 -2 7 0', w: 0.35, o: 0.5},
  {d: 'M 74 44 a 3 3 0 1 1 0.1 0', w: 0.5},
  {d: 'M 70 48 q 4 -3 9 0 l 2 12 q -7 3 -13 0 z', w: 0.5},
  {d: 'M 72 60 l -1 8 M 79 60 l 1 8', w: 0.45},
  {d: 'M 70 50 q 6 6 10 2', w: 0.3, o: 0.4},
  {d: 'M 8 58 L 100 58', w: 0.4, o: 0.35},
  {d: 'M 26 34 l 5 -3 M 30 38 l 5 -3 M 48 36 l 5 -3', hatch: true, w: 0.3},
  ...hatch(24, 28, 33, 30, {n: 91, seed: 21, angle: -60, len: 10, o: 0.28}),
  ...hatch(0, 58, 100, 11, {n: 74, seed: 22, angle: -58, len: 11, o: 0.24}),
  ...stipple(30, 44, 22, 14, {n: 85, seed: 23, o: 0.2}),
];

/** 3. Deodar forest with a path — "चीड़ों का जंगल गवाह मेरो". */
export const forest: Drawing = [
  {d: 'M 14 64 L 14 16', w: 0.6}, {d: 'M 14 20 l -7 8 M 14 20 l 7 8', w: 0.4},
  {d: 'M 14 30 l -9 9 M 14 30 l 9 9', w: 0.4}, {d: 'M 14 42 l -10 10 M 14 42 l 10 10', w: 0.4},
  {d: 'M 36 66 L 36 10', w: 0.7}, {d: 'M 36 14 l -8 9 M 36 14 l 8 9', w: 0.45},
  {d: 'M 36 26 l -10 10 M 36 26 l 10 10', w: 0.45}, {d: 'M 36 40 l -12 11 M 36 40 l 12 11', w: 0.45},
  {d: 'M 68 64 L 68 18', w: 0.55}, {d: 'M 68 22 l -8 8 M 68 22 l 8 8', w: 0.4},
  {d: 'M 68 34 l -9 9 M 68 34 l 9 9', w: 0.4},
  {d: 'M 88 62 L 88 24', w: 0.45, o: 0.5}, {d: 'M 88 28 l -6 7 M 88 28 l 6 7', w: 0.3, o: 0.5},
  {d: 'M 0 68 Q 26 62 48 66 T 100 60', w: 0.5},
  {d: 'M 48 66 Q 52 56 50 48', w: 0.35, o: 0.45},
  {d: 'M 52 48 a 2 2 0 1 1 0.1 0', w: 0.45},
  {d: 'M 50 51 q 2 -2 4 0 l 1 7 q -3 1.5 -6 0 z', w: 0.45},
  {d: 'M 20 56 l 8 -6 M 24 60 l 8 -6 M 58 54 l 7 -5 M 62 58 l 7 -5', hatch: true, w: 0.3},
  ...hatch(2, 12, 96, 34, {n: 119, seed: 31, angle: -70, len: 11, o: 0.22}),
  ...hatch(0, 58, 100, 12, {n: 85, seed: 32, angle: -55, len: 13, o: 0.2}),
  ...stipple(6, 10, 88, 26, {n: 119, seed: 33, o: 0.22}),
];

/** 4. The kauthig — lantern strings and a circle of dancers at the fair. */
export const kauthig: Drawing = [
  {d: 'M 0 12 Q 25 22 50 14 T 100 20', w: 0.4},
  {d: 'M 14 18 l 0 5 M 28 19 l 0 5 M 42 16 l 0 5 M 58 15 l 0 5 M 74 17 l 0 5 M 88 19 l 0 5', w: 0.3},
  {d: 'M 12 23 h 4 v 4 h -4 z M 26 24 h 4 v 4 h -4 z M 40 21 h 4 v 4 h -4 z', w: 0.4},
  {d: 'M 56 20 h 4 v 4 h -4 z M 72 22 h 4 v 4 h -4 z M 86 24 h 4 v 4 h -4 z', w: 0.4},
  {d: 'M 22 48 a 2 2 0 1 1 0.1 0', w: 0.5},
  {d: 'M 20 51 q 2 -2 4 0 l 2 9 q -4 2 -8 0 z', w: 0.5},
  {d: 'M 21 60 l -2 8 M 25 60 l 2 8', w: 0.4},
  {d: 'M 40 46 a 2 2 0 1 1 0.1 0', w: 0.5},
  {d: 'M 38 49 q 2 -2 4 0 l 2 9 q -4 2 -8 0 z', w: 0.5},
  {d: 'M 39 58 l -2 9 M 43 58 l 2 9', w: 0.4},
  {d: 'M 60 48 a 2 2 0 1 1 0.1 0', w: 0.5},
  {d: 'M 58 51 q 2 -2 4 0 l 2 9 q -4 2 -8 0 z', w: 0.5},
  {d: 'M 59 60 l -2 8 M 63 60 l 2 8', w: 0.4},
  {d: 'M 78 47 a 2 2 0 1 1 0.1 0', w: 0.5},
  {d: 'M 76 50 q 2 -2 4 0 l 2 9 q -4 2 -8 0 z', w: 0.5},
  {d: 'M 16 55 q 14 -6 30 -5 q 18 1 34 4', w: 0.3, o: 0.4},
  {d: 'M 0 68 L 100 68', w: 0.4, o: 0.35},
  ...stipple(0, 2, 100, 20, {n: 187, seed: 41, o: 0.30}),
  ...hatch(0, 60, 100, 9, {n: 74, seed: 42, angle: -58, len: 11, o: 0.2}),
  ...hatch(10, 40, 80, 20, {n: 51, seed: 43, angle: 30, len: 6, o: 0.18}),
];

/** 5. Two figures on a ridge path, the range behind — the bridge. */
export const ridgePath: Drawing = [
  ridge(22, 11, 0.3), ridge(28, 8, 0.35), ridge(34, 5, 0.45),
  {d: 'M 8 30 L 14 18 L 20 30 M 26 32 L 34 16 L 42 32', w: 0.45, o: 0.5},
  {d: 'M 70 30 L 78 14 L 86 30', w: 0.45, o: 0.5},
  {d: 'M 0 66 Q 24 58 44 60 Q 68 62 100 52', w: 0.6},
  {d: 'M 0 70 Q 24 62 44 64 Q 68 66 100 56', w: 0.35, o: 0.4},
  {d: 'M 44 48 a 2 2 0 1 1 0.1 0', w: 0.5},
  {d: 'M 42 51 q 2 -2 4 0 l 2 8 q -4 2 -8 0 z', w: 0.5},
  {d: 'M 43 59 l -1 6 M 47 59 l 1 6', w: 0.4},
  {d: 'M 54 47 a 2.2 2.2 0 1 1 0.1 0', w: 0.5},
  {d: 'M 52 50 q 2.4 -2 4.6 0 l 2 9 q -4.4 2 -8.6 0 z', w: 0.5},
  {d: 'M 53 59 l -1 6 M 58 59 l 1 6', w: 0.4},
  {d: 'M 48 54 q 3 -1 5 0', w: 0.35, o: 0.6},
  {d: 'M 10 56 l 7 -4 M 15 59 l 7 -4 M 76 50 l 6 -4', hatch: true, w: 0.3},
  ...stipple(0, 2, 100, 22, {n: 170, seed: 51, o: 0.2}),
  ...hatch(0, 22, 100, 16, {n: 91, seed: 52, angle: -68, len: 10, o: 0.23}),
  ...hatch(0, 58, 100, 14, {n: 85, seed: 53, angle: -54, len: 13, o: 0.2}),
];

/** 6. The lit door at dusk — "साँझ ढली, दिया जली". */
export const door: Drawing = [
  {d: 'M 28 66 L 28 22 L 72 22 L 72 66', w: 0.65},
  {d: 'M 22 24 L 50 10 L 78 24', w: 0.6},
  {d: 'M 24 24 L 76 24', w: 0.45},
  {d: 'M 40 66 L 40 36 Q 50 30 60 36 L 60 66', w: 0.55},
  {d: 'M 50 36 L 50 66', w: 0.35, o: 0.5},
  {d: 'M 44 48 a 1 1 0 1 1 0.1 0 M 56 48 a 1 1 0 1 1 0.1 0', w: 0.4},
  {d: 'M 32 32 h 5 v 5 h -5 z M 64 32 h 5 v 5 h -5 z', w: 0.45},
  {d: 'M 66 54 c -3 0 -3.5 -4 0 -4.6 c 2.5 -0.6 5 -0.6 7 0 c 3.5 0.6 3 4.6 0 4.6 z', w: 0.5},
  {d: 'M 69.5 49 q 0 -4 0.5 -5 q 0.5 1 0.5 5', w: 0.45},
  {d: 'M 70 40 q -2.5 2.5 0 4.5 q 2.5 -2 0 -4.5 z', w: 0.5},
  {d: 'M 0 66 L 100 66', w: 0.45, o: 0.4},
  {d: 'M 30 40 l 6 -4 M 33 46 l 6 -4 M 30 52 l 5 -4', hatch: true, w: 0.3},
  {d: 'M 76 36 l 5 -3 M 78 42 l 5 -3', hatch: true, w: 0.3},
  ...hatch(28, 24, 44, 42, {n: 98, seed: 61, angle: -62, len: 10, o: 0.24}),
  ...hatch(0, 58, 100, 10, {n: 68, seed: 62, angle: -56, len: 11, o: 0.2}),
  ...stipple(58, 40, 24, 20, {n: 78, seed: 63, o: 0.28}),
];

export const PAHADI_DRAWINGS: Drawing[] = [buransh, naula, forest, kauthig, ridgePath, door];
