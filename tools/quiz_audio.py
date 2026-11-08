#!/usr/bin/env python3
"""Audio bed for a quiz Short: drone + countdown ticks + reveal bell.

Synthesized, like tools/make_stingers.py — nothing sampled, nothing licensed, so a reel can
go out without a music claim. One file per reel so the ticks land on that reel's own cues.

    python3 tools/quiz_audio.py public/quiz/01.wav --dur 17 --count 5 --reveal 8
"""
import argparse
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(11)


def t(dur: float) -> np.ndarray:
    return np.linspace(0, dur, int(SR * dur), endpoint=False)


def place(buf: np.ndarray, snd: np.ndarray, at: float) -> None:
    """Mix `snd` into `buf` starting at `at` seconds, clipped to the buffer."""
    i = int(at * SR)
    n = min(len(snd), len(buf) - i)
    if i >= 0 and n > 0:
        buf[i:i + n] += snd[:n]


def drone(dur: float, f0: float = 98.0) -> np.ndarray:
    """Low tanpura-ish pad: fifth plus octave, slow beating, filtered noise air."""
    x = t(dur)
    out = np.zeros_like(x)
    for f, g in ((f0, 0.5), (f0 * 1.5, 0.3), (f0 * 2, 0.22), (f0 * 3, 0.1)):
        out += g * np.sin(2 * np.pi * f * x + rng.uniform(0, 6.28)) * (1 + 0.04 * np.sin(2 * np.pi * 0.17 * x))
    air = sosfilt(butter(4, [200, 1800], btype='band', fs=SR, output='sos'), rng.normal(0, 1, len(x))) * 0.05
    fade = np.minimum(np.linspace(0, 1, len(x)) * 6, 1) * np.minimum(np.linspace(1, 0, len(x)) * 6, 1)
    return (out / np.max(np.abs(out)) * 0.5 + air) * fade


def tick(hard: bool = False) -> np.ndarray:
    """Clock tick: a short filtered noise burst with a wooden click on top."""
    x = t(0.09)
    n = rng.normal(0, 1, len(x))
    body = sosfilt(butter(4, [900, 5200], btype='band', fs=SR, output='sos'), n)
    e = np.exp(-np.linspace(0, 60 if hard else 85, len(x)))
    click = np.sin(2 * np.pi * (1500 if hard else 2100) * x) * np.exp(-np.linspace(0, 160, len(x)))
    return (body * e * 0.8 + click * 0.35) * (0.95 if hard else 0.6)


def bell(freq: float = 660.0, dur: float = 2.2) -> np.ndarray:
    """Reveal bell: inharmonic partials so it reads as metal, not as a beep."""
    x = t(dur)
    out = np.zeros_like(x)
    for i, p in enumerate((1, 2.01, 2.78, 4.07, 5.41)):
        out += (0.88 ** i) * np.exp(-np.linspace(0, 3.4 + i * 2.1, len(x))) * np.sin(2 * np.pi * freq * p * x)
    return out / np.max(np.abs(out)) * 0.8


def whoosh(dur: float = 0.5) -> np.ndarray:
    """Riser into the question card."""
    x = t(dur)
    n = sosfilt(butter(2, 400, btype='high', fs=SR, output='sos'), rng.normal(0, 1, len(x)))
    return n * (np.linspace(0, 1, len(x)) ** 2.5) * 0.35


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--dur", type=float, required=True, help="total seconds")
    ap.add_argument("--count", type=float, required=True, help="when 3-2-1 starts")
    ap.add_argument("--reveal", type=float, required=True, help="when the answer lands")
    args = ap.parse_args()

    buf = drone(args.dur)
    place(buf, whoosh(), max(0.0, args.count - 3.2))
    for i in range(3):                       # three ticks, one per second, last one harder
        place(buf, tick(hard=i == 2), args.count + i)
    place(buf, bell(), args.reveal)
    place(buf, bell(freq=880, dur=1.4) * 0.45, args.reveal + 0.12)

    peak = np.max(np.abs(buf))
    buf = buf / peak * 0.89 if peak > 0 else buf
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, (buf * 32767).astype(np.int16))
    print(f"{out}  {args.dur:.1f}s  ticks@{args.count:.1f}  bell@{args.reveal:.1f}")


if __name__ == "__main__":
    main()
