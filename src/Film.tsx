import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData} from '@remotion/media-utils';
import {Cinema} from './kit/Cinema';
import {KineticLine} from './kit/Type';
import {themeOf} from './kit/theme';
import {photosOf, tintsOf} from './drawings';
import {Scene as SceneType} from './kit/Flat2D';
import {scenesOf} from './scenes2d';
import type {SketchLine, SketchProps} from './Sketch';

const BAR = 0.075;        // letterbox height, as a share of the frame
const HOLD = 1.4;         // seconds a finished line stays on screen

const hex = (c: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];

const mix = (a: string, b: string, k: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const at = (x: number, y: number) => Math.round(x + (y - x) * k);
  return `rgb(${at(r1, r2)},${at(g1, g2)},${at(b1, b2)})`;
};

const wordsOf = (l: SketchLine) => {
  if (l.words?.length) return l.words.filter((w) => w.end > w.start);
  const parts = l.text.split(/\s+/).filter(Boolean);
  const d = (l.end - l.start) / Math.max(1, parts.length);
  return parts.map((w, i) => ({w, start: l.start + i * d, end: l.start + (i + 1) * d}));
};

/** Loudness over a window, as 0..1. A short window tracks syllables, a long one the mood. */
const rms = (ch: Float32Array, rate: number, at: number, seconds: number, gain: number) => {
  const half = Math.floor(rate * seconds);
  const c = Math.floor(at * rate);
  let sum = 0;
  let n = 0;
  for (let i = Math.max(0, c - half); i < Math.min(ch.length, c + half); i += 32) {
    sum += ch[i] * ch[i];
    n++;
  }
  return n ? Math.min(1, Math.sqrt(sum / n) * gain) : 0;
};

