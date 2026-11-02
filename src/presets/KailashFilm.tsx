import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Theme, themeOf} from '../kit/theme';
import {Stage} from '../kit/Stage';
import {Heading, FONTS, faceOf} from '../kit/Type';
import {useIn, useInOut, usePop, stagger} from '../kit/anim';
import {Moments, Moment} from '../kit/Moments';

/** Stills under public/img/kailash, cycled one per beat. Each is graded dark so type stays readable. */
const BG = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'];

/** One narration beat. Times are seconds from the start of the voice-over. */
type Beat = {
  start: number; end: number; kind: string;
  head?: string; sub?: string; text?: string; hl?: string[]; num?: string; small?: boolean;
  header?: string[]; rows?: string[][]; items?: string[]; wave?: boolean; img?: string;
  cards?: {title: string; text: string; hl?: string[]; img?: string}[];
  a?: {title: string; text: string}; b?: {title: string; text: string};
  value?: number; other?: number; then?: Partial<Beat>[];
  /** Keyword graphics timed to the words in this beat (see tools/kailash_moments.py). */
  moments?: Moment[];
};

/** A film = a tag plus its narration beats. Any narrated deck can be dropped in as one of these. */
export type FilmData = {tag: string; beats: Beat[]; theme?: string; grid?: boolean};

const FPS = 30;
const ThemeCtx = React.createContext<Theme>(themeOf('katha'));
const useTheme = () => React.useContext(ThemeCtx);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Highlighter stroke that wipes under a phrase, like a marker pen on the slide. */
const Hl: React.FC<{delay: number; children: React.ReactNode}> = ({delay, children}) => {
  const T = useTheme();
  const p = useIn(delay, 16);
  return (
    <span style={{backgroundImage: `linear-gradient(${T.accent}99, ${T.accent}99)`, backgroundRepeat: 'no-repeat',
      backgroundSize: `${p * 100}% 46%`, backgroundPosition: '0 78%', padding: '0 0.12em'}}>{children}</span>
  );
};

/** Sentence that fades up, with its key phrases marked in turn. */
const Marked: React.FC<{text: string; hl?: string[]; size: number; delay?: number; color?: string}> =
({text, hl = [], size, delay = 0, color}) => {
  const T = useTheme();
  const col = color ?? T.ink;
  const f = useIn(delay, 14);
  const parts = hl.length ? text.split(new RegExp(`(${hl.map(esc).join('|')})`)) : [text];
  return (
    <div style={{fontFamily: faceOf(T), fontSize: size, color: col, lineHeight: 1.45, opacity: f,
      transform: `translateY(${(1 - f) * size * 0.25}px)`, textShadow: '0 4px 18px rgba(0,0,0,.6)'}}>
      {parts.map((p, i) => (hl.includes(p)
        ? <Hl key={i} delay={delay + 12 + i * 4}>{p}</Hl>
        : <span key={i}>{p}</span>))}
    </div>
  );
};

/** Band of light that crosses the frame when a beat starts, so cuts feel designed, not stacked. */
const Sweep: React.FC = () => {
  const T = useTheme();
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 16], [-40, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = interpolate(f, [0, 3, 12, 16], [0, 0.9, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o}}>
      <div style={{position: 'absolute', top: '-10%', bottom: '-10%', left: `${x}%`, width: '28%',
        background: `linear-gradient(90deg, transparent, ${T.accent}66, ${T.accent2}, transparent)`,
        transform: 'skewX(-14deg)'}} />
    </AbsoluteFill>
  );
};

