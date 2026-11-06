import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadKalam} from '@remotion/google-fonts/Kalam';
import {useAudioData} from '@remotion/media-utils';
import {Drawing, Paper, PencilDrawing} from './kit/Pencil';
import {photosOf, setOf, tintsOf} from './drawings';

const hand = loadKalam('normal', {weights: ['400', '700'], subsets: ['devanagari', 'latin']}).fontFamily;
const INK = '#4a4038';

export type Word = {w: string; start: number; end: number};
/** `block` pins a line to a drawing; without it the lines are split evenly. */
export type SketchLine = {start: number; end: number; text: string; words?: Word[]; block?: number};
export type SketchProps = {
  lines: SketchLine[]; title: string; handle: string; audio: string; duration?: number;
  /** which drawing set to use — see src/drawings/index.ts */
  set?: string;
};

const BLOCK_H = 820;          // one drawing + its lines
const PULLBACK = 7;           // seconds at the end that show the whole page
/** deterministic 0..1 per shot number — same shot always frames the same way */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** where shot `n` sits: how close in, and how far off centre.
 *  the offset can only use the margin the zoom created, or the picture would crop to blank */
const shotOf = (n: number) => {
  const z = 1.1 + rnd(n) * 0.22;
  const room = (z - 1) * 0.85;
  return {z, x: (rnd(n + 97) - 0.5) * room, y: (rnd(n + 211) - 0.5) * room};
};

const hex = (c: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];

/** blend two #rrggbb colours, so the page changes tone as one photograph gives way to the next */
const mix = (a: string, b: string, k: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const at = (x: number, y: number) => Math.round(x + (y - x) * k);
  return `rgb(${at(r1, r2)},${at(g1, g2)},${at(b1, b2)})`;
};

const wordsOf = (l: SketchLine): Word[] => {
  if (l.words?.length) return l.words;
  const parts = l.text.split(/\s+/).filter(Boolean);
  const d = (l.end - l.start) / Math.max(1, parts.length);
  return parts.map((w, i) => ({w, start: l.start + i * d, end: l.start + (i + 1) * d}));
};