/** One full-bleed photograph with a slow push, crossfading with its neighbours. */
const Plate: React.FC<{src: string; span: [number, number]; t: number; pulse: number}> =
({src, span, t, pulse}) => {
  const [a, b] = span;
  const on = Math.min(
    interpolate(t, [a, a + 1.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(t, [b - 1.2, b], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  if (on <= 0) return null;
  const k = interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: on}}>
      <img src={staticFile(src)} alt="" style={{width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${1.08 + k * 0.14 + pulse * 0.01}) translate(${(k - 0.5) * 2.2}%, ${(0.5 - k) * 1.2}%)`,
        filter: 'saturate(.88) contrast(1.1) brightness(.84)'}} />
    </AbsoluteFill>
  );
};

/** One 2D scene, crossfading with its neighbours exactly as a photograph would. */
const Flat: React.FC<{scene?: SceneType; span: [number, number]; t: number; beat: number;
  mood: number; tint: string; accent: string; w: number; h: number}> =
({scene: S, span, t, beat, mood, tint, accent, w, h}) => {
  const [a, b] = span;
  const on = Math.min(
    interpolate(t, [a, a + 1.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(t, [b - 1.2, b], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  if (on <= 0 || !S) return null;
  const k = interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: on}}>
      <AbsoluteFill style={{transform: `scale(${1.04 + k * 0.06 + beat * 0.008})`}}>
        <S t={t} k={k} beat={beat} mood={mood} tint={tint} accent={accent} w={w} h={h} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Cinematic cut of the same story: full-bleed photography, karaoke type, audio-driven light. */
export const Film: React.FC<SketchProps & {art?: 'photo' | '2d'}> =
({lines, title, handle, audio, duration, set, art = 'photo'}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const total = duration ?? durationInFrames / fps;
  const theme = themeOf('katha');

  const pics = photosOf(set);
  const tints = tintsOf(set);
  const scenes = scenesOf(set);
  const flat = art === '2d' && scenes.length > 0;

  // two envelopes off the same narration: one tracks syllables, one the mood of the passage
  const data = useAudioData(staticFile(audio));
  const beat = data ? rms(data.channelWaveforms[0], data.sampleRate, t, 0.05, 8) : 0;
  const mood = data ? rms(data.channelWaveforms[0], data.sampleRate, t, 0.5, 6) : 0;

  // the lines of each block, in the order the drawings/photos are listed
  const count = Math.max(pics.length, scenes.length, ...lines.map((l) => (l.block ?? 0) + 1));
  const blocks = Array.from({length: count}, (_, i) => lines.filter((l) => (l.block ?? 0) === i))
    .map((ls, i) => ({i, lines: ls}))
    .filter((b) => b.lines.length);

  const spans: [number, number][] = blocks.map((b, j) => [
    Math.max(0, (b.lines[0].start) - 2.5),
    j + 1 < blocks.length ? Math.max(0, blocks[j + 1].lines[0].start - 2.5) : total,
  ]);

  const at = spans.findIndex(([a, b]) => t >= a && t < b);
  const cur = at < 0 ? blocks.length - 1 : at;
  const span = spans[cur] ?? [0, total];
  const into = interpolate(t, [span[0], span[0] + 1.4], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tint = tints.length
    ? mix(tints[Math.max(0, cur - 1)] ?? tints[0], tints[cur] ?? tints[0], into)
    : theme.accent;

  const safe = height * BAR;
  const glow = 0.1 + mood * 0.3;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {audio ? <Audio src={staticFile(audio)} /> : null}

      <Cinema dur={durationInFrames}>
        {blocks.map((b, j) => flat
          ? <Flat key={b.i} scene={scenes[b.i]} span={spans[j]} t={t} beat={beat} mood={mood}
              tint={tints[b.i] ?? theme.accent} accent={theme.accent} w={width} h={height} />
          : <Plate key={b.i} src={pics[b.i]} span={spans[j]} t={t} pulse={beat} />)}
        {/* a photograph needs the colour laid on it; a drawn scene is already that colour */}
        {/* the passage's colour, laid over the photograph */}
        {flat ? null : <AbsoluteFill style={{background: tint, mixBlendMode: 'color', opacity: 0.42}} />}
        {/* and its light, breathing with the narration */}
        <AbsoluteFill style={{mixBlendMode: 'screen', opacity: glow,
          background: `radial-gradient(ellipse at 50% 62%, ${tint} 0%, rgba(0,0,0,0) 62%)`}} />
      </Cinema>

      {/* the type sits below the picture's light, never inside the grade */}
      <AbsoluteFill style={{background:
        `linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 26%,`
        + ` rgba(0,0,0,0) 44%, rgba(0,0,0,.82) 86%)`}} />

      {lines.map((l, i) => {
        const until = Math.min(l.end + HOLD, lines[i + 1]?.start ?? l.end + HOLD);
        const from = Math.round(l.start * fps);
        const len = Math.max(1, Math.round((until - l.start) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={len} layout="none">
            <Line words={wordsOf(l)} t0={l.start} len={len} theme={theme} width={width} bottom={safe} />
          </Sequence>
        );
      })}

      {/* a single accent rule that answers the voice */}
      <div style={{position: 'absolute', left: '50%', bottom: safe + height * 0.075,
        width: width * (0.06 + beat * 0.3), height: 3, marginLeft: -width * (0.03 + beat * 0.15),
        background: theme.accent, opacity: 0.25 + beat * 0.55, borderRadius: 2}} />

      <div style={{position: 'absolute', left: width * 0.045, top: safe + height * 0.045,
        fontFamily: 'Teko, sans-serif', fontSize: width / 54, letterSpacing: 5,
        color: theme.ink, opacity: 0.6, textTransform: 'uppercase'}}>{title}</div>
      <div style={{position: 'absolute', right: width * 0.045, bottom: safe + height * 0.014,
        fontFamily: 'Teko, sans-serif', fontSize: width / 64, letterSpacing: 4,
        color: theme.accent2, opacity: 0.55}}>{handle}</div>

      {/* how far through the story we are */}
      <div style={{position: 'absolute', left: 0, bottom: safe, height: 2,
        width: `${(t / total) * 100}%`, background: theme.accent, opacity: 0.5}} />

      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: safe, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: safe, background: '#000'}} />
    </AbsoluteFill>
  );
};

/** A lyric line: karaoke highlight inside, the block itself easing in and out. */
const Line: React.FC<{words: {w: string; start: number; end: number}[]; t0: number; len: number;
  theme: ReturnType<typeof themeOf>; width: number; bottom: number}> =
({words, t0, len, theme, width, bottom}) => {
  const frame = useCurrentFrame();
  const on = Math.min(
    interpolate(frame, [0, 9], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [len - 9, len], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  return (
    <div style={{position: 'absolute', left: width * 0.12, right: width * 0.12,
      bottom: bottom + width * 0.08, opacity: on,
      transform: `translateY(${(1 - on) * 18}px)`}}>
      <KineticLine words={words} t0={t0} theme={theme} size={width / 23} />
    </div>
  );
};