/** Mountain line-art that draws itself on, then glows. Pure SVG, no image. */
const Mountain: React.FC<{width: number}> = ({width}) => {
  const T = useTheme();
  const p = useIn(4, 60);
  const glow = 0.5 + 0.5 * Math.sin(useCurrentFrame() / 14);
  return (
    <svg width={width * 0.42} viewBox="0 0 800 400" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={T.accent2} stopOpacity={0.55 + glow * 0.2} />
          <stop offset="100%" stopColor={T.accent2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="610" cy="60" r="150" fill="url(#sun)" />
      <path pathLength={1} d="M0 400 L230 120 L310 210 L400 60 L520 230 L600 150 L800 400"
        fill="none" stroke={T.accent2} strokeWidth={4} strokeLinejoin="round"
        strokeDasharray={1} strokeDashoffset={1 - p} />
      <path pathLength={1} d="M380 96 L400 60 L424 102 L404 90 L386 104 Z" fill={T.accent2}
        opacity={p} />
      <path d="M0 400 L800 400" stroke={T.accent} strokeWidth={2} opacity={p * 0.7} />
    </svg>
  );
};

/** Sine bars for the 'sounds' beat. */
const Wave: React.FC<{width: number}> = ({width}) => {
  const T = useTheme();
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10, height: 90, marginBottom: 30}}>
      {Array.from({length: 40}, (_, i) => {
        const h = 14 + 70 * Math.abs(Math.sin(f / 9 + i * 0.5)) * (0.4 + 0.6 * Math.sin(i / 6) ** 2);
        return <div key={i} style={{width: width / 160, height: h, borderRadius: 4, background: i % 4 ? T.accent : T.accent2}} />;
      })}
    </div>
  );
};

const Chapter: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const x = useIn(0, 18);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: width * 0.03}}>
      <div style={{fontFamily: FONTS.sans, fontSize: height * 0.9, lineHeight: 1, color: 'transparent',
        WebkitTextStroke: `3px ${T.accent2}`, transform: `translateX(${(1 - x) * -width * 0.12}px)`,
        opacity: x, textShadow: `0 0 60px ${T.accent}55`}}>{b.num}</div>
      <div style={{maxWidth: width * 0.5}}>
        <Heading text={b.head ?? ''} theme={T} size={width / 22} delay={6} />
        <div style={{marginTop: height * 0.03, fontFamily: FONTS.sans, fontSize: width / 40, letterSpacing: 6,
          color: T.accent2, opacity: useIn(24, 14)}}>{b.sub}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Direction of the circuit as a glyph: clockwise and anticlockwise, read at a glance. */
const arrowOf = (_c: string) => '';

