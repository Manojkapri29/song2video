import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {themeOf} from '../kit/theme';
import {Stage} from '../kit/Stage';
import {Heading, FONTS, faceOf} from '../kit/Type';
import {useIn, useInOut, usePop} from '../kit/anim';

export type BrandProps = {
  title: string;
  sub?: string;
  mark?: string;          // emoji or short glyph used as the logo stand-in
  theme?: string;
  audio?: string;
  variant?: 'intro' | 'outro';
};

/** Logo reveal (intro) and subscribe card (outro) — the two clips every upload needs. */
export const Brand: React.FC<BrandProps> = ({title, sub, mark = '🔱', theme: tn, audio, variant = 'intro'}) => {
  const theme = themeOf(tn);
  const {width, height, durationInFrames, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const fade = useInOut(durationInFrames, 10);

  const markPop = usePop(4, 11, 150);
  const ring = useIn(8, 26);
  const flash = interpolate(frame, [6, 14], [0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const breathe = 1 + Math.sin(frame / 22) * 0.03;
  const markSize = Math.min(width, height) / (variant === 'intro' ? 3.4 : 4.6);

  return (
    <Stage theme={theme} backdrop={{kind: 'gradient'}} dur={durationInFrames} embers rays>
      {audio && <Audio src={staticFile(audio)} />}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: fade}}>
        <div style={{position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <svg width={markSize * 2.2} height={markSize * 2.2} style={{position: 'absolute'}}>
            <circle cx={markSize * 1.1} cy={markSize * 1.1} r={markSize * 0.95}
              fill="none" stroke={theme.accent} strokeWidth={Math.max(2, width / 400)}
              strokeDasharray={2 * Math.PI * markSize * 0.95}
              strokeDashoffset={(1 - ring) * 2 * Math.PI * markSize * 0.95}
              transform={`rotate(-90 ${markSize * 1.1} ${markSize * 1.1})`} opacity={0.85} />
          </svg>
          <div style={{fontSize: markSize, transform: `scale(${(0.6 + 0.4 * markPop) * breathe})`,
            filter: `drop-shadow(0 0 ${markSize / 5}px ${theme.accent})`}}>{mark}</div>
        </div>

        <div style={{marginTop: height * 0.05, textAlign: 'center'}}>
          <Heading text={title} theme={theme} size={width / (title.length > 18 ? 18 : 12)} delay={14} />
        </div>
        {sub && (
          <div style={{marginTop: height * 0.025, fontFamily: FONTS.sans, fontSize: width / 40, letterSpacing: 8,
            color: theme.accent2, opacity: useIn(26, 14)}}>{sub}</div>
        )}
        {variant === 'outro' && (
          <div style={{marginTop: height * 0.05, display: 'flex', gap: width * 0.02, alignItems: 'center',
            opacity: useIn(34, 12)}}>
            <div style={{background: theme.accent, color: '#fff', fontFamily: faceOf(theme),
              fontSize: width / 34, padding: `${height * 0.014}px ${width * 0.035}px`, borderRadius: width / 90,
              transform: `scale(${1 + Math.sin(frame / 9) * 0.03})`}}>SUBSCRIBE</div>
            <div style={{fontSize: width / 28}}>🔔</div>
          </div>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{background: theme.accent2, opacity: flash, pointerEvents: 'none'}} />
    </Stage>
  );
};
