import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {themeOf} from '../kit/theme';
import {Stage, Backdrop} from '../kit/Stage';
import {Heading, FONTS, faceOf} from '../kit/Type';
import {useIn, useInOut, usePop} from '../kit/anim';

export type SocialProps = {
  hook: string;          // the big line that stops the scroll
  body?: string;
  cta?: string;
  handle?: string;
  img?: string;
  theme?: string;
};

/** Quote / hook card for Shorts and Instagram: one strong line, animated in. */
export const SocialPost: React.FC<SocialProps> = ({hook, body, cta, handle, img, theme: tn}) => {
  const theme = themeOf(tn);
  const {width, height, durationInFrames} = useVideoConfig();
  const frame = useCurrentFrame();
  const fade = useInOut(durationInFrames, 10);
  const backdrop: Backdrop = img ? {kind: 'image', src: img} : {kind: 'gradient'};
  const barIn = usePop(2, 18, 120);
  const bodyIn = useIn(18, 14);
  const ctaPulse = 1 + Math.sin(frame / 10) * 0.035;

  return (
    <Stage theme={theme} backdrop={backdrop} dur={durationInFrames} embers>
      <AbsoluteFill style={{justifyContent: 'center', padding: `0 ${width * 0.08}px`, opacity: fade}}>
        <div style={{height: height * 0.005, width: width * 0.22, background: theme.accent,
          transform: `scaleX(${barIn})`, transformOrigin: 'left', marginBottom: height * 0.03}} />

        {/* size from character count, so a short hook never orphans its last word */}
        <Heading text={hook} theme={theme}
          size={Math.max(width / 22, Math.min(width / 9, (width * 1.4) / hook.length))} />

        {body && (
          <div style={{marginTop: height * 0.03, fontFamily: FONTS.serif, fontSize: width / 22,
            color: theme.ink, opacity: bodyIn * 0.92, lineHeight: 1.35}}>{body}</div>
        )}

        {cta && (
          <div style={{marginTop: height * 0.05, alignSelf: 'flex-start', background: theme.accent,
            color: '#fff', fontFamily: faceOf(theme), fontSize: width / 20,
            padding: `${height * 0.012}px ${width * 0.05}px`, borderRadius: width / 60,
            transform: `scale(${ctaPulse})`, opacity: useIn(28, 12)}}>{cta}</div>
        )}
      </AbsoluteFill>

      {handle && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: height * 0.035, textAlign: 'center',
          fontFamily: FONTS.sans, fontSize: width / 30, letterSpacing: 5, color: theme.accent2, opacity: 0.8}}>
          {handle}
        </div>
      )}
    </Stage>
  );
};
