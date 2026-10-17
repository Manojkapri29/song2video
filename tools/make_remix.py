"""Original pop backing (100 BPM, Am-F-C-G) synthesized from scratch + ducked mix with tools/tmp/voice.wav -> public/bhajan_remix.mp3"""
import wave, subprocess, numpy as np
sr, bpm, total = 44100, 100, 60.0
beat = 60 / bpm; bar = beat * 4; nbars = int(total / bar) + 1
n = int(sr * (total + 1)); rng = np.random.default_rng(7)

def put(buf, x, t, g=1.0):
    s = int(t * sr)
    if s < n: e = min(n, s + len(x)); buf[s:e] += x[:e - s] * g

def tt(d): return np.arange(int(sr * d)) / sr
def kick():
    t = tt(0.45); ph = 2 * np.pi * np.cumsum(45 + 95 * np.exp(-t * 28)) / sr
    return np.sin(ph) * np.exp(-t * 8)
def clap():
    t = tt(0.22); x = np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 22)
    for d in (0.012, 0.024): x[int(d * sr):] += x[:-int(d * sr)] * 0.6
    return x * 0.5
def hat(open_=False):
    t = tt(0.28 if open_ else 0.06); x = np.diff(rng.standard_normal(len(t)), n=2, prepend=[0, 0])
    return x * np.exp(-t * (18 if open_ else 80)) * 0.5
def pluck(f, d=0.5):
    t = tt(d); return sum(np.sin(2 * np.pi * f * h * t) / h ** 1.2 for h in range(1, 7)) * np.exp(-t * 7)
def bass(f, d):
    t = tt(d); x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    return x * np.minimum(1, t * 200) * np.exp(-t * 3.5)
def pad(freqs, d):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs)
    return x * np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8)

N = {"A": 220.0, "C": 261.63, "E": 329.63, "F": 174.61, "G": 196.0, "B": 246.94, "D": 293.66}
CH = [("A", [220, 261.63, 329.63], 55.0), ("F", [174.61, 220, 261.63], 43.65),
      ("C", [261.63, 329.63, 392.0], 65.41), ("G", [196.0, 246.94, 293.66], 49.0)]
drums, bs, ch = np.zeros(n), np.zeros(n), np.zeros(n)
K, C, H, HO = kick(), clap(), hat(), hat(True)
for b in range(nbars):
    t0 = b * bar; name, tri, root = CH[b % 4]
    if b >= 1:  # hats from bar 2
        for s in range(8): put(drums, H, t0 + s * beat / 2, 0.5 if s % 2 else 0.8)
        put(drums, HO, t0 + 1.5 * beat, 0.5); put(drums, HO, t0 + 3.5 * beat, 0.5)
    if b >= 2:  # full groove
        for k in (0, 1.5, 2, 3.25 if b % 2 else 2.5): put(drums, K, t0 + k * beat, 1.0)
        for c in (1, 3): put(drums, C, t0 + c * beat, 0.9)
        for k, d in ((0, 0.6), (0.75, 0.35), (1.5, 0.45), (2.5, 0.45), (3.25, 0.6)):
            put(bs, bass(root, d * beat * 1.6), t0 + k * beat, 0.9)
    put(ch, pad(tri, bar), t0, 0.12)
    notes = tri + [tri[1] * 2]
    for s in range(16):  # 16th arp, one octave up
        f = notes[[0, 1, 2, 3, 2, 1, 3, 2][s % 8]] * 2
        put(ch, pluck(f), t0 + s * beat / 4, 0.16 if s % 4 else 0.24)
mus = drums * 0.9 + bs * 0.7 + ch
mus = mus / np.abs(mus).max() * 0.8
with wave.open("tools/tmp/music.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((mus[: int(sr * total)] * 32767).astype(np.int16).tobytes())
fc = ("[0:a]aecho=0.8:0.55:70|150:0.22|0.12,acompressor=threshold=0.08:ratio=3,volume=1.5,asplit=2[v][sc];"
      "[1:a]volume=0.8[m];[m][sc]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350[duck];"
      f"[v][duck]amix=inputs=2:normalize=0:duration=longest,apad=whole_dur={total},loudnorm=I=-14:TP=-1.5,afade=t=in:d=0.8,afade=t=out:st={total-2.5}:d=2.5[o]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "tools/tmp/voice.wav", "-i", "tools/tmp/music.wav", "-filter_complex", fc,
                "-map", "[o]", "-t", str(total), "-ar", "44100", "-b:a", "192k", "public/bhajan_remix.mp3"], check=True)
print("ok")
