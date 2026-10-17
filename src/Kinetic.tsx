import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadTeko} from '@remotion/google-fonts/Teko';
import {loadFont as loadKalam} from '@remotion/google-fonts/Kalam';
import {loadFont as loadTiro} from '@remotion/google-fonts/TiroDevanagariHindi';
import {loadFont as loadYatra} from '@remotion/google-fonts/YatraOne';

const teko = loadTeko('normal', {weights: ['700'], subsets: ['devanagari', 'latin']}).fontFamily;
const kalam = loadKalam('normal', {weights: ['700'], subsets: ['devanagari', 'latin']}).fontFamily;
const tiro = loadTiro('italic', {weights: ['400'], subsets: ['devanagari', 'latin']}).fontFamily;
const yatra = loadYatra('normal', {weights: ['400'], subsets: ['devanagari', 'latin']}).fontFamily;

export type Word = {w: string; start: number; end: number};
export type KLine = {start: number; end: number; text: string; words?: Word[]};
export type KProps = {lines: KLine[]; title: string; tag: string; audio?: string};

const SCENES = [
  {bg: '#ff5c8a', fg: '#ffffff', accent: '#f6f03c'},
  {bg: '#ececea', fg: '#1a2fe0', accent: '#ff5c8a'},
  {bg: '#ffffff', fg: '#111111', accent: '#ff5c8a'},
  {bg: '#0a0a12', fg: '#ffffff', accent: '#f6f03c'},
];
// word style cycle: huge condensed / brush script / serif italic / display
const STYLES = [
  {family: teko, size: 1, upper: true, accent: false},
  {family: kalam, size: 0.8, upper: false, accent: true},
  {family: tiro, size: 0.85, upper: false, accent: false},
  {family: yatra, size: 0.8, upper: false, accent: true},
];

const wordsOf = (l: KLine): Word[] => {
  if (l.words?.length) return l.words;
  const parts = l.text.split(/\s+/).filter(Boolean);
  const d = (l.end - l.start) / parts.length;
  return parts.map((w, i) => ({w, start: l.start + i * d, end: l.start + (i + 1) * d}));
};

const Rays: React.FC<{color: string}> = ({color}) => {
  const f = useCurrentFrame();
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: 0.35}}>
      {Array.from({length: 14}).map((_, i) => {
        const a = (i / 14) * Math.PI * 2 + f * 0.002;
        return <line key={i} x1={960} y1={540} x2={960 + Math.cos(a) * 2400} y2={540 + Math.sin(a) * 2400} stroke={color} strokeWidth={2} />;
      })}
    </svg>
  );
};

const Scene: React.FC<{line: KLine; idx: number; dur: number; tag: string; title: string}> = ({line, idx, dur, tag, title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pal = SCENES[idx % SCENES.length];
  const words = wordsOf(line);
  const t0 = line.start;
  const size = words.length > 6 ? 190 : 230;
  const flash = interpolate(frame, [0, 4], [0.7, 0], {extrapolateRight: 'clamp'});
  const barIn = spring({frame, fps, config: {damping: 18, stiffness: 90}});

  return (
    <AbsoluteFill style={{background: pal.bg, overflow: 'hidden'}}>
      <Rays color={pal.accent} />
      {/* crosshair lines */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 180, height: 3, background: pal.fg, opacity: 0.25}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 230, height: 3, background: pal.fg, opacity: 0.25}} />
      <div style={{position: 'absolute', left: 60, top: 60, fontFamily: teko, fontSize: 36, letterSpacing: 4, color: pal.accent === '#f6f03c' ? pal.fg : pal.accent}}>{tag}</div>
      <div style={{position: 'absolute', right: 60, top: 60, fontFamily: teko, fontSize: 36, letterSpacing: 4, color: pal.accent === '#f6f03c' ? pal.fg : pal.accent}}>{title}</div>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 110px'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0 46px', lineHeight: 1.05}}>
          {words.map((w, i) => {
            const st = STYLES[(idx + i) % STYLES.length];
            const wf = Math.max(0, Math.round((Math.max(w.start, t0) - t0) * fps));
            const local = frame - wf;
            if (local < 0) return <span key={i} style={{opacity: 0, fontFamily: st.family, fontSize: size * st.size}}>{w.w}</span>;
            const pop = spring({frame: local, fps, config: {damping: 11, stiffness: 220}});
            const wipe = interpolate(local, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
            return (
              <span key={i} style={{position: 'relative', display: 'inline-block', fontFamily: st.family, fontSize: size * st.size,
                color: st.accent ? pal.accent : pal.fg, fontWeight: 700, textTransform: st.upper ? 'uppercase' : 'none',
                transform: `scale(${1.5 - 0.5 * pop}) rotate(${(1 - pop) * (i % 2 ? 6 : -6)}deg)`,
                textShadow: st.accent ? '0 10px 30px rgba(0,0,0,.18)' : 'none'}}>
                {i === Math.floor(words.length / 2) && (
                  <span style={{position: 'absolute', left: -20, right: -20, bottom: '18%', height: 26, background: pal.accent,
                    opacity: 0.85, zIndex: -1, transformOrigin: 'left', transform: `scaleX(${wipe})`}} />
                )}
                {w.w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* sliding gradient bars */}
      <div style={{position: 'absolute', left: 0, bottom: 90, width: 760, height: 46, background: 'linear-gradient(90deg,#1a2fe0,#12c2a0)',
        transform: `translateX(${(1 - barIn) * -820}px)`}} />
      <div style={{position: 'absolute', right: 0, bottom: 136, width: 560, height: 46, background: 'linear-gradient(90deg,#1a2fe0,#12c2a0)',
        transform: `translateX(${(1 - barIn) * 620}px)`}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const Kinetic: React.FC<KProps> = ({lines, title, tag, audio = 'song.mp3'}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const first = lines[0]?.start ?? 0;
  const intro: KLine = {start: 0, end: first, text: title, words: [{w: title, start: 0.2, end: first}]};
  const all = [intro, ...lines];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile(audio)} />
      {all.map((l, i) => {
        const from = Math.max(0, Math.round((i === 0 ? 0 : l.start) * fps));
        const next = all[i + 1] ? Math.round(all[i + 1].start * fps) : durationInFrames;
        if (next <= from) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={next - from}>
            <Scene line={l} idx={i} dur={next - from} tag={tag} title={title} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
