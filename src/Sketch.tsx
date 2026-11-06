import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadKalam} from '@remotion/google-fonts/Kalam';
import {Drawing, Paper, PencilDrawing} from './kit/Pencil';
import {setOf} from './drawings';

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
const Block: React.FC<{strokes: Drawing; lines: SketchLine[]; t: number; faded: number}> =
({strokes, lines, t, faded}) => {
  const first = lines[0]?.start ?? 0;
  const last = lines[lines.length - 1]?.end ?? first + 1;
  // the picture is drawn across the first half of the verse, so the hand is always ahead of the words
  // the hand stays ahead of the words: the picture is finished in the verse's first seconds
  const drawEnd = Math.min(first + 6.5, Math.max(first + 3, last - 0.5));
  const p = interpolate(t, [first - 1.5, drawEnd], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{height: BLOCK_H, display: 'flex', alignItems: 'center', gap: 60,
      padding: '0 120px', opacity: faded}}>
      <div style={{width: 880, height: 610, padding: 18,
        boxShadow: '0 2px 26px rgba(80,62,38,.18)', background: 'rgba(255,252,243,.3)'}}>
        <PencilDrawing strokes={strokes} p={p} faded={faded} />
      </div>
      <div style={{flex: 1, paddingTop: 40, minHeight: 240}}>
        {lines.map((l, i) => {
          // the line holds until the next one starts, so exactly one is on the page
          const until = lines[i + 1]?.start ?? l.end + 3;
          if (t < l.start || t >= until) return null;
          return <Handwritten key={i} line={l} t={t} size={62} />;
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

  const art = setOf(set);
  const pinned = lines.some((l) => l.block !== undefined);
  const per = Math.ceil(lines.length / art.length);
  const blocks = art.map((strokes, i) => ({
    strokes,
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

  return (
    <AbsoluteFill>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <Paper>
        <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: 'center center'}}>
          <div style={{height: pageH, transform: `translateY(${scrollY}px)`}}>
            {blocks.map((b, i) => (
              <Block key={i} strokes={b.strokes} lines={b.lines} t={t}
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
