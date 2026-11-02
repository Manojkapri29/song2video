import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {themeOf} from '../kit/theme';
import {Stage, Backdrop} from '../kit/Stage';
import {Heading, Counter, FONTS, faceOf, LowerThird} from '../kit/Type';
import {useIn, useInOut, usePop, stagger} from '../kit/anim';
import {Cinema} from '../kit/Cinema';

/** One screen of an explainer. `kind` picks how the body is drawn. */
export type Card =
  | {kind: 'title'; dur: number; text: string; sub?: string; img?: string}
  | {kind: 'bullets'; dur: number; text: string; items: string[]; img?: string}
  | {kind: 'stat'; dur: number; text: string; value: number; prefix?: string; suffix?: string; img?: string}
  | {kind: 'quote'; dur: number; text: string; by?: string; img?: string}
  | {kind: 'map'; dur: number; text: string; sub?: string; img: string};

export type ExplainerProps = {cards: Card[]; theme?: string; audio?: string; tag?: string};

const backdropOf = (img?: string): Backdrop => (img ? {kind: 'image', src: img} : {kind: 'stone'});

/** Full-frame satellite map: slow push-in toward the marker, title over the bottom edge. */
const MapView: React.FC<{card: Extract<Card, {kind: 'map'}>; dur: number; theme: ReturnType<typeof themeOf>; tag?: string}> =
({card, dur, theme, tag}) => {
  const {width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const fade = useInOut(dur, 12);
  const zoom = 1 + (frame / Math.max(1, dur)) * 0.12;
  return (
    <AbsoluteFill style={{background: '#000', opacity: fade}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '61.3% 62.5%'}}>
        <Img src={staticFile(card.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.8) 100%)'}} />
        {/* marker sits on the valley: 61.3% / 62.5% of the square mosaic, after the cover crop */}
        <div style={{position: 'absolute', left: width * 0.6127 - 50, top: width * 0.6253 - (width - height) / 2 - 50, width: 100, height: 100}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `6px solid ${theme.accent2}`,
            transform: `scale(${1 + 0.35 * Math.sin(frame / 6)})`, opacity: 0.95}} />
          <div style={{position: 'absolute', left: 33, top: 33, width: 34, height: 34, borderRadius: '50%',
            background: theme.accent2, boxShadow: `0 0 24px ${theme.accent2}`}} />
        </div>
      </AbsoluteFill>
      {tag && (
        <div style={{position: 'absolute', left: width * 0.045, top: height * 0.055, fontFamily: FONTS.sans,
          fontSize: width / 50, letterSpacing: 5, color: theme.accent2, opacity: 0.85}}>{tag}</div>
      )}
      <div style={{position: 'absolute', left: width * 0.06, top: height * 0.14}}>
        <Heading text={card.text} theme={theme} size={width / 16} />
        {card.sub && <div style={{marginTop: height * 0.02, fontFamily: FONTS.sans, fontSize: width / 44,
          letterSpacing: 4, color: theme.accent2, opacity: useIn(16, 12)}}>{card.sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

const CardView: React.FC<{card: Card; idx: number; dur: number; tn?: string; tag?: string}> =
({card, idx, dur, tn, tag}) => {
  const theme = themeOf(tn);
  const {width, height} = useVideoConfig();
  const fade = useInOut(dur, 12);
  const face = faceOf(theme);
  if (card.kind === 'map') return <MapView card={card} dur={dur} theme={theme} tag={tag} />;
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
            <Cinema dur={len}>
              <CardView card={c} idx={i} dur={len} tn={theme} tag={tag} />
            </Cinema>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const explainerDuration = (cards: Card[], fps: number) =>
  Math.max(1, cards.reduce((n, c) => n + Math.round(c.dur * fps), 0));
