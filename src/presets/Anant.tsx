import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {Moment, Moments} from '../kit/Moments';
import {themeOf} from '../kit/theme';

/** The user's own video, untouched, with keyword motion graphics timed to the narration. */
export const Anant: React.FC<{moments: Moment[]}> = ({moments}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile('anant.mp4')} />
    <Moments moments={moments} T={themeOf('mystery')} low />
  </AbsoluteFill>
);
