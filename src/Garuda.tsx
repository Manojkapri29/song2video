import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence} from 'remotion';
import {loadFont as loadRozha} from '@remotion/google-fonts/RozhaOne';
import {loadFont as loadTeko} from '@remotion/google-fonts/Teko';

const rozha = loadRozha('normal', {weights: ['400'], subsets: ['devanagari', 'latin']}).fontFamily;
const teko = loadTeko('normal', {weights: ['500'], subsets: ['devanagari', 'latin']}).fontFamily;

export type GScene = {from: number; frames: number; text: string; img: string};
export type GProps = {title: string; tag: string; scenes: GScene[]; audio: string};

const Scene: React.FC<{s: GScene; index: number}> = ({s, index}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const zoom = interpolate(f, [0, s.frames], [1.0, 1.14], {extrapolateRight: 'clamp'});
  const panX = interpolate(f, [0, s.frames], index % 2 ? [-18, 18] : [18, -18]);
  const fadeIn = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(f, [s.frames - 12, s.frames], [1, 0], {extrapolateLeft: 'clamp'});
  const words = s.text.split(' ');
  return (
    <AbsoluteFill style={{background: '#000', opacity: fadeIn * fadeOut}}>
      <AbsoluteFill style={{transform: `scale(${zoom}) translateX(${panX}px)`}}>
        <Img src={staticFile(s.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', padding: '0 70px 300px', textAlign: 'center'}}>
        <div style={{fontFamily: rozha, fontSize: 84, lineHeight: 1.25, color: '#fff3c4',
          textShadow: '0 4px 30px rgba(255,190,80,0.55), 0 2px 6px rgba(0,0,0,0.9)'}}>
          {words.map((w, i) => {
            const e = spring({frame: f - 6 - i * 4, fps, config: {damping: 14, stiffness: 140}});
            return (
              <span key={i} style={{display: 'inline-block', marginRight: 18, opacity: e,
                transform: `translateY(${(1 - e) * 40}px)`, filter: `blur(${(1 - e) * 8}px)`}}>{w}</span>
            );
          })}
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 60, right: 60, top: 60, height: 2,
        background: 'linear-gradient(90deg, transparent, #ffd36b, transparent)',
        transform: `scaleX(${interpolate(f, [0, durationInFrames], [0, 1], {extrapolateRight: 'clamp'})})`}} />
    </AbsoluteFill>
  );
};

export const Garuda: React.FC<GProps> = ({title, tag, scenes, audio}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const titleOp = interpolate(f, [0, 20, 90, 120], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  const titleY = spring({frame: f, fps, config: {damping: 16}});
  return (
    <AbsoluteFill style={{background: '#050308'}}>
      {scenes.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.frames}>
          <Scene s={s} index={i} />
        </Sequence>
      ))}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: titleOp, pointerEvents: 'none'}}>
        <div style={{fontFamily: teko, fontSize: 40, letterSpacing: 10, color: '#ffd36b', transform: `translateY(${(1 - titleY) * 30}px)`}}>{tag}</div>
        <div style={{fontFamily: rozha, fontSize: 110, color: '#fff3c4', marginTop: 10,
          textShadow: '0 6px 40px rgba(255,170,60,0.6)'}}>{title}</div>
      </AbsoluteFill>
      <Audio src={staticFile(audio)} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
