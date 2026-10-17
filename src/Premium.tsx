import {AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadRozha} from '@remotion/google-fonts/RozhaOne';
import {loadFont as loadTeko} from '@remotion/google-fonts/Teko';

const rozha = loadRozha('normal', {weights: ['400'], subsets: ['devanagari', 'latin']}).fontFamily;
const teko = loadTeko('normal', {weights: ['500'], subsets: ['devanagari', 'latin']}).fontFamily;

export type PWord = {w: string; start: number; end: number};
export type PLine = {start: number; end: number; text: string; words?: PWord[]};
export type PProps = {lines: PLine[]; title: string; tag?: string; audio?: string};

// theme per scene: dark scenes get gold type, ivory scene gets deep-maroon type
const THEMES = [
  {bg: ['#ff9d42', '#8a1c0e', '#2a0505'], face: ['#fff3c4', '#ffd36b', '#c98a1b', '#ffe9a8'], side: [58, 28, 0], dark: true},
  {bg: ['#3b2a8f', '#150d3d', '#05030f'], face: ['#fffbe0', '#ffe38a', '#d09a24', '#fff0b8'], side: [70, 46, 6], dark: true},
  {bg: ['#fbf4e6', '#e9d9bb', '#b99a68'], face: ['#7a1410', '#c0271c', '#5c0b08', '#a31f16'], side: [40, 8, 6], dark: false},
  {bg: ['#2b2b33', '#121217', '#050507'], face: ['#ffffff', '#f3d58a', '#b9822b', '#ffe9b0'], side: [70, 52, 20], dark: true},
];
const DEPTH = 18;

const Word: React.FC<{text: string; size: number; theme: typeof THEMES[number]; local: number; exit: number; i: number}> = ({text, size, theme, local, exit, i}) => {
  const {fps} = useVideoConfig();
  const enter = spring({frame: local, fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
  const z = (1 - enter) * -1100 + exit * 700;
  const rx = (1 - enter) * 55;
  const ry = (1 - enter) * (i % 2 ? -30 : 30);
  const op = Math.min(1, enter * 1.6) * (1 - exit);
  const sweep = ((local * 7) % 260) - 60; // % position for light sweep
  const [a, b, c, d] = theme.face;
  const faceBg = `linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.95) 50%, transparent 58%) ${sweep}% 0 / 260% 100% no-repeat, linear-gradient(180deg, ${a} 0%, ${b} 38%, ${c} 62%, ${d} 100%)`;
  const layers = Array.from({length: DEPTH}, (_, k) => {
    const t = k / (DEPTH - 1);
    const [r, g, bl] = theme.side;
    return <span key={k} style={{position: 'absolute', left: 0, top: 0, transform: `translateZ(${-(k + 1) * 3.2}px)`,
      color: `rgb(${Math.round(r * (1 - t * 0.7))}%, ${Math.round(g * (1 - t * 0.7))}%, ${Math.round(bl * (1 - t * 0.7))}%)`.replace(/(\d+)%/g, (_m, p) => `${Math.round(Number(p) * 2.55)}`)}}>{text}</span>;
  });
  return (
    <span style={{position: 'relative', display: 'inline-block', margin: '0 44px', fontFamily: rozha, fontSize: size, lineHeight: 1.12,
      transformStyle: 'preserve-3d', opacity: op, transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
      <span style={{visibility: 'hidden'}}>{text}</span>
      {layers}
      <span style={{position: 'absolute', left: 0, top: 0, background: faceBg, WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent', color: 'transparent', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.35))'}}>{text}</span>
    </span>
  );
};

const Petals: React.FC<{n: number; dark: boolean}> = ({n, dark}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const depth = random(`d${i}`);              // 0 far .. 1 near
        const size = 10 + depth * 46;
        const speed = 0.8 + depth * 3.2;
        const x0 = random(`x${i}`) * 2100 - 100;
        const y = ((random(`y${i}`) * 1300 + f * speed) % 1300) - 110;
        const x = x0 + Math.sin(f * 0.03 + i) * (30 + depth * 60);
        const hue = dark ? (i % 3 === 0 ? '#ffb347' : i % 3 === 1 ? '#ff7a18' : '#ffd36b') : (i % 2 ? '#e0701c' : '#c0271c');
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size * 0.62, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          background: `radial-gradient(ellipse at 35% 30%, #fff6 0%, ${hue} 55%, ${hue}99 100%)`, opacity: 0.25 + depth * 0.55,
          transform: `rotate(${f * (1 + depth * 2) + i * 40}deg) rotateX(${f * 3 + i * 20}deg)`, boxShadow: depth > 0.8 ? '0 0 22px #ffb34766' : undefined}} />;
      })}
    </AbsoluteFill>
  );
};

const Bokeh: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {Array.from({length: 9}).map((_, i) => {
        const s = 120 + random(`bs${i}`) * 260;
        const x = random(`bx${i}`) * 1920 + Math.sin(f * 0.008 + i) * 80;
        const y = random(`by${i}`) * 1080 + Math.cos(f * 0.006 + i) * 60;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,214,140,0.22) 0%, rgba(255,214,140,0.10) 55%, transparent 70%)'}} />;
      })}
    </AbsoluteFill>
  );
};

