import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {themeOf} from './kit/theme';
import {Stage, Backdrop} from './kit/Stage';
import {FONTS, faceOf, KineticLine} from './kit/Type';
import {useInOut} from './kit/anim';

export type Word = {w: string; start: number; end: number};
export type Line = {start: number; end: number; text: string; words?: Word[]; img?: string};
/** A picture cut, independent of the lyric lines: the scene changes every few seconds.
 *  `img` may be a still (parallax, needs a depth map) or one of the user's own clips. */
export type SceneCut = {start: number; img: string; clip?: number};
export type KathaProps = {
  lines: Line[]; title: string; tag: string;
  audio?: string; hook?: string; theme?: string; mark?: string;
  /** when present, the pictures come from this track and the lyric slots stay transparent */
  scenes?: SceneCut[];
};

const depthOf = (img: string) => img.replace(/\.png$/i, '.depth.png');
const isClip = (src: string) => /\.(mp4|mov|webm|m4v)$/i.test(src);
const shotBackdrop = (cut: SceneCut): Backdrop => isClip(cut.img)
  ? {kind: 'video', src: cut.img, loopSec: cut.clip}
  : {kind: 'parallax', src: cut.img, depth: depthOf(cut.img)};
const backdropOf = (img: string | undefined, tracked: boolean): Backdrop =>
  tracked ? {kind: 'none'} : img ? {kind: 'image', src: img} : {kind: 'stone'};

/**
 * Picture track: a new illustrated scene every few seconds, each a 2.5D parallax move,
 * cut on its own clock so the visuals never sit still for a long verse.
 */
