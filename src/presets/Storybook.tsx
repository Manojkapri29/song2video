import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS} from '../kit/Type';
import {Birds, Buransh, Figure, House, PALETTES, Palette, Pine, PrayerFlags, Rain, SnowCaps, Stars, Terraces, ridge}
  from '../kit/Scenery';

/**
 * 2D storybook for a song: twelve illustrated pages that turn on the beat.
 *
 * The art is vector, not generated stills — on a 16GB Mac a diffusion pass for a dozen panels
 * costs an hour and may not finish at all, while this renders in minutes and never varies.
 * Page boundaries come from tools/audiomap.py snapped to real beats, so every turn lands on
 * the music instead of on a timer.
 */

export type Page = {scene: string; start: number; end: number; art?: string};
export type StorybookProps = {
  audio: string;
  title: string;
  sub?: string;
  pages: Page[];
  handle?: string;
};

const PAPER = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>" +
  "<filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(%23p)'/></svg>\")";

const TURN = 0.85;          // seconds of page turn between two pages
const SCENE_PALETTE: Record<string, keyof typeof PALETTES> = {
  dawn: 'dawn', village: 'morning', terrace: 'midday', buransh: 'bloom', flute: 'golden',
  glance: 'midday', pines: 'morning', lamps: 'dusk', river: 'midday', monsoon: 'storm',
  stars: 'night', sunrise: 'dawn',
};

