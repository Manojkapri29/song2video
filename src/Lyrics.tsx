import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type Line = {start: number; end: number; text: string};
export type Props = {lines: Line[]};

const Blob: React.FC<{x: number; y: number; r: number; color: string; speed: number}> = ({x, y, r, color, speed}) => {
  const f = useCurrentFrame() * speed;
  return (
    <div style={{position: 'absolute', left: x + Math.sin(f) * 220, top: y + Math.cos(f * 0.8) * 160,
      width: r, height: r, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, transparent 68%)`, opacity: 0.7}} />
  );
};

export const Lyrics: React.FC<Props> = ({lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const idx = lines.findIndex((l) => t >= l.start && t < l.end);
  const cur = idx >= 0 ? lines[idx] : null;
  const local = cur ? frame - cur.start * fps : 0;
  const pop = spring({frame: local, fps, config: {damping: 14, stiffness: 120}});
  const fadeOut = cur ? interpolate(t, [cur.end - 0.25, cur.end], [1, 0], {extrapolateLeft: 'clamp'}) : 0;
  const next = lines[idx + 1] ?? lines.find((l) => l.start > t);

  return (
    <AbsoluteFill style={{background: '#0b0618', fontFamily: 'Poppins, Arial, sans-serif', overflow: 'hidden'}}>
      <Audio src={staticFile('song.mp3')} />
      <Blob x={100} y={100} r={700} color="#7c3aed" speed={0.012} />
      <Blob x={1000} y={400} r={800} color="#ec4899" speed={0.009} />
      <Blob x={600} y={-100} r={600} color="#f59e0b" speed={0.015} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 120}}>
        {cur && (
          <div style={{color: 'white', fontSize: 120, fontWeight: 800, textAlign: 'center', lineHeight: 1.15,
            textShadow: '0 8px 40px rgba(0,0,0,.5)', opacity: fadeOut,
            transform: `scale(${0.8 + 0.2 * pop}) translateY(${(1 - pop) * 60}px)`}}>
            {cur.text}
          </div>
        )}
      </AbsoluteFill>
      {next && (
        <div style={{position: 'absolute', bottom: 70, width: '100%', textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: 44}}>
          {next.text}
        </div>
      )}
    </AbsoluteFill>
  );
};
