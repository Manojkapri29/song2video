import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData} from '@remotion/media-utils';
import {loadFont as loadTiro} from '@remotion/google-fonts/TiroDevanagariHindi';

const hindi = loadTiro('normal', {weights: ['400'], subsets: ['devanagari', 'latin']}).fontFamily;

export type Shot = {src: string; start: number; end: number};
export type Line = {text: string; start: number; end: number};
export type ReelProps = {shots: Shot[]; lines: Line[]; audio: string; handle: string; duration: number};

const ss = (a: number, b: number, t: number) => {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Loudness over a window, 0..1 — the light and the type breathe with the narration. */
const rms = (ch: Float32Array, rate: number, at: number, seconds: number, gain: number) => {
  const half = Math.floor(rate * seconds), c = Math.floor(at * rate);
  let sum = 0, n = 0;
  for (let i = Math.max(0, c - half); i < Math.min(ch.length, c + half); i += 32) { sum += ch[i] * ch[i]; n++; }
  return n ? Math.min(1, Math.sqrt(sum / n) * gain) : 0;
};

/** One painted frame, moved: every shot gets its own push, pull or drift, and never sits still. */
const Plate: React.FC<{shot: Shot; i: number; t: number; beat: number}> = ({shot, i, t, beat}) => {
  const k = Math.min(1, Math.max(0, (t - shot.start) / (shot.end - shot.start)));
  const kind = i % 4;                                   // push / pull / pan left / pan right
  const z0 = kind === 1 ? 1.26 : 1.06, z1 = kind === 1 ? 1.04 : 1.30;
  const z = z0 + (z1 - z0) * k + beat * 0.012;
  const px = kind === 2 ? -1 : kind === 3 ? 1 : (rnd(i) - .5) * 1.2;
  const py = kind === 0 ? -1 : .4;
  const rot = (rnd(i + 9) - .5) * 1.6 * k;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(shot.src)}
        style={{width: '100%', height: '100%', objectFit: 'cover',
          transform: `scale(${z}) translate(${px * k * 4}%, ${py * k * 3}%) rotate(${rot}deg)`,
          filter: 'saturate(1.06) contrast(1.05)'}} />
    </AbsoluteFill>
  );
};

/** Embers and dust: the air is never empty. */
const Air: React.FC<{t: number; beat: number}> = ({t, beat}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({length: 70}, (_, i) => {
        const life = (t * (.05 + rnd(i) * .07) + rnd(i + 40)) % 1;
        const x = rnd(i + 90) * width + Math.sin(t * .7 + i) * 26;
        const y = height - life * height * 1.08;
        const s = 1.4 + rnd(i * 3) * 3.4;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s,
          borderRadius: '50%', background: i % 3 ? '#ffb24a' : '#ff7a28',
          opacity: (1 - life) * (.5 + beat * .5)}} />;
      })}
    </AbsoluteFill>
  );
};

/** The line, word by word, as it is spoken. */
const Caption: React.FC<{line: Line; t: number; width: number; bottom: number}> =
({line, t, width, bottom}) => {
  const words = line.text.split(/\s+/).filter(Boolean);
  const each = (line.end - line.start) / Math.max(1, words.length);
  return (
    <div style={{position: 'absolute', left: width * .07, right: width * .07, bottom,
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      gap: `${width * .018}px ${width * .022}px`}}>
      {words.map((w, i) => {
        const on = ss(line.start + i * each * .75, line.start + i * each * .75 + .22, t);
        return (
          <span key={i} style={{fontFamily: hindi, fontSize: width / 15, color: '#fff6e8',
            opacity: on, transform: `translateY(${(1 - on) * 26}px) scale(${.92 + on * .08})`,
            textShadow: '0 6px 26px rgba(0,0,0,.9), 0 2px 6px rgba(0,0,0,.95)'}}>{w}</span>
        );
      })}
    </div>
  );
};

export const Reel: React.FC<ReelProps> = ({shots, lines, audio, handle, duration}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const total = duration ?? durationInFrames / fps;

  const data = useAudioData(staticFile(audio));
  const beat = data ? rms(data.channelWaveforms[0], data.sampleRate, t, .05, 7) : 0;
  const mood = data ? rms(data.channelWaveforms[0], data.sampleRate, t, .5, 5) : 0;

  const i = Math.max(0, shots.findIndex((s) => t >= s.start && t < s.end));
  const shot = shots[i] ?? shots[shots.length - 1];
  // a three-frame flash on every cut: the eye reads it as an edit, not a dissolve
  const flash = shot ? Math.max(0, 1 - (t - shot.start) * 9) : 0;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <Plate shot={shot} i={i} t={t} beat={beat} />
      {/* the firelight in the frame breathes with the voice */}
      <AbsoluteFill style={{mixBlendMode: 'screen', opacity: .10 + mood * .22,
        background: `radial-gradient(ellipse at 50% 40%, #ff9a40 0%, rgba(0,0,0,0) 62%)`}} />
      <Air t={t} beat={beat} />
      {/* top and bottom scrims, so the type always reads */}
      <AbsoluteFill style={{background:
        'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%,'
        + ' rgba(0,0,0,0) 52%, rgba(0,0,0,.72) 82%, rgba(0,0,0,.95) 100%)'}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash * .5}} />
      {lines.map((l, k) => {
        const from = Math.round(l.start * fps);
        const len = Math.max(1, Math.round((Math.min(l.end + .5, lines[k + 1]?.start ?? l.end + .8) - l.start) * fps));
        return (
          <Sequence key={k} from={from} durationInFrames={len} layout="none">
            <Caption line={l} t={t} width={width} bottom={height * .17} />
          </Sequence>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: height * .055, textAlign: 'center',
        fontFamily: hindi, fontSize: width / 34, color: '#ffd9a0', opacity: .55}}>{handle}</div>
      {/* the last second fades out */}
      <AbsoluteFill style={{background: '#000', opacity: ss(total - 1, total, t)}} />
    </AbsoluteFill>
  );
};