const Scene: React.FC<{line: PLine; idx: number; dur: number; title: string; tag: string}> = ({line, idx, dur, title, tag}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const th = THEMES[idx % THEMES.length];
  const words: PWord[] = line.words?.length ? line.words : (() => {
    const p = line.text.split(/\s+/).filter(Boolean); const d = (line.end - line.start) / p.length;
    return p.map((w, i) => ({w, start: line.start + i * d, end: line.start + (i + 1) * d}));
  })();
  const size = words.length > 5 ? 150 : words.length > 3 ? 175 : 210;
  const exit = interpolate(f, [dur - 10, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cam = `rotateY(${Math.sin(f * 0.018 + idx) * 9}deg) rotateX(${Math.cos(f * 0.014 + idx) * 4 + 4}deg) scale(${1.02 + f * 0.0006})`;
  const flash = interpolate(f, [0, 5], [0.55, 0], {extrapolateRight: 'clamp'});
  const drift = Math.sin(f * 0.01 + idx) * 140;
  const bar = spring({frame: f, fps, config: {damping: 20, stiffness: 80}});
  const ink = th.dark ? '#ffe9b0' : '#5c0b08';
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at ${50 + drift / 40}% 45%, ${th.bg[0]} 0%, ${th.bg[1]} 55%, ${th.bg[2]} 100%)`, overflow: 'hidden'}}>
      <Bokeh />
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: th.dark ? 0.5 : 0.25}}>
        <defs><linearGradient id={`rg${idx}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
        {Array.from({length: 7}).map((_, i) => {
          const a = (i / 7) * Math.PI * 2 + f * 0.0035;
          const w = 0.07;
          const p = (ang: number) => `${960 + Math.cos(ang) * 2600},${360 + Math.sin(ang) * 2600}`;
          return <polygon key={i} points={`960,360 ${p(a - w)} ${p(a + w)}`} fill={`url(#rg${idx})`} transform={`rotate(${(i * 360) / 7} 960 360)`} opacity={0.5} />;
        })}
      </svg>
      <Petals n={46} dark={th.dark} />
      <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 45%', justifyContent: 'center', alignItems: 'center', padding: '0 90px'}}>
        <div style={{transformStyle: 'preserve-3d', transform: cam, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', rowGap: 14, maxWidth: 1560}}>
          {words.map((w, i) => {
            const wf = Math.max(0, Math.round((Math.max(w.start, line.start) - line.start) * fps));
            if (f < wf) return <span key={i} style={{opacity: 0, margin: '0 44px', fontFamily: rozha, fontSize: size}}>{w.w}</span>;
            return <Word key={i} text={w.w} size={size} theme={th} local={f - wf} exit={exit} i={i} />;
          })}
        </div>
      </AbsoluteFill>
      {/* floor shadow */}
      <div style={{position: 'absolute', left: '50%', top: 820, width: 1100, height: 70, marginLeft: -550, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, transparent 70%)', opacity: 1 - exit}} />
      {/* cinematic bars + titles */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 74, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, background: '#000'}} />
      <div style={{position: 'absolute', left: 70, bottom: 22, fontFamily: teko, fontSize: 30, letterSpacing: 6, color: '#ffd36b'}}>{tag}</div>
      <div style={{position: 'absolute', right: 70, bottom: 22, fontFamily: teko, fontSize: 30, letterSpacing: 4, color: '#ffd36b'}}>{title}</div>
      <div style={{position: 'absolute', left: 70, right: 70, bottom: 70, height: 2, background: `linear-gradient(90deg, #ffd36b, transparent)`, transformOrigin: 'left', transform: `scaleX(${bar})`}} />
      <div style={{position: 'absolute', inset: 74, boxShadow: `inset 0 0 220px rgba(0,0,0,${th.dark ? 0.6 : 0.3})`, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: ink, opacity: 0, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const svg = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.9'/></svg>");
  return <AbsoluteFill style={{backgroundImage: `url("data:image/svg+xml,${svg}")`, backgroundPosition: `${(f * 37) % 300}px ${(f * 91) % 300}px`, opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}} />;
};

export const Premium: React.FC<PProps> = ({lines, title, tag = 'BHAJAN', audio = 'bhajan_remix.mp3'}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const f = useCurrentFrame();
  const first = lines[0]?.start ?? 0;
  const intro: PLine = {start: 0, end: first, text: title, words: [{w: title, start: 0.3, end: first}]};
  const all = [intro, ...lines];
  const fade = interpolate(f, [durationInFrames - 36, durationInFrames - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile(audio)} />
      {all.map((l, i) => {
        const from = i === 0 ? 0 : Math.round(l.start * fps);
        const next = all[i + 1] ? Math.round(all[i + 1].start * fps) : durationInFrames;
        if (next <= from) return null;
        return <Sequence key={i} from={from} durationInFrames={next - from}><Scene line={l} idx={i} dur={next - from} title={title} tag={tag} /></Sequence>;
      })}
      <Grain />
      <AbsoluteFill style={{background: '#000', opacity: fade, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