/** Sky wash plus whatever hangs in it. */
const Sky: React.FC<{p: Palette; scene: string; t: number}> = ({p, scene, t}) => (
  <>
    <defs>
      <linearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={p.sky[0]} />
        <stop offset="100%" stopColor={p.sky[1]} />
      </linearGradient>
      <radialGradient id={`glow-${scene}`}>
        <stop offset="0%" stopColor={p.warm} stopOpacity="0.85" />
        <stop offset="100%" stopColor={p.warm} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={-60} y={-60} width={2040} height={1200} fill={`url(#sky-${scene})`} />
    {scene === 'stars' && <Stars seed={7} fill={p.snow} />}
    {scene === 'stars' && <circle cx={1480} cy={190} r={52} fill={p.snow} opacity={0.95} />}
    {(scene === 'dawn' || scene === 'sunrise') && (
      <>
        <circle cx={620} cy={430} r={330} fill={`url(#glow-${scene})`} />
        <circle cx={620} cy={430} r={66} fill={p.warm} opacity={0.95} />
      </>
    )}
    {scene === 'lamps' && <circle cx={1420} cy={330} r={300} fill={`url(#glow-${scene})`} />}
    {scene === 'monsoon' && (
      <g fill={p.haze} opacity={0.55}>
        {[[380, 230, 1], [980, 170, 1.3], [1540, 250, 0.9]].map(([cx, cy, s], i) => (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`}>
            <ellipse cx={-110} cy={20} rx={130} ry={56} />
            <ellipse cx={30} cy={-16} rx={160} ry={76} />
            <ellipse cx={160} cy={24} rx={120} ry={52} />
          </g>
        ))}
      </g>
    )}
    {(scene === 'village' || scene === 'pines' || scene === 'terrace') && <Birds seed={scene.length * 13} fill={p.ink} />}
    <rect x={-60} y={540} width={2040} height={300} fill={p.haze} opacity={0.3 + 0.25 * t} />
  </>
);

/** Everything that sits on the ground, per scene. */
const Foreground: React.FC<{p: Palette; scene: string; t: number}> = ({p, scene, t}) => {
  switch (scene) {
    case 'dawn':
      return <g>{[[180, 1010, 1.1], [1700, 1030, 1.25]].map(([x, y, s], i) =>
        <Pine key={i} x={x} y={y} s={s} fill={p.ink} />)}</g>;
    case 'village':
      return (
        <g>
          <Terraces y={790} rows={3} fill={p.near} edge={p.ink} />
          <House x={520} y={880} s={1.05} wall={p.snow} roof={p.ink} />
          <House x={760} y={930} s={1.25} wall={p.snow} roof={p.ink} />
          <House x={1180} y={900} s={1.15} wall={p.snow} roof={p.ink} />
          <Pine x={1480} y={960} s={1.15} fill={p.ink} />
          <Pine x={1600} y={1010} s={1.4} fill={p.ink} />
          <Pine x={320} y={990} s={1.2} fill={p.ink} />
        </g>
      );
    case 'terrace':
      return (
        <g>
          <Terraces y={700} rows={6} fill={p.near} edge={p.ink} />
          <Figure x={1180} y={840} s={1.15} fill={p.ink} pose="pot" />
          <Pine x={240} y={1020} s={1.3} fill={p.ink} />
        </g>
      );
    case 'buransh':
      return (
        <g>
          <Terraces y={840} rows={3} fill={p.near} edge={p.ink} />
          {[[150, 980, 1.5], [430, 1040, 1.9], [1520, 1000, 1.6], [1810, 1060, 2.1], [980, 1080, 1.7]].map(
            ([x, y, s], i) => <Buransh key={i} x={x} y={y} s={s} warm={p.warm} leaf={p.ink} />)}
        </g>
      );
    case 'flute':
      return (
        <g>
          <Terraces y={830} rows={3} fill={p.near} edge={p.ink} />
          <Figure x={700} y={880} s={1.35} fill={p.ink} pose="flute" />
          {[[980, 905, 1], [1070, 925, 1.1], [1160, 900, 0.9]].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill={p.snow}>
              <ellipse cx={0} cy={0} rx={30} ry={19} />
              <circle cx={26} cy={-9} r={11} fill={p.ink} />
            </g>
          ))}
          <Pine x={1640} y={1000} s={1.35} fill={p.ink} />
        </g>
      );
    case 'glance':
      return (
        <g>
          <Terraces y={720} rows={5} fill={p.near} edge={p.ink} />
          <Figure x={520} y={800} s={1.1} fill={p.ink} pose="flute" />
          <Figure x={1420} y={890} s={1.1} fill={p.ink} pose="pot" />
          <g opacity={0.5 + 0.5 * Math.sin(t * Math.PI)}>
            <path d="M 640 760 Q 960 690 1320 846" stroke={p.warm} strokeWidth={4} fill="none" strokeDasharray="14 18" />
          </g>
        </g>
      );
    case 'pines':
      return (
        <g>
          <path d="M -60 1140 L -60 940 Q 600 880 960 950 Q 1400 1030 1980 950 L 1980 1140 Z" fill={p.near} />
          {[[120, 1000, 1.5], [330, 1050, 1.8], [560, 990, 1.35], [1390, 1000, 1.45], [1640, 1060, 1.9],
            [1860, 1010, 1.5]].map(([x, y, s], i) => <Pine key={i} x={x} y={y} s={s} fill={p.ink} />)}
          <Figure x={850} y={1000} s={0.95} fill={p.ink} />
          <Figure x={1070} y={1012} s={0.95} fill={p.ink} pose="pot" />
        </g>
      );
    case 'lamps':
      return (
        <g>
          <Terraces y={800} rows={3} fill={p.near} edge={p.ink} />
          <House x={430} y={900} s={1.1} wall={p.near} roof={p.ink} glow={p.warm} />
          <House x={760} y={950} s={1.3} wall={p.near} roof={p.ink} glow={p.warm} />
          <House x={1200} y={915} s={1.2} wall={p.near} roof={p.ink} glow={p.warm} />
          <House x={1520} y={975} s={1.35} wall={p.near} roof={p.ink} glow={p.warm} />
          <Pine x={200} y={1030} s={1.5} fill={p.ink} />
        </g>
      );
    case 'river':
      return (
        <g>
          <path d="M -60 1140 L -60 900 Q 480 860 820 980 L 820 1140 Z" fill={p.near} />
          <path d="M 1980 1140 L 1980 880 Q 1460 850 1120 980 L 1120 1140 Z" fill={p.near} />
          <g fill={p.haze} opacity={0.8}>
            <rect x={820} y={960} width={300} height={180} />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M 840 ${1000 + i * 34} q 50 ${-12 + i * 3} 100 0 q 50 12 100 0`}
                stroke={p.snow} strokeWidth={3} fill="none" opacity={0.5} />
            ))}
          </g>
          <rect x={790} y={918} width={360} height={16} rx={6} fill={p.ink} />
          <rect x={800} y={880} width={10} height={44} fill={p.ink} />
          <rect x={1130} y={880} width={10} height={44} fill={p.ink} />
          <PrayerFlags x={700} y={820} w={620} sag={110} />
          <Pine x={240} y={990} s={1.4} fill={p.ink} />
          <Pine x={1700} y={1000} s={1.45} fill={p.ink} />
        </g>
      );
    case 'monsoon':
      return (
        <g>
          <Rain phase={t} fill={p.snow} />
          <Terraces y={830} rows={3} fill={p.near} edge={p.ink} />
          <House x={660} y={930} s={1.25} wall={p.near} roof={p.ink} glow={p.warm} />
          <House x={1180} y={960} s={1.3} wall={p.near} roof={p.ink} glow={p.warm} />
          <Pine x={260} y={1010} s={1.4} fill={p.ink} />
          <Pine x={1680} y={1030} s={1.5} fill={p.ink} />
        </g>
      );
    case 'stars':
      return (
        <g>
          <path d="M -60 1140 L -60 920 Q 540 840 960 930 Q 1420 1020 1980 920 L 1980 1140 Z" fill={p.near} />
          <circle cx={700} cy={915} r={9} fill={p.warm} opacity={0.9} />
          <circle cx={1180} cy={930} r={9} fill={p.warm} opacity={0.9} />
          <Figure x={700} y={960} s={0.85} fill={p.ink} />
          <Figure x={1180} y={975} s={0.85} fill={p.ink} pose="pot" />
          <Pine x={180} y={1020} s={1.4} fill={p.ink} />
          <Pine x={1790} y={1040} s={1.5} fill={p.ink} />
        </g>
      );
    case 'sunrise':
      return (
        <g>
          <path d="M -60 1140 L -60 950 Q 620 870 1040 960 Q 1480 1040 1980 960 L 1980 1140 Z" fill={p.near} />
          <Figure x={880} y={1000} s={1.05} fill={p.ink} />
          <Figure x={1010} y={1004} s={1.05} fill={p.ink} pose="pot" />
          {[[220, 1040, 1.6], [1700, 1060, 1.8]].map(([x, y, s], i) =>
            <Buransh key={i} x={x} y={y} s={s} warm={p.warm} leaf={p.ink} />)}
        </g>
      );
    default:
      return null;
  }
};

