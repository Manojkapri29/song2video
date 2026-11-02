import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Moment, Moments} from '../kit/Moments';
import {themeOf} from '../kit/theme';

export type Line = {at: number; dur: number; text: string};

const FPS = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** One lyric line, typed letter by letter like a hand-lettered pencil caption, on a paper strip. */
const LineStrip: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const len = [...text].length;
  const shown = Math.floor(interpolate(f, [0, Math.min(len * 1.2, 50)], [0, len], clamp));
  const fade = interpolate(f, [0, 8], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: width * 0.06, right: width * 0.06, bottom: height * 0.07,
      opacity: fade, padding: `${height * 0.018}px ${width * 0.02}px`, background: '#efe6d2ee',
      border: '2px solid #4a4438', borderRadius: 6, boxShadow: '0 6px 24px #0008',
      fontFamily: 'sans-serif', fontSize: width / 42, color: '#1f1b14', textAlign: 'center'}}>
      {[...text].slice(0, shown).join('')}
    </div>
  );
};

/** The user's own video, untouched, with keyword motion graphics and lyric strips timed to the narration. */
export const Anant: React.FC<{moments: Moment[]; lines: Line[]}> = ({moments, lines}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile('anant.mp4')} />
    <Moments moments={moments} T={themeOf('mystery')} low />
    {lines.map((l, i) => (
      <Sequence key={i} from={Math.round(l.at * FPS)} durationInFrames={Math.max(1, Math.round(l.dur * FPS))}>
        <LineStrip text={l.text} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
