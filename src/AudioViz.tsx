/** One-click 2D motion graphics, animated from the sound itself.
 *
 *  Everything on screen is driven by tools/audiomap.py: beat times, an energy
 *  envelope and three frequency bands. No lyrics, no transcription — which is the
 *  whole reason this one can be one click. The lyric path needs a human to fix
 *  whisper's Hindi before anything goes on screen; this one has nothing to get
 *  wrong, so it renders unattended.
 */
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {themeOf} from './kit/theme';
import {Embers, Petals, Rays} from './kit/Stage';
import {FONTS, faceOf} from './kit/Type';

export type AudioMap = {
  duration: number; bpm: number; fps: number;
  beats: number[]; energy: number[]; low: number[]; mid: number[]; high: number[];
};
export type AudioVizProps = {
  map: AudioMap;
  audio?: string;
  title: string;
  tag?: string;
  theme?: string;
};

/** Sample one of the map's arrays at the current time, interpolating between samples. */
const at = (arr: number[], t: number, mapFps: number) => {
  if (!arr.length) return 0;
  const x = Math.max(0, Math.min(t * mapFps, arr.length - 1));
  const i = Math.floor(x);
  const f = x - i;
  return arr[i] * (1 - f) + (arr[Math.min(i + 1, arr.length - 1)] ?? arr[i]) * f;
};

/** 1 right on a beat, decaying to 0 over `fall` seconds — the kick behind every pop. */
const beatPulse = (beats: number[], t: number, fall = 0.35) => {
  let best = 0;
  for (const b of beats) {
    if (b > t) break;
    best = b;
  }
  const since = t - best;
  return since < 0 || since > fall ? 0 : 1 - since / fall;
};

/** Radial bars around the centre, each one riding a slice of the spectrum. */
const Ring: React.FC<{map: AudioMap; t: number; theme: ReturnType<typeof themeOf>; pulse: number}> =
({map, t, theme, pulse}) => {
  const n = 64;
  const low = at(map.low, t, map.fps);
  const mid = at(map.mid, t, map.fps);
  const high = at(map.high, t, map.fps);
  const r = 230 + pulse * 42 + low * 30;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        // low frequencies drive the bars near the bottom, highs the ones up top
        const tilt = Math.abs(Math.sin(a));
        const amp = low * (1 - tilt) + high * tilt * 0.8 + mid * 0.35;
        const len = 18 + amp * 190 + pulse * 26;
        const x1 = 960 + Math.cos(a) * r;
        const y1 = 540 + Math.sin(a) * r;
        const x2 = 960 + Math.cos(a) * (r + len);
        const y2 = 540 + Math.sin(a) * (r + len);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i % 8 === 0 ? theme.accent2 : theme.accent}
            strokeWidth={i % 8 === 0 ? 7 : 4} strokeLinecap="round"
            opacity={0.35 + amp * 0.65} />
        );
      })}
      <circle cx={960} cy={540} r={r - 14} fill="none"
        stroke={theme.accent} strokeWidth={2} opacity={0.18 + pulse * 0.3} />
    </svg>
  );
};

/** Rings thrown off on each beat, expanding and fading. */
const Shockwaves: React.FC<{beats: number[]; t: number; colour: string}> = ({beats, t, colour}) => (
  <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
    {beats.filter((b) => t - b >= 0 && t - b < 1.6).map((b) => {
      const age = (t - b) / 1.6;
      return (
        <circle key={b} cx={960} cy={540} r={240 + age * 620} fill="none"
          stroke={colour} strokeWidth={3 * (1 - age)} opacity={(1 - age) * 0.5} />
      );
    })}
  </svg>
);

export const AudioViz: React.FC<AudioVizProps> = ({map, audio, title, tag, theme: themeName}) => {
  const theme = themeOf(themeName);
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const portrait = height > width;

  const energy = at(map.energy, t, map.fps);
  const low = at(map.low, t, map.fps);
  const pulse = beatPulse(map.beats, t);

  // the whole frame breathes on the kick; kept small so it reads as weight, not wobble
  const scale = 1 + pulse * 0.018 + low * 0.01;
  const titleIn = interpolate(t, [0.3, 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = 0.25 + energy * 0.5 + pulse * 0.25;

  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 50% 50%, ${theme.accent}${Math.round(glow * 40).toString(16).padStart(2, '0')} 0%, transparent 62%)`,
      }} />
      <Rays theme={theme} spin={0.0011} opacity={0.1 + energy * 0.16} />

      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        <Shockwaves beats={map.beats} t={t} colour={theme.accent2} />
        <Ring map={map} t={t} theme={theme} pulse={pulse} />
      </AbsoluteFill>

      {theme.light ? <Petals theme={theme} count={18} /> : <Embers theme={theme} count={22} />}

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <div style={{
          fontFamily: faceOf(theme),
          fontSize: portrait ? 104 : 132,
          color: theme.ink,
          letterSpacing: 1,
          padding: '0 8%',
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 28}px) scale(${1 + pulse * 0.03})`,
          textShadow: `0 0 ${26 + pulse * 46}px ${theme.accent}`,
        }}>{title}</div>
        {tag ? (
          <div style={{
            fontFamily: FONTS.sans, fontSize: portrait ? 40 : 46, marginTop: 26,
            color: theme.accent2, letterSpacing: 6, opacity: titleIn * (0.55 + pulse * 0.45),
          }}>{tag}</div>
        ) : null}
      </AbsoluteFill>

      {audio ? <Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};
