"""Audio -> a map the video can be animated from: beats, energy, three frequency bands.

No transcription anywhere in here. That is the point: whisper mishears Hindi often
enough that putting its words on screen needs a human review pass, which is exactly
what the one-click path cannot have. Motion driven by the sound itself is always
right, because there is nothing to get wrong.

numpy + scipy + ffmpeg only, so the venv does not grow a librosa-sized dependency
for one job.

    python3 tools/audiomap.py song.mp3 -o public/audiomap.json
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 22050          # plenty for beats and band energy; keeps the FFTs small
HOP = 512           # ~43 frames/s at 22050
WIN = 1024


def decode(path: Path) -> np.ndarray:
    """Any ffmpeg-readable file -> mono float32 at SR. Works on mp4 as well as mp3."""
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path),
         "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=False,
    )
    if out.returncode != 0 or not out.stdout:
        raise SystemExit(f"ffmpeg se audio nahi nikla: {out.stderr.decode()[:400]}")
    return np.frombuffer(out.stdout, dtype=np.float32)


def frames(x: np.ndarray) -> np.ndarray:
    n = 1 + max(0, (len(x) - WIN) // HOP)
    idx = np.arange(WIN)[None, :] + HOP * np.arange(n)[:, None]
    return x[idx] * np.hanning(WIN)[None, :]


def spectra(x: np.ndarray) -> np.ndarray:
    return np.abs(np.fft.rfft(frames(x), axis=1))


def bands(S: np.ndarray) -> dict[str, np.ndarray]:
    """Low / mid / high energy. Low carries the kick, high carries hats and sibilance."""
    freqs = np.fft.rfftfreq(WIN, 1 / SR)
    cut = lambda lo, hi: S[:, (freqs >= lo) & (freqs < hi)].mean(axis=1)
    return {"low": cut(20, 250), "mid": cut(250, 2000), "high": cut(2000, SR / 2)}


def onset_envelope(S: np.ndarray) -> np.ndarray:
    """Spectral flux: how much the spectrum grew since the last frame."""
    flux = np.diff(S, axis=0, prepend=S[:1])
    env = np.maximum(flux, 0).sum(axis=1)
    # subtract a local mean so a loud section does not swamp a quiet one
    k = 16
    pad = np.pad(env, (k, k), mode="edge")
    local = np.convolve(pad, np.ones(2 * k + 1) / (2 * k + 1), mode="valid")
    return np.maximum(env - local, 0)


def tempo_bpm(env: np.ndarray) -> float:
    """Autocorrelate the onset envelope and read the strongest lag in a musical range."""
    e = env - env.mean()
    ac = np.correlate(e, e, mode="full")[len(e) - 1:]
    fps = SR / HOP
    lo, hi = int(fps * 60 / 180), int(fps * 60 / 60)        # 60..180 BPM
    hi = min(hi, len(ac) - 1)
    if hi <= lo:
        return 0.0
    lag = lo + int(np.argmax(ac[lo:hi]))
    return round(60.0 * fps / lag, 1) if lag else 0.0


def pick_beats(env: np.ndarray, bpm: float) -> list[float]:
    """Peaks in the onset envelope, thinned so two beats cannot land on top of each other."""
    fps = SR / HOP
    gap = int(fps * 60 / bpm * 0.6) if bpm else int(fps * 0.25)
    gap = max(gap, 4)
    thresh = env.mean() + env.std() * 0.6
    beats, last = [], -gap
    for i, v in enumerate(env):
        if v > thresh and i - last >= gap and v == env[max(0, i - 2): i + 3].max():
            beats.append(round(i / fps, 3))
            last = i
    return beats


def norm(a: np.ndarray) -> np.ndarray:
    """0..1 with the top 2% clipped, so one transient does not flatten everything else."""
    hi = np.percentile(a, 98) or 1.0
    return np.clip(a / hi, 0, 1)


def downsample(a: np.ndarray, per_sec: float, out_per_sec: int) -> list[float]:
    n = max(1, int(len(a) / per_sec * out_per_sec))
    idx = np.linspace(0, len(a) - 1, n)
    return [round(float(v), 4) for v in np.interp(idx, np.arange(len(a)), a)]


def analyse(path: Path, out_fps: int = 30) -> dict:
    x = decode(path)
    if len(x) < WIN * 4:
        raise SystemExit("audio bahut chhota hai")
    S = spectra(x)
    env = onset_envelope(S)
    bpm = tempo_bpm(env)
    b = bands(S)
    fps = SR / HOP
    return {
        "source": path.name,
        "duration": round(len(x) / SR, 3),
        "bpm": bpm,
        "fps": out_fps,                       # the arrays below are sampled at this rate
        "beats": pick_beats(env, bpm),
        "energy": downsample(norm(np.sqrt((frames(x) ** 2).mean(axis=1))), fps, out_fps),
        "low": downsample(norm(b["low"]), fps, out_fps),
        "mid": downsample(norm(b["mid"]), fps, out_fps),
        "high": downsample(norm(b["high"]), fps, out_fps),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("audio")
    ap.add_argument("-o", "--out", default="public/audiomap.json")
    ap.add_argument("--fps", type=int, default=30)
    a = ap.parse_args()
    data = analyse(Path(a.audio).expanduser(), a.fps)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(data))
    print(f"{a.out}: {data['duration']}s, {data['bpm']} BPM, {len(data['beats'])} beats, "
          f"{len(data['energy'])} energy samples")


if __name__ == "__main__":
    sys.exit(main())
