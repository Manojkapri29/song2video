import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {themeOf} from '../kit/theme';
import {Stage, Backdrop} from '../kit/Stage';
import {Heading, Counter, FONTS, faceOf, LowerThird} from '../kit/Type';
import {useIn, useInOut, usePop, stagger} from '../kit/anim';

/** One screen of an explainer. `kind` picks how the body is drawn. */
export type Card =
  | {kind: 'title'; dur: number; text: string; sub?: string; img?: string}
  | {kind: 'bullets'; dur: number; text: string; items: string[]; img?: string}
  | {kind: 'stat'; dur: number; text: string; value: number; prefix?: string; suffix?: string; img?: string}
  | {kind: 'quote'; dur: number; text: string; by?: string; img?: string};

export type ExplainerProps = {cards: Card[]; theme?: string; audio?: string; tag?: string};

const backdropOf = (img?: string): Backdrop => (img ? {kind: 'image', src: img} : {kind: 'stone'});

const CardView: React.FC<{card: Card; idx: number; dur: number; tn?: string; tag?: string}> =
({card, idx, dur, tn, tag}) => {
  const theme = themeOf(tn);
  const {width, height} = useVideoConfig();
  const fade = useInOut(dur, 12);
  const face = faceOf(theme);
  return (
    <Stage theme={theme} backdrop={backdropOf(card.img)} idx={idx} dur={dur} embers>
      {tag && (
        <div style={{position: 'absolute', left: width * 0.045, top: height * 0.055, fontFamily: FONTS.sans,
          fontSize: width / 50, letterSpacing: 5, color: theme.accent2, opacity: 0.85}}>{tag}</div>
      )}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: `0 ${width * 0.08}px`,
        opacity: fade, textAlign: 'center'}}>

        {card.kind === 'title' && (
          <>
            <Heading text={card.text} theme={theme} size={width / (card.text.length > 24 ? 17 : 11)} />
            {card.sub && <div style={{marginTop: height * 0.03, fontFamily: FONTS.sans, fontSize: width / 42,
              letterSpacing: 6, color: theme.accent2, opacity: useIn(16, 12)}}>{card.sub}</div>}
          </>
        )}

        {card.kind === 'stat' && (
          <>
            <Counter to={card.value} theme={theme} size={width / 5} delay={6} len={Math.min(40, dur - 14)}
              prefix={card.prefix} suffix={card.suffix} />
            <div style={{marginTop: height * 0.02}}>
              <Heading text={card.text} theme={theme} size={width / 26} delay={10} />
            </div>
          </>
        )}

        {card.kind === 'bullets' && (
          <>
            <Heading text={card.text} theme={theme} size={width / 20} />
            <div style={{marginTop: height * 0.05, display: 'flex', flexDirection: 'column',
              gap: height * 0.028, alignItems: 'flex-start'}}>
              {card.items.map((it, i) => <Bullet key={i} text={it} delay={stagger(i, 8, 14)} theme={theme} face={face} />)}
            </div>
          </>
        )}

        {card.kind === 'quote' && (
          <>
            <div style={{fontFamily: FONTS.serif, fontSize: width / 15, color: theme.ink, lineHeight: 1.25,
              opacity: useIn(4, 16)}}>“{card.text}”</div>
            {card.by && <div style={{marginTop: height * 0.035, fontFamily: FONTS.sans, fontSize: width / 44,
              letterSpacing: 6, color: theme.accent2, opacity: useIn(20, 12)}}>— {card.by}</div>}
          </>
        )}
      </AbsoluteFill>
      {card.kind === 'title' && card.sub && <LowerThird title={card.text} sub={card.sub} theme={theme} delay={20} />}
    </Stage>
  );
};

const Bullet: React.FC<{text: string; delay: number; theme: ReturnType<typeof themeOf>; face: string}> =
({text, delay, theme, face}) => {
  const {width} = useVideoConfig();
  const p = usePop(delay, 16, 140);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: width * 0.018,
      opacity: p, transform: `translateX(${(1 - p) * -width * 0.06}px)`}}>
      <div style={{width: width / 90, height: width / 90, background: theme.accent, borderRadius: 2,
        transform: `rotate(45deg) scale(${p})`}} />
      <div style={{fontFamily: face, fontSize: width / 28, color: theme.ink, textAlign: 'left'}}>{text}</div>
    </div>
  );
};

export const Explainer: React.FC<ExplainerProps> = ({cards, theme, audio, tag}) => {
  const {fps} = useVideoConfig();
  let at = 0;
  return (
    <AbsoluteFill style={{background: themeOf(theme).bg}}>
      {audio && <Audio src={staticFile(audio)} />}
      {cards.map((c, i) => {
        const from = at;
        const len = Math.round(c.dur * fps);
        at += len;
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <CardView card={c} idx={i} dur={len} tn={theme} tag={tag} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const explainerDuration = (cards: Card[], fps: number) =>
  Math.max(1, cards.reduce((n, c) => n + Math.round(c.dur * fps), 0));
