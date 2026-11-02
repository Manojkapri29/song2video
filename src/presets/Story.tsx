import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Parallax} from '../kit/Parallax';
import {themeOf} from '../kit/theme';
import {faceOf} from '../kit/Type';
import {sec} from '../kit/anim';

/** One narrated still: the picture drifts on its parallax camera while the voice reads `text`. */
export type Scene = {img: string; depth: string; audio: string; dur: number; text: string};
export type StoryProps = {scenes: Scene[]; theme?: string};

export const STORY_FPS = 30;
export const storyFrames = (scenes: Scene[]) =>
  Math.max(STORY_FPS, scenes.reduce((n, s) => n + sec(STORY_FPS, s.dur), 0));

const Caption: React.FC<{text: string; frames: number; theme: ReturnType<typeof themeOf>}> =
({text, frames, theme}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const opacity = interpolate(f, [0, 12, frames - 12, frames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: height * 0.07, opacity}}>
      <div style={{maxWidth: width * 0.78, padding: `${height * 0.022}px ${width * 0.03}px`,
        background: 'rgba(0,0,0,.52)', borderRadius: 14, color: '#fff6e8', textAlign: 'center',
        fontFamily: faceOf(theme), fontSize: width / 40, lineHeight: 1.3}}>{text}</div>
    </AbsoluteFill>
  );
};

/** Narrated explainer: one parallax still per scene, each cut to its own voice-over. */
export const Story: React.FC<StoryProps> = ({scenes, theme}) => {
  const t = themeOf(theme);
  let from = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scenes.map((s, i) => {
        const frames = sec(STORY_FPS, s.dur);
        const start = from;
        from += frames;
        return (
          <Sequence key={i} from={start} durationInFrames={frames}>
            <AbsoluteFill>
              <Parallax src={s.img} depth={s.depth} idx={i} dur={frames} />
            </AbsoluteFill>
            <Caption text={s.text} frames={frames} theme={t} />
            <Audio src={staticFile(s.audio)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
