"""Synthesize the channel stingers from scratch — no samples, no licensing.

intro_sting.wav : gong strike + shankh swell + two damru taps + drone tail (6 s)
outro_sting.wav : softer bell, second bell on the subscribe beat, long drone (8 s)

Cues match src/presets/Brand.tsx: mark pops at frame 4 (0.13 s), ring draws 8->34,
title words from 14 (0.47 s), sub at 26 (0.87 s), outro button at 34 (1.13 s).
"""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
rng = np.random.default_rng(7)            # fixed seed: same file every run

def t(dur):
    return np.linspace(0, dur, int(SR * dur), endpoint=False)

def env(n, attack, decay, hold=0.0):
    """Attack / hold / exponential decay, in seconds."""
    a = int(SR * attack)
    h = int(SR * hold)
    d = max(1, n - a - h)
    return np.concatenate([
        np.linspace(0, 1, a) ** 1.5 if a else np.array([]),
        np.ones(h),
        np.exp(-np.linspace(0, 5, d)),
    ])[:n]

def bell(freq, dur, partials=(1, 2.01, 2.78, 4.07, 5.41, 6.8), gain=1.0):
    """Inharmonic partials = metal, not a sine. Higher partials die first."""
    x = t(dur)
    out = np.zeros_like(x)
    for i, p in enumerate(partials):
        decay = np.exp(-np.linspace(0, 4 + i * 2.2, len(x)))
        out += (0.9 ** i) * decay * np.sin(2 * np.pi * freq * p * x + rng.uniform(0, 6.28))
    strike = rng.normal(0, 1, len(x)) * np.exp(-np.linspace(0, 240, len(x))) * 0.5
    return gain * (out / np.max(np.abs(out)) * 0.85 + strike)

def shankh(dur, f0=146.8):
    """Conch: breath noise through a resonant band, plus a few harmonics with vibrato."""
    x = t(dur)
    noise = rng.normal(0, 1, len(x))
    sos = butter(4, [f0 * 0.9, f0 * 3.2], btype='band', fs=SR, output='sos')
    breath = sosfilt(sos, noise) * 0.55
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * x)
    tone = sum((0.8 ** k) * np.sin(2 * np.pi * f0 * (k + 1) * vib * x) for k in range(5))
    swell = np.clip(np.linspace(0, 1.6, len(x)), 0, 1) ** 2 * np.exp(-np.linspace(0, 2.2, len(x)))
    return (breath + tone / 4) * swell

def damru(dur=0.22, f0=320):
    """Membrane tap: noise burst with a fast pitch drop."""
    x = t(dur)
    sweep = f0 * np.exp(-np.linspace(0, 3.4, len(x)))
    body = np.sin(2 * np.pi * np.cumsum(sweep) / SR)
    skin = rng.normal(0, 1, len(x)) * np.exp(-np.linspace(0, 60, len(x))) * 0.6
    return (body + skin) * env(len(x), 0.001, 1.0)

def drone(dur, f0=73.4):
    x = t(dur)
    base = sum((0.6 ** k) * np.sin(2 * np.pi * f0 * (k + 1) * x) for k in range(4))
    swell = np.clip(np.linspace(0, 2.2, len(x)), 0, 1)
    fade = np.clip(np.linspace(2.0, 0, len(x)), 0, 1)
    return base * swell * fade * 0.22

def reverb(sig, tail=1.8, mix=0.32):
    ir = rng.normal(0, 1, int(SR * tail)) * np.exp(-np.linspace(0, 6, int(SR * tail)))
    wet = fftconvolve(sig, ir)[:len(sig)]
    return (1 - mix) * sig + mix * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(sig))

def place(track, sig, at):
    i = int(SR * at)
    n = min(len(sig), len(track) - i)
    if n > 0:
        track[i:i + n] += sig[:n]
    return track

def finish(track, path, peak=0.89):
    track = reverb(track)
    track *= peak / (np.max(np.abs(track)) + 1e-9)
    fade = int(SR * 0.6)
    track[-fade:] *= np.linspace(1, 0, fade)
    wavfile.write(path, SR, (track * 32767).astype(np.int16))
    return track

# ---- intro: 6 s -------------------------------------------------------------
dur = 6.0
tr = np.zeros(int(SR * dur))
tr = place(tr, drone(dur), 0)
tr = place(tr, bell(196.0, 4.5, gain=1.0), 0.10)        # gong on the mark pop
tr = place(tr, shankh(3.2) * 0.75, 0.15)                # conch under the ring draw
tr = place(tr, damru() * 0.7, 0.47)                     # title words
tr = place(tr, damru() * 0.55, 0.62)
tr = place(tr, bell(392.0, 2.4, gain=0.35), 0.87)       # subtitle shimmer
intro = finish(tr, "public/intro_sting.wav")

# ---- outro: 8 s -------------------------------------------------------------
dur = 8.0
tr = np.zeros(int(SR * dur))
tr = place(tr, drone(dur, 65.4), 0)
tr = place(tr, bell(174.6, 5.0, gain=0.8), 0.10)
tr = place(tr, shankh(2.4) * 0.45, 0.20)
tr = place(tr, bell(349.2, 3.0, gain=0.42), 1.13)       # subscribe button
tr = place(tr, damru() * 0.4, 1.13)
outro = finish(tr, "public/outro_sting.wav")

for name, sig, want in (("intro", intro, 6.0), ("outro", outro, 8.0)):
    assert abs(len(sig) / SR - want) < 0.01, f"{name}: wrong length"
    assert 0.5 < np.max(np.abs(sig)) <= 1.0, f"{name}: bad peak"
    assert np.sqrt(np.mean(sig ** 2)) > 0.02, f"{name}: silent"
    print(f"{name}_sting.wav  {len(sig)/SR:.2f}s  peak {np.max(np.abs(sig)):.2f}  rms {np.sqrt(np.mean(sig**2)):.3f}")