const SceneTrack: React.FC<{scenes: SceneCut[]; total: number; tn?: string}> = ({scenes, total, tn}) => {
  const {fps} = useVideoConfig();
  const t = themeOf(tn);
  const FADE = Math.round(fps * 0.5);
  return (
    <AbsoluteFill style={{background: t.bg}}>
      {scenes.map((cut, i) => {
        const from = Math.round(cut.start * fps);
        const to = i + 1 < scenes.length ? Math.round(scenes[i + 1].start * fps) : total;
        const dur = Math.min(to - from + FADE, total - from);
        if (dur <= 0) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Shot cut={cut} idx={i} dur={dur} fade={i ? FADE : 0} tn={tn} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** One parallax shot, fading in over the one before it. */
const Shot: React.FC<{cut: SceneCut; idx: number; dur: number; fade: number; tn?: string}> =
({cut, idx, dur, fade, tn}) => {
  const frame = useCurrentFrame();
  const opacity = fade ? interpolate(frame, [0, fade], [0, 1], {extrapolateRight: 'clamp'}) : 1;
  return (
    <AbsoluteFill style={{opacity}}>
      <Stage theme={themeOf(tn)} backdrop={shotBackdrop(cut)} idx={idx} dur={dur} />
    </AbsoluteFill>
  );
};

const wordsOf = (l: Line): Word[] => {
  if (l.words?.length) return l.words;
  const parts = l.text.split(/\s+/).filter(Boolean);
  const d = (l.end - l.start) / parts.length;
  return parts.map((w, i) => ({w, start: l.start + i * d, end: l.start + (i + 1) * d}));
};

const Chrome: React.FC<{tn?: string; tag: string; title: string; mark: string}> = ({tn, tag, title, mark}) => {
  const t = themeOf(tn);
  const {width, height} = useVideoConfig();
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.1, height: 2,
        background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`, opacity: 0.55}} />
      <div style={{position: 'absolute', left: width * 0.045, top: height * 0.055, fontFamily: FONTS.sans,
        fontSize: width / 50, letterSpacing: 5, color: t.accent2, opacity: 0.85}}>{tag}</div>
      <div style={{position: 'absolute', right: width * 0.045, top: height * 0.055,
        fontSize: width / 50, opacity: 0.85}}>{mark}</div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: height * 0.022, textAlign: 'center',
        fontFamily: FONTS.sans, fontSize: width / 58, letterSpacing: 6,
        color: t.accent2, opacity: 0.6}}>{title}</div>
    </>
  );
};

const Scene: React.FC<{line: Line; idx: number; dur: number; title: string; tag: string;
  isHook: boolean; tn?: string; mark: string; tracked?: boolean}> =
({line, idx, dur, title, tag, isHook, tn, mark, tracked}) => {
  const t = themeOf(tn);
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;
  const words = wordsOf(line);
  const base = (portrait ? width / 7.4 : width / 14) * (words.length > 7 ? 0.76 : 1) * (isHook ? 1.1 : 1);
  const flash = interpolate(frame, [0, 5], [isHook ? 0.5 : 0.22, 0], {extrapolateRight: 'clamp'});
  const barIn = spring({frame, fps, config: {damping: 18, stiffness: 90}});
  const out = interpolate(frame, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <Stage theme={t} backdrop={backdropOf(line.img, Boolean(tracked))} idx={idx} dur={dur}
      embers rays={isHook}>
      <Chrome tn={tn} tag={tag} title={title} mark={mark} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center',
        padding: `0 ${width * 0.07}px`, opacity: out}}>
        <KineticLine words={words} t0={line.start} theme={t} size={base} highlight={isHook}
          face={isHook ? faceOf(t) : FONTS.serif} />
      </AbsoluteFill>

      <div style={{position: 'absolute', left: 0, bottom: height * 0.085, width: width * 0.38,
        height: height * 0.012, background: `linear-gradient(90deg,${t.accent},${t.accent2})`,
        transform: `translateX(${(1 - barIn) * -width * 0.45}px)`}} />
      <div style={{position: 'absolute', right: 0, bottom: height * 0.062, width: width * 0.26,
        height: height * 0.012, background: `linear-gradient(90deg,${t.accent2},${t.accent})`,
        transform: `translateX(${(1 - barIn) * width * 0.32}px)`}} />
      <AbsoluteFill style={{background: t.accent2, opacity: flash, pointerEvents: 'none'}} />
    </Stage>
  );
};

/** Instrumental stretch: no lyric on screen, just the mark breathing. */
const Interlude: React.FC<{idx: number; dur: number; title: string; tag: string;
  img?: string; tn?: string; mark: string; tracked?: boolean}> =
({idx, dur, title, tag, img, tn, mark, tracked}) => {
  const t = themeOf(tn);
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const breathe = 1 + Math.sin(frame / 24) * 0.04;
  const fade = useInOut(dur, 14);
  return (
    <Stage theme={t} backdrop={backdropOf(img, Boolean(tracked))} idx={idx} dur={dur} embers rays>
      <Chrome tn={tn} tag={tag} title={title} mark={mark} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: fade}}>
        <div style={{fontSize: width / 7, transform: `scale(${breathe})`,
          filter: `drop-shadow(0 0 ${width / 40}px ${t.accent})`}}>{mark}</div>
        <div style={{marginTop: width / 60, fontFamily: FONTS.sans, fontSize: width / 26,
          letterSpacing: 10, color: t.accent2, opacity: 0.9}}>{title}</div>
      </AbsoluteFill>
    </Stage>
  );
};

export const Katha: React.FC<KathaProps> = ({
  lines, title, tag, audio = 'song.mp3', hook = 'कथा और रहस्य', theme, mark = '🔱', scenes,
}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const f = (sec: number) => Math.round(sec * fps);

  type Slot = {from: number; to: number; line?: Line; img?: string};
  const slots: Slot[] = [];
  let cursor = 0;
  lines.forEach((l, li) => {
    const from = f(l.start);
    if (from - cursor > fps * 0.4) {
      slots.push({from: cursor, to: from, img: l.img ?? lines[li - 1]?.img});   // instrumental
    }
    slots.push({from, to: Math.max(from + 1, f(l.end)), line: l});
    cursor = Math.max(from + 1, f(l.end));
  });
  if (durationInFrames - cursor > fps * 0.4) {
    slots.push({from: cursor, to: durationInFrames, img: lines[lines.length - 1]?.img});
  }

  return (
    <AbsoluteFill style={{background: themeOf(theme).bg}}>
      <Audio src={staticFile(audio)} />
      {scenes?.length ? <SceneTrack scenes={scenes} total={durationInFrames} tn={theme} /> : null}
      {slots.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.to - s.from}>
          {s.line ? (
            <Scene line={s.line} idx={i} dur={s.to - s.from} title={title} tag={tag}
              isHook={s.line.text.includes(hook)} tn={theme} mark={mark} tracked={Boolean(scenes?.length)} />
          ) : (
            <Interlude idx={i} dur={s.to - s.from} title={title} tag={tag} img={s.img} tn={theme}
              mark={mark} tracked={Boolean(scenes?.length)} />
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
