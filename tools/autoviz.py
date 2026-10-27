"""One click: an audio or video file in, a 2D motion-graphics video out.

    python3 tools/autoviz.py ~/Downloads/song.mp3
    python3 tools/autoviz.py song.mp4 --title "कथा और रहस्य" --theme mystery --short

Nothing to review in between. The motion comes from tools/audiomap.py — beats,
energy and three frequency bands — so there is no transcript to correct. If you
want the words on screen, that is the other pipeline (song2video.py) and it needs
your eyes on the timing; this one does not.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

import audiomap  # noqa: E402

THEMES = ("katha", "mystery", "paper", "romance", "punch")


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", Path(name).stem).strip("-").lower()
    return s[:40] or "track"


def ensure_audio_in_public(src: Path, slug: str) -> str:
    """Remotion's staticFile() only reaches public/, so the track has to live there.

    A video file is not copied whole — only its audio is pulled out, which keeps
    public/ from filling up with hundreds of megabytes of footage nobody renders.
    """
    public = ROOT / "public"
    public.mkdir(exist_ok=True)
    if src.suffix.lower() in {".mp3", ".wav", ".m4a"}:
        dest = public / f"{slug}{src.suffix.lower()}"
        if src.resolve() != dest.resolve():
            shutil.copy2(src, dest)
        return dest.name
    dest = public / f"{slug}.mp3"
    run = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-b:a", "192k", str(dest)],
        capture_output=True, check=False,
    )
    if run.returncode != 0:
        raise SystemExit(f"audio nahi nikla: {run.stderr.decode()[:300]}")
    return dest.name


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("media", help="mp3 / wav / m4a / mp4 / mov")
    ap.add_argument("--title", default="", help="screen par bada text; khaali = file ka naam")
    ap.add_argument("--tag", default="कथा और रहस्य")
    ap.add_argument("--theme", default="katha", choices=THEMES)
    ap.add_argument("--short", action="store_true", help="1080x1920 Shorts/Reels")
    ap.add_argument("--out", default="", help="output mp4 path")
    ap.add_argument("--still", action="store_true", help="sirf ek frame, dekhne ke liye (tez)")
    a = ap.parse_args()

    src = Path(a.media).expanduser()
    if not src.exists():
        raise SystemExit(f"file nahi mili: {src}")

    slug = slugify(src.name)
    print(f"1/3  audio padh raha hoon: {src.name}")
    audio_name = ensure_audio_in_public(src, slug)
    amap = audiomap.analyse(ROOT / "public" / audio_name)
    print(f"     {amap['duration']}s · {amap['bpm']} BPM · {len(amap['beats'])} beats")

    title = a.title or src.stem
    props = {
        "map": amap,
        "audio": audio_name,
        "title": title,
        # channel tag title ke neeche chhapta hai; dono same hon to do baar dikhega
        "tag": "" if a.tag.strip() == title.strip() else a.tag,
        "theme": a.theme,
    }
    props_path = ROOT / "out" / f"{slug}.autoviz.json"
    props_path.parent.mkdir(exist_ok=True)
    props_path.write_text(json.dumps(props, ensure_ascii=False))

    comp = "AudioVizShort" if a.short else "AudioViz"
    out = Path(a.out).expanduser() if a.out else ROOT / "out" / f"{slug}{'-short' if a.short else ''}.mp4"

    if a.still:
        shot = out.with_suffix(".png")
        print(f"2/3  still nikal raha hoon -> {shot}")
        cmd = ["npx", "remotion", "still", comp, str(shot),
               f"--props={props_path}", "--frame=90"]
    else:
        print(f"3/3  render -> {out}   ({'1080x1920' if a.short else '1920x1080'})")
        cmd = ["npx", "remotion", "render", comp, str(out), f"--props={props_path}"]

    run = subprocess.run(cmd, cwd=ROOT, check=False)
    if run.returncode != 0:
        print("\nrender fail hua. Upar ka Remotion error dekho.")
        return run.returncode
    print(f"\nban gayi: {shot if a.still else out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