const Table: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const cols = '0.8fr 1.5fr 1fr';
  const row = (cells: string[], key: string, delay: number, head = false) => {
    const p = usePop(delay, 16, 150);
    return (
      <div key={key} style={{display: 'grid', gridTemplateColumns: cols, gap: width * 0.02,
        padding: `${height * 0.018}px ${width * 0.025}px`, borderBottom: `1px solid ${T.accent}55`,
        opacity: head ? useIn(0, 10) : p, transform: `translateX(${(1 - p) * width * 0.08}px)`,
        fontFamily: head ? FONTS.sans : faceOf(T), fontSize: head ? width / 52 : width / 42,
        color: head ? T.accent2 : T.ink, letterSpacing: head ? 4 : 0}}>
        {cells.map((c, i) => <span key={i}>{i === 2 && !head ? arrowOf(c) : ''}{c}</span>)}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: width * 0.66}}>
        <Heading text={b.head ?? ''} theme={T} size={width / 24} />
        <div style={{marginTop: height * 0.05, background: `${T.bg}cc`, border: `1px solid ${T.accent}66`,
          borderRadius: 12, overflow: 'hidden'}}>
          {row(b.header ?? [], 'h', 0, true)}
          {(b.rows ?? []).map((r, i) => row(r, `r${i}`, 14 + i * 16))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Flow: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const arrow = useIn(30, 20);
  const card = (c: {title: string; text: string} | undefined, delay: number) => {
    const p = usePop(delay, 16, 140);
    return (
      <div style={{flex: 1, padding: width * 0.025, borderRadius: 18, background: `${T.bg}d9`,
        border: `2px solid ${T.accent}`, boxShadow: `12px 12px 0 ${T.accent}55`,
        transform: `scale(${0.9 + 0.1 * p})`, opacity: p}}>
        <div style={{fontFamily: FONTS.sans, fontSize: width / 30, color: T.accent2, letterSpacing: 3}}>{c?.title}</div>
        <div style={{marginTop: height * 0.02, fontFamily: faceOf(T), fontSize: width / 40, color: T.ink, lineHeight: 1.5}}>{c?.text}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: width * 0.8}}>
        <Heading text={b.head ?? ''} theme={T} size={width / 22} />
        <div style={{marginTop: height * 0.06, display: 'flex', alignItems: 'center', gap: width * 0.03}}>
          {card(b.a, 10)}
          <div style={{width: width * 0.1 * arrow, height: 4, background: T.accent2, position: 'relative'}}>
            <div style={{position: 'absolute', right: -6, top: -8, width: 0, height: 0, opacity: arrow,
              borderLeft: `16px solid ${T.accent2}`, borderTop: '10px solid transparent', borderBottom: '10px solid transparent'}} />
          </div>
          {card(b.b, 40)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Bullets: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: width * 0.66}}>
        {b.wave && <Wave width={width} />}
        <Heading text={b.head ?? ''} theme={T} size={width / 22} />
        <div style={{marginTop: height * 0.06, display: 'flex', flexDirection: 'column', gap: height * 0.034}}>
          {(b.items ?? []).map((it, i) => {
            const f = useIn(stagger(i, 12, 16), 14);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: width * 0.018, opacity: f,
                transform: `translateX(${(1 - f) * -width * 0.04}px)`, fontFamily: faceOf(T), fontSize: width / 36, color: T.ink}}>
                <div style={{width: width / 60, height: width / 60, background: T.accent, transform: 'rotate(45deg)',
                  flexShrink: 0, boxShadow: `0 0 18px ${T.accent}`}} />
                {it}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Pair: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: width * 0.84}}>
        <Heading text={b.head ?? ''} theme={T} size={width / 24} />
        <div style={{marginTop: height * 0.06, display: 'flex', gap: width * 0.03}}>
          {(b.cards ?? []).map((c, i) => {
            const p = usePop(16 + i * 18, 16, 130);
            return (
              <div key={i} style={{flex: 1, padding: `${height * 0.05}px ${width * 0.03}px`, borderRadius: 22,
                background: `linear-gradient(160deg, ${T.bg}ee, ${T.bg}b3)`, border: `2px solid ${T.accent}88`,
                transform: `translateY(${(1 - p) * 80}px)`, opacity: p}}>
                {c.img && <Img src={staticFile(`img/kailash/${c.img}.png`)} style={{width: '100%', height: height * 0.2,
                  objectFit: 'cover', borderRadius: 14, marginBottom: height * 0.02, border: `1px solid ${T.accent}66`}} />}
                <div style={{fontFamily: FONTS.sans, fontSize: width / 28, color: T.accent2, letterSpacing: 3}}>{c.title}</div>
                <div style={{marginTop: height * 0.025}}>
                  <Marked text={c.text} hl={c.hl} size={width / 38} delay={28 + i * 18} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Question / sentence / quote / end: one centred line, marked, with a big mark behind it. */
const Line: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const ring = useIn(0, 20);
  const big = b.kind === 'end' ? '?' : b.kind === 'question' ? '?' : '';
  const quote = b.kind === 'quote';
  const size = b.small ? width / 30 : width / 22;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      {big && <div style={{position: 'absolute', fontFamily: FONTS.sans, fontSize: height * 1.1, color: 'transparent',
        WebkitTextStroke: `2px ${T.accent}44`, opacity: ring, transform: `rotate(${useIn(0, 60) * 8}deg)`}}>{big}</div>}
      <div style={{width: width * 0.76, textAlign: 'center', padding: quote ? `${height * 0.05}px ${width * 0.04}px` : 0,
        background: quote ? `${T.bg}e6` : 'transparent', borderRadius: 24,
        border: quote ? `2px solid ${T.accent}` : 'none',
        boxShadow: quote ? `14px 14px 0 ${T.accent}` : 'none'}}>
        <div style={{fontFamily: FONTS.sans, fontSize: width / 40, color: T.accent2, letterSpacing: 6,
          marginBottom: height * 0.03, opacity: useIn(0, 12)}}>{b.head}</div>
        <Marked text={b.text ?? ''} hl={b.hl} size={size} delay={10} color={quote ? T.ink : T.ink} />
      </div>
    </AbsoluteFill>
  );
};

const Stat: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const f = useIn(6, 40);
  const shown = Math.round((b.value ?? 0) * (1 - Math.pow(1 - f, 3)));
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{fontFamily: FONTS.sans, fontSize: width / 6, fontWeight: 700, lineHeight: 1,
        color: T.accent2, textShadow: `0 0 ${width / 14}px ${T.accent}88`, opacity: useIn(0, 10)}}>
        {shown.toLocaleString('en-IN')}
      </div>
      <div style={{marginTop: height * 0.02, opacity: useIn(30, 14)}}>
        <Heading text={b.head ?? ''} theme={T} size={width / 40} delay={30} />
      </div>
    </AbsoluteFill>
  );
};

