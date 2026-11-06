import {Drawing} from '../kit/Pencil';
import {PAHADI_DRAWINGS} from './pahadi';
import {ANANT_DRAWINGS} from './anant';

/** Named drawing sets, so one Sketch composition serves any song or explainer. */
export const DRAWING_SETS: Record<string, Drawing[]> = {
  pahadi: PAHADI_DRAWINGS,
  anant: ANANT_DRAWINGS,
};
export const setOf = (name?: string): Drawing[] => DRAWING_SETS[name ?? 'pahadi'] ?? PAHADI_DRAWINGS;

/** Photographs that sit under each drawing, same order as the set above.
 *  All public domain / CC0 — see public/photos/credits.json. */
export const PHOTO_SETS: Record<string, string[]> = {
  anant: ['galaxy.jpg', 'crow.jpg', 'river.jpg', 'prince.jpg', 'house.webp',
    'pralaya.jpg', 'silence.jpg', 'breath.jpg', 'dream.jpg'].map((f) => `photos/${f}`),
};
export const photosOf = (name?: string): string[] => PHOTO_SETS[name ?? ''] ?? [];
