import {Drawing} from '../kit/Pencil';
import {PAHADI_DRAWINGS} from './pahadi';
import {ANANT_DRAWINGS} from './anant';

/** Named drawing sets, so one Sketch composition serves any song or explainer. */
export const DRAWING_SETS: Record<string, Drawing[]> = {
  pahadi: PAHADI_DRAWINGS,
  anant: ANANT_DRAWINGS,
};
export const setOf = (name?: string): Drawing[] => DRAWING_SETS[name ?? 'pahadi'] ?? PAHADI_DRAWINGS;