/** Two circuits side by side; a dot runs each one in its own direction, so the spin is seen, not told. */
const Route: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const f = useCurrentFrame();
  const R = height * 0.2;
  const spin = [1, -1];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Heading text={b.head ?? ''} theme={T} size={width / 26} />
      <div style={{marginTop: height * 0.04, display: 'flex', gap: width * 0.12}}>
        {(b.cards ?? []).map((c, i) => {
          const a = (f / 60) * 2 * Math.PI * spin[i] - Math.PI / 2;
          const p = usePop(10 + i * 14, 16, 140);
          return (
            <div key={i} style={{textAlign: 'center', opacity: p, transform: `scale(${0.85 + 0.15 * p})`}}>
              <svg width={R * 2.6} height={R * 2.6} viewBox={`${-R * 1.3} ${-R * 1.3} ${R * 2.6} ${R * 2.6}`}>
                <circle r={R} fill="none" stroke={T.accent} strokeOpacity={0.4} strokeWidth={6} strokeDasharray="14 10" />
                <circle r={R * 0.3} fill={T.accent2} opacity={0.9} />
                <circle cx={Math.cos(a) * R} cy={Math.sin(a) * R} r={R * 0.1} fill={T.ink}
                  style={{filter: `drop-shadow(0 0 ${R * 0.12}px ${T.accent})`}} />
              </svg>
              <div style={{fontFamily: FONTS.sans, fontSize: width / 34, color: T.accent2, letterSpacing: 2}}>{c.title}</div>
              <div style={{fontFamily: faceOf(T), fontSize: width / 48, color: T.ink, marginTop: 6}}>{c.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Two heights drawn to the same scale: the number stops being an abstract figure. */
const Compare: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const H = height * 0.5;
  const max = Math.max(b.value ?? 1, b.other ?? 1);
  const bars = [b.value ?? 0, b.other ?? 0];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Heading text={b.head ?? ''} theme={T} size={width / 26} />
      <div style={{marginTop: height * 0.05, display: 'flex', alignItems: 'flex-end', gap: width * 0.1, height: H + height * 0.12}}>
        {bars.map((v, i) => {
          const g = useIn(12 + i * 18, 40);
          const h = (v / max) * H * (1 - Math.pow(1 - g, 3));
          return (
            <div key={i} style={{textAlign: 'center', width: width * 0.14}}>
              <div style={{fontFamily: FONTS.sans, fontSize: width / 30, color: T.accent2, opacity: g}}>{Math.round(v).toLocaleString('en-IN')} m</div>
              <div style={{height: h, marginTop: 8, borderRadius: '14px 14px 0 0',
                background: i ? `linear-gradient(${T.accent2}, ${T.accent}55)` : `linear-gradient(${T.accent}, ${T.accent}44)`,
                boxShadow: `0 0 40px ${T.accent}55`}} />
              <div style={{marginTop: 12, fontFamily: faceOf(T), fontSize: width / 48, color: T.ink}}>{b.items?.[i]}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Poll-style card: a cursor taps one option, the choice lights up, and the viewer is asked to answer in comments. */
const Poll: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const f = useCurrentFrame();
  const tap = 50;
  const press = interpolate(f, [tap, tap + 6, tap + 14], [1, 0.94, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cx = interpolate(f, [20, tap], [width * 0.7, width * 0.3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cy = interpolate(f, [20, tap], [height * 0.7, height * 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chosen = f >= tap;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Heading text={b.head ?? ''} theme={T} size={width / 26} />
      <div style={{marginTop: height * 0.05, display: 'flex', gap: width * 0.03, position: 'relative'}}>
        {(b.items ?? []).map((it, i) => {
          const on = chosen && i === 0;
          return (
            <div key={i} style={{width: width * 0.3, padding: `${height * 0.03}px ${width * 0.02}px`, borderRadius: 16,
              textAlign: 'center', fontFamily: faceOf(T), fontSize: width / 40, color: on ? T.bg : T.ink,
              background: on ? T.accent2 : `${T.bg}cc`, border: `2px solid ${T.accent}`,
              transform: `scale(${on ? press : 1})`}}>{it}</div>
          );
        })}
      </div>
      <div style={{marginTop: height * 0.05, fontFamily: FONTS.sans, fontSize: width / 42, letterSpacing: 4,
        color: T.accent2, opacity: useIn(tap + 10, 12)}}>कमेंट में अपना जवाब बताइए</div>
      <div style={{position: 'absolute', left: cx, top: cy, width: 0, height: 0, opacity: chosen ? 0 : 1,
        borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderBottom: `26px solid ${T.ink}`,
        transform: 'rotate(-30deg)'}} />
    </AbsoluteFill>
  );
};

/** Years on a line that draws itself left to right; each marker pops in with its label. Items read "year|text". */
const Timeline: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  const items = (b.items ?? []).map((it) => {
    const [year, ...rest] = it.split('|');
    return {year, text: rest.join('|')};
  });
  const draw = useIn(8, 40);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Heading text={b.head ?? ''} theme={T} size={width / 26} />
      <div style={{position: 'relative', marginTop: height * 0.09, width: width * 0.8, height: height * 0.36}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.107, height: 4,
          background: `${T.accent}55`}} />
        <div style={{position: 'absolute', left: 0, top: height * 0.107, height: 4, width: `${draw * 100}%`,
          background: `linear-gradient(90deg, ${T.accent}, ${T.accent2})`, boxShadow: `0 0 18px ${T.accent}`}} />
        {items.map((it, i) => {
          const x = items.length === 1 ? 0.5 : 0.07 + (0.86 * i) / (items.length - 1);
          const p = usePop(14 + i * 14, 14, 160);
          return (
            <div key={i} style={{position: 'absolute', left: `${x * 100}%`, top: 0, transform: 'translateX(-50%)',
              width: width * 0.22, textAlign: 'center', opacity: p}}>
              <div style={{fontFamily: FONTS.sans, fontSize: width / 28, color: T.accent2, letterSpacing: 2,
                transform: `scale(${0.8 + 0.2 * p})`}}>{it.year}</div>
              <div style={{margin: `${height * 0.035}px auto 0`, width: width / 46, height: width / 46,
                borderRadius: '50%', background: T.accent, boxShadow: `0 0 26px ${T.accent}`}} />
              <div style={{marginTop: height * 0.04, fontFamily: faceOf(T), fontSize: width / 52, color: T.ink,
                lineHeight: 1.35}}>{it.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Chooses the layout for one beat. `then` sub-scenes are expanded before this runs. */
const BeatView: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  switch (b.kind) {
    case 'title': return <Title b={b} />;
    case 'chapter': return <Chapter b={b} />;
    case 'table': return <Table b={b} />;
    case 'flow': return <Flow b={b} />;
    case 'bullets': return <Bullets b={b} />;
    case 'pair': return <Pair b={b} />;
    case 'stat': return <Stat b={b} />;
    case 'route': return <Route b={b} />;
    case 'compare': return <Compare b={b} />;
    case 'poll': return <Poll b={b} />;
    case 'timeline': return <Timeline b={b} />;
    default: return <Line b={b} />;
  }
};

const Title: React.FC<{b: Beat}> = ({b}) => {
  const T = useTheme();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <Mountain width={width} />
      <div style={{marginTop: height * 0.02}}>
        <Heading text={b.head ?? ''} theme={T} size={(b.head ?? '').length > 14 ? width / 13 : width / 9} delay={22} />
      </div>
      <div style={{marginTop: height * 0.02, fontFamily: FONTS.sans, fontSize: width / 40, letterSpacing: 10,
        color: T.accent2, opacity: useIn(44, 16)}}>{b.sub}</div>
    </AbsoluteFill>
  );
};

/** Expands `then` into equal sub-scenes so one long narration beat gets several visual beats. */
const expand = (beats: Beat[]): Beat[] => beats.flatMap((b) => {
  if (!b.then?.length) return [b];
  const parts = [{...b, then: undefined}, ...b.then.map((t) => ({...b, ...t, then: undefined}))] as Beat[];
  const step = (b.end - b.start) / parts.length;
  return parts.map((p, i) => ({...p, start: b.start + i * step, end: b.start + (i + 1) * step}));
});

export const KailashFilm: React.FC<{data: FilmData; audio: string}> = ({data, audio}) => {
  const {width, height, durationInFrames} = useVideoConfig();
  const f = useCurrentFrame();
  const T = themeOf(data.theme ?? 'katha');
  const beats = expand(data.beats);
  const chapter = [...beats].reverse().find((b) => b.kind === 'chapter' && b.start * FPS <= f);
  return (
    <ThemeCtx.Provider value={T}>
    <Stage theme={T} backdrop={{kind: 'gradient'}} idx={0} dur={durationInFrames} embers rays>
      <Audio src={staticFile(audio)} />
      {beats.map((b, i) => {
        const from = Math.round(b.start * FPS);
        const to = i === beats.length - 1 ? durationInFrames : Math.round(b.end * FPS);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
            <FadeFrame len={to - from}>
              <BeatBg idx={i} len={to - from} img={b.img} />
              <BeatView b={b} />
            </FadeFrame>
            <Sweep />
          </Sequence>
        );
      })}
      <Moments moments={data.beats.flatMap((b) => b.moments ?? [])} T={T} />
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: width * 0.045, top: height * 0.05, fontFamily: FONTS.sans,
          fontSize: width / 50, letterSpacing: 5, color: T.accent2, opacity: 0.9}}>{data.tag}</div>
        {chapter && (
          <div style={{position: 'absolute', right: width * 0.045, top: height * 0.05, fontFamily: FONTS.sans,
            fontSize: width / 50, letterSpacing: 5, color: T.accent2, opacity: 0.9}}>अध्याय {chapter.num}</div>
        )}
        {data.grid && <Grid color={T.accent} />}
        <div style={{position: 'absolute', left: 0, bottom: 0, height: 6, width: `${(f / durationInFrames) * 100}%`,
          background: `linear-gradient(90deg, ${T.accent}, ${T.accent2})`}} />
      </AbsoluteFill>
    </Stage>
    </ThemeCtx.Provider>
  );
};

/** HUD layer for the prophecy look: faint grid plus corner brackets. Off unless the film asks for it. */
const Grid: React.FC<{color: string}> = ({color}) => {
  const {width, height} = useVideoConfig();
  const m = width * 0.02;
  const c = `${color}88`;
  const corner = (x: number, y: number, dx: number, dy: number) => (
    <path d={`M${x} ${y + dy * 60} L${x} ${y} L${x + dx * 60} ${y}`} stroke={c} strokeWidth={3} fill="none" />
  );
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity: 0.5}}>
      <defs>
        <pattern id="grid" width={width / 24} height={width / 24} patternUnits="userSpaceOnUse">
          <path d={`M ${width / 24} 0 L 0 0 0 ${width / 24}`} stroke={`${color}22`} strokeWidth={1} fill="none" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid)" />
      {corner(m, m, 1, 1)}
      {corner(width - m, m, -1, 1)}
      {corner(m, height - m, 1, -1)}
      {corner(width - m, height - m, -1, -1)}
    </svg>
  );
};

/** A still behind one beat: slow push-in, dark grade, radial scrim so the type sits on the picture. */
const BeatBg: React.FC<{idx: number; len: number; img?: string}> = ({idx, len, img}) => {
  const T = useTheme();
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scale = interpolate(f, [0, len], [1.04, 1.16], {extrapolateRight: 'clamp'});
  const x = idx % 2 ? -1.5 : 1.5;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(`${img ? (img.includes('/') ? img : `img/kailash/${img}`) : `img/kailash/${BG[idx % BG.length]}`}.png`)} style={{width, height, objectFit: 'cover',
        transform: `scale(${scale}) translateX(${x}%)`, filter: T.light ? 'sepia(.45) saturate(.8) brightness(1.08) contrast(.95)' : 'saturate(.9) contrast(1.05) brightness(.5)'}} />
      <AbsoluteFill style={{background: T.light
        ? `radial-gradient(ellipse at 50% 46%, ${T.bg}b3 0%, ${T.bg}f2 80%)`
        : `radial-gradient(ellipse at 50% 46%, ${T.bg}55 0%, ${T.bg}e6 78%)`}} />
    </AbsoluteFill>
  );
};

/** Short fades at each beat edge so a cut is a dissolve, never a jump. */
const FadeFrame: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const o = useInOut(len, 8);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