/** One lyric line, hand-lettered character by character exactly while it is sung. */
const Handwritten: React.FC<{line: SketchLine; t: number; size: number}> = ({line, t, size}) => (
  <div style={{fontFamily: hand, fontSize: size, color: INK, lineHeight: 1.5,
    letterSpacing: 0.5, display: 'flex', flexWrap: 'wrap', columnGap: size * 0.28}}>
    {wordsOf(line).map((w, i) => {
      // alignment can hand back a zero-length word; then the whole word simply appears
      const p = w.end > w.start
        ? interpolate(t, [w.start, w.end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
        : (t >= w.start ? 1 : 0);
      const shown = Math.round(p * w.w.length);
      if (shown <= 0) return null;
      return <span key={i} style={{opacity: 0.92}}>{w.w.slice(0, shown)}</span>;
    })}
  </div>
);

/** A page block: the drawing on the left, the verse written beside it. */
const Block: React.FC<{strokes: Drawing; lines: SketchLine[]; t: number; faded: number;
  index: number; live: number; photo?: string}> =
({strokes, lines, t, faded, index, live, photo}) => {
  const first = lines[0]?.start ?? 0;
  const last = lines[lines.length - 1]?.end ?? first + 1;
  // the picture is drawn across the first half of the verse, so the hand is always ahead of the words
  // the hand stays ahead of the words: the picture is finished in the verse's first seconds
  const drawEnd = Math.min(first + 6.5, Math.max(first + 3, last - 0.5));
  const p = interpolate(t, [first - 1.5, drawEnd], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const photoIn = interpolate(p, [0.5, 1], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // one slow push across the whole verse — a drift, never a cut
  const from = shotOf(index * 2);
  const to = shotOf(index * 2 + 1);
  const k = interpolate(t, [first - 2, Math.max(first, last) + 4], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glide = k * k * (3 - 2 * k);
  const cam = {
    z: 1 + (from.z + (to.z - from.z) * glide - 1) * live,
    x: (from.x + (to.x - from.x) * glide) * live,
    y: (from.y + (to.y - from.y) * glide) * live,
  };
  return (
    <div style={{height: BLOCK_H, display: 'flex', alignItems: 'center', gap: 60,
      padding: '0 120px', opacity: faded}}>
      <div style={{width: 760, height: 610, flexShrink: 0, padding: 18, overflow: 'hidden',
        boxShadow: '0 2px 26px rgba(80,62,38,.18)', background: 'rgba(255,252,243,.3)'}}>
        <div style={{position: 'relative', width: '100%', height: '100%',
          transform: `translate(${cam.x * 100}%, ${cam.y * 100}%) scale(${cam.z})`}}>
          {photo ? (
            <>
              {/* the photograph surfaces under the pencil as the drawing finishes */}
              <img src={staticFile(photo)} alt="" style={{position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover', opacity: photoIn * faded,
                filter: 'sepia(.34) saturate(.78) contrast(1.06) brightness(.94)'}} />
              <div style={{position: 'absolute', inset: 0, opacity: photoIn * faded,
                background: 'radial-gradient(ellipse at center, rgba(247,241,226,.10) 40%, rgba(74,64,56,.34) 100%)'}} />
            </>
          ) : null}
          {/* the pencil hands over to the photograph instead of sitting on top of it */}
          <div style={{position: 'absolute', inset: 0, opacity: 1 - photoIn * 0.88}}>
            <PencilDrawing strokes={strokes} p={p} faded={faded} />
          </div>
        </div>
      </div>
      <div style={{flex: 1, minWidth: 0, paddingTop: 40, minHeight: 240}}>
        {lines.map((l, i) => {
          // the line holds until the next one starts, so exactly one is on the page
          const until = lines[i + 1]?.start ?? l.end + 3;
          if (t < l.start || t >= until) return null;
          return <Handwritten key={i} line={l} t={t} size={56} />;
        })}
      </div>
    </div>
  );
};

export const Sketch: React.FC<SketchProps> = ({lines, title, handle, audio, duration, set}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, height} = useVideoConfig();
  const t = frame / fps;
  const total = duration ?? durationInFrames / fps;

  // loudness over a fifth of a second — an envelope, not a per-frame flicker
  const data = useAudioData(staticFile(audio));
  let glow = 0;
  if (data) {
    const ch = data.channelWaveforms[0];
    const half = Math.floor(data.sampleRate * 0.22);
    const c = Math.floor(t * data.sampleRate);
    let sum = 0;
    let n = 0;
    for (let i = Math.max(0, c - half); i < Math.min(ch.length, c + half); i += 64) {
      sum += ch[i] * ch[i];
      n++;
    }
    glow = n ? Math.min(1, Math.sqrt(sum / n) * 7) : 0;
  }

  const art = setOf(set);
  const pics = photosOf(set);
  const tints = tintsOf(set);
  const pinned = lines.some((l) => l.block !== undefined);
  const per = Math.ceil(lines.length / art.length);
  const blocks = art.map((strokes, i) => ({
    strokes,
    photo: pics[i],
    lines: pinned ? lines.filter((l) => l.block === i) : lines.slice(i * per, (i + 1) * per),
  })).filter((b) => b.lines.length);

  // which block the song is on, eased so the page glides rather than jumps
  let active = 0;
  blocks.forEach((b, i) => { if (t >= (b.lines[0]?.start ?? 0) - 1.5) active = i; });
  const prevStart = (blocks[active]?.lines[0]?.start ?? 0) - 1.5;
  const nextStart = (blocks[active + 1]?.lines[0]?.start ?? total) - 1.5;
  const glide = nextStart > prevStart
    ? interpolate(t, [Math.max(prevStart, nextStart - 1.1), nextStart], [0, 1],
        {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;
  const pos = active + glide;

  const pageH = blocks.length * BLOCK_H;
  const pull = interpolate(t, [total - PULLBACK, total - PULLBACK + 2.5], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // scale sits on the outer layer (about the viewport centre) and the scroll on the inner one,
  // so the pull-back lands the whole page in frame instead of sliding it away
  // pulling back to all six blocks makes the page a postage stamp; three still reads
  const PULL_BLOCKS = 3;
  const shown = Math.min(PULL_BLOCKS, blocks.length) * BLOCK_H;
  const scale = interpolate(pull, [0, 1], [1, Math.min(1, (height - 80) / shown)]);
  const follow = -(pos * BLOCK_H) + (height - BLOCK_H) / 2;
  const whole = -(pageH - shown / 2) + height / 2;
  const scrollY = interpolate(pull, [0, 1], [follow, whole]);

  const live = 1 - pull;                            // the pull-back shows the page flat again
  const tint = tints.length
    ? mix(tints[Math.min(tints.length - 1, Math.floor(pos))],
        tints[Math.min(tints.length - 1, Math.floor(pos) + 1)], pos - Math.floor(pos))
    : undefined;

  return (
    <AbsoluteFill>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <Paper tint={tint} glow={glow}>
        <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: 'center center'}}>
          <div style={{height: pageH, transform: `translateY(${scrollY}px)`}}>
            {blocks.map((b, i) => (
              <Block key={i} strokes={b.strokes} lines={b.lines} t={t} index={i}
                live={live} photo={b.photo}
                faded={pull > 0 ? 1 : i < pos - 0.6 ? 0.34 : 1} />
            ))}
          </div>
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 70, top: 46, fontFamily: hand, fontSize: 34,
          color: INK, opacity: 0.6}}>{title}</div>
        <div style={{position: 'absolute', right: 70, bottom: 46, fontFamily: hand, fontSize: 28,
          color: INK, opacity: 0.45}}>{handle}</div>
      </Paper>
    </AbsoluteFill>
  );
};