/** A painted panel, drifting slowly so the page is never frozen. */
const Painted: React.FC<{src: string; dur: number; i: number}> = ({src, dur, i}) => {
  const frame = useCurrentFrame();
  const t = Math.min(1, frame / Math.max(1, dur));
  // alternate push-in and pull-out so twelve pages in a row do not feel like one long zoom
  const zoom = i % 2 === 0 ? 1.04 + 0.08 * t : 1.12 - 0.08 * t;
  const pan = (i % 3 - 1) * 1.6 * t;
  return (
    <AbsoluteFill>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${zoom}) translateX(${pan}%)`, transformOrigin: '50% 55%'}} />
    </AbsoluteFill>
  );
};

/** One illustrated page: three ridge layers plus foreground, each drifting at its own rate. */
const Scene: React.FC<{scene: string; dur: number}> = ({scene, dur}) => {
  const frame = useCurrentFrame();
  const t = Math.min(1, frame / Math.max(1, dur));
  const p = PALETTES[SCENE_PALETTE[scene] ?? 'morning'];
  const drift = (k: number) => `translate(${(-14 * k * t).toFixed(2)} ${(-5 * k * t).toFixed(2)})`;
  const zoom = 1.03 + 0.06 * t;
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
        style={{transform: `scale(${zoom})`, transformOrigin: '50% 60%'}}>
        <Sky p={p} scene={scene} t={t} />
        <g transform={drift(0.4)}>
          <path d={ridge(scene.length * 3 + 1, 700, 360, 4)} fill={p.far} opacity={0.72} />
          <SnowCaps seed={scene.length * 3 + 1} baseY={700} height={360} peaks={4} fill={p.snow} />
        </g>
        <g transform={drift(1)}>
          <path d={ridge(scene.length * 7 + 2, 845, 300, 6)} fill={p.mid} opacity={0.94}
            stroke={p.ink} strokeWidth={3} strokeOpacity={0.3} />
          {scene !== 'stars' && scene !== 'monsoon' && (
            <SnowCaps seed={scene.length * 7 + 2} baseY={845} height={300} peaks={6} fill={p.snow} />
          )}
        </g>
        <g transform={drift(1.9)}>
          <path d={ridge(scene.length * 11 + 3, 985, 190, 5)} fill={p.near}
            stroke={p.ink} strokeWidth={4} strokeOpacity={0.45} />
        </g>
        <g transform={drift(3)}>
          <Foreground p={p} scene={scene} t={t} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** The paper fold that sweeps across while one page becomes the next. */
const Turn: React.FC<{dur: number; turn: number}> = ({dur, turn}) => {
  const frame = useCurrentFrame();
  if (frame < dur - turn) return null;
  const k = interpolate(frame, [dur - turn, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{
        background: 'linear-gradient(100deg, rgba(0,0,0,.22) 0%, rgba(255,250,240,.75) 42%, rgba(255,250,240,0) 60%)',
        transform: `translateX(${(k * 185 - 92).toFixed(1)}%)`, mixBlendMode: 'soft-light', opacity: 0.95,
      }} />
    </AbsoluteFill>
  );
};

export const Storybook: React.FC<StorybookProps> = ({audio, title, sub, pages, handle}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const frame = useCurrentFrame();
  const turn = Math.round(TURN * fps);
  const jitter = (Math.floor(frame / 2) % 7) * 41;
  return (
    <AbsoluteFill style={{background: '#efe3d2'}}>
      <Audio src={staticFile(audio)} />
      {pages.map((pg, i) => {
        const from = Math.round(pg.start * fps);
        const dur = Math.max(1, Math.round(pg.end * fps) - from) + (i < pages.length - 1 ? turn : 0);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} name={pg.scene}>
            <Fade dur={dur} turn={turn} first={i === 0} last={i === pages.length - 1}>
              {pg.art
                ? <Painted src={pg.art} dur={dur} i={i} />
                : <Scene scene={pg.scene} dur={dur} />}
              <Turn dur={dur} turn={turn} />
            </Fade>
          </Sequence>
        );
      })}

      {/* paper tooth over the whole book, a warm wash, and a soft edge: a printed page, not a screen */}
      <AbsoluteFill style={{backgroundImage: PAPER, backgroundPosition: `${jitter}px ${jitter * 0.7}px`,
        opacity: 0.26, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'rgba(242,222,190,.13)', mixBlendMode: 'multiply', pointerEvents: 'none'}} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 260px rgba(74,52,32,.5)', pointerEvents: 'none'}} />

      <Title title={title} sub={sub} fps={fps} />
      {handle && <Credit handle={handle} fps={fps} total={durationInFrames} />}
    </AbsoluteFill>
  );
};

const Fade: React.FC<{dur: number; turn: number; first: boolean; last: boolean; children: React.ReactNode}> =
({dur, turn, first, last, children}) => {
  const frame = useCurrentFrame();
  const inOp = first ? 1 : interpolate(frame, [0, turn], [0, 1], {extrapolateRight: 'clamp'});
  const outOp = last ? 1 : interpolate(frame, [dur - turn, dur], [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: Math.min(inOp, outOp)}}>{children}</AbsoluteFill>;
};

const Title: React.FC<{title: string; sub?: string; fps: number}> = ({title, sub, fps}) => {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [fps * 1, fps * 2.4, fps * 9, fps * 10.6], [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [fps * 1, fps * 2.4], [26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (show <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: show,
      transform: `translateY(${rise}px)`, pointerEvents: 'none'}}>
      <div style={{textAlign: 'center', padding: '44px 76px', borderRadius: 18,
        background: 'rgba(255,248,235,.82)', border: '3px solid rgba(120,84,40,.45)',
        boxShadow: '0 22px 60px rgba(60,38,18,.35)'}}>
        <div style={{fontFamily: FONTS.display, fontSize: 104, color: '#3a2219', lineHeight: 1.1}}>{title}</div>
        {sub && <div style={{fontFamily: FONTS.serif, fontSize: 40, color: '#8a5a3a', marginTop: 12}}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

const Credit: React.FC<{handle: string; fps: number; total: number}> = ({handle, fps, total}) => {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [total - fps * 7, total - fps * 5.6, total - fps * 1.2, total],
    [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (show <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 90,
      opacity: show, pointerEvents: 'none'}}>
      <div style={{fontFamily: FONTS.serif, fontSize: 38, color: '#fff3e2',
        textShadow: '0 3px 18px rgba(0,0,0,.6)'}}>{handle}</div>
    </AbsoluteFill>
  );
};
