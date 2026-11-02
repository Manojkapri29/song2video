"""A narrated slide deck -> a cinematic film plan, keeping the original audio untouched.

A Gamma-style deck read aloud is a slideshow: one static card held for twenty seconds while
the voice carries everything. This turns that into a film. The narration stays exactly as it
was recorded; the plan file says, per narration beat, what the headline is and what the
pictures should be. Here that becomes two things song2video.py already knows how to use:

    tools/<slug>.prompts.txt   one FLUX prompt per shot, in order
    out/<slug>.props.json      the scene cuts and the kinetic headlines, timed

    python3 tools/deck2film.py tools/kailash.plan.txt

Then the usual two steps, which need the GPU:

    python3 tools/song2video.py scenes kailash --prompts tools/kailash.prompts.txt
    python3 tools/song2video.py render kailash

Shot spacing is the one judgement baked in here: a parallax camera move reads for about six
seconds and then starts to feel like a held frame, so a beat is cut into as many shots as it
takes to keep every one under MAX_SHOT.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

MAX_SHOT = 7.0          # seconds before a parallax move stops reading as a move
HEAD_IN = 0.6           # the headline lands just after the beat starts, not on the cut
HEAD_HOLD = 4.2         # and stays long enough to read, not for the whole beat

META_RE = re.compile(r"^#\s*(audio|slug|title|tag|theme|mark)\s*:\s*(.+?)\s*$")
BEAT_RE = re.compile(r"^@\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*(.+?)\s*$")


class Beat:
    def __init__(self, start: float, end: float, head: str):
        self.start, self.end, self.head = start, end, head
        self.prompts: list[str] = []

    def shots(self) -> list[tuple[float, str]]:
        """Evenly spaced cuts inside the beat, one per prompt."""
        n = len(self.prompts)
        span = (self.end - self.start) / n
        return [(round(self.start + i * span, 2), p) for i, p in enumerate(self.prompts)]


def parse(path: Path) -> tuple[dict, list[Beat]]:
    meta: dict = {}
    beats: list[Beat] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            m = META_RE.match(line)
            if m:
                meta[m.group(1)] = m.group(2)
            continue
        m = BEAT_RE.match(line)
        if m:
            beats.append(Beat(float(m.group(1)), float(m.group(2)), m.group(3)))
            continue
        if not beats:
            raise SystemExit(f"prompt before the first @ beat: {line!r}")
        beats[-1].prompts.append(line)
    return meta, beats


def check(meta: dict, beats: list[Beat]) -> None:
    """Fail loudly here rather than four GPU-hours later."""
    for key in ("audio", "slug", "title"):
        if key not in meta:
            raise SystemExit(f"plan is missing `# {key}:`")
    if not beats:
        raise SystemExit("plan has no @ beats")
    for i, b in enumerate(beats, 1):
        if b.end <= b.start:
            raise SystemExit(f"beat {i} ends before it starts ({b.start} -> {b.end})")
        if not b.prompts:
            raise SystemExit(f"beat {i} ({b.head!r}) has no prompts")
        longest = (b.end - b.start) / len(b.prompts)
        if longest > MAX_SHOT + 0.5:
            want = math.ceil((b.end - b.start) / MAX_SHOT)
            print(f"  warn: beat {i} holds each shot {longest:.1f}s "
                  f"({len(b.prompts)} prompts, {want} would fit)", file=sys.stderr)
    for a, b in zip(beats, beats[1:]):
        if b.start < a.end - 0.01:
            raise SystemExit(f"beats overlap at {b.start}")


def build(meta: dict, beats: list[Beat]) -> tuple[list[str], dict]:
    slug = meta["slug"]
    prompts: list[str] = []
    scenes: list[dict] = []
    lines: list[dict] = []
    for b in beats:
        for start, prompt in b.shots():
            prompts.append(prompt)
            scenes.append({"start": start,
                           "img": f"img/{slug}/{len(prompts):02d}.png"})
        head_end = min(b.start + HEAD_IN + HEAD_HOLD, b.end - 0.2)
        if head_end > b.start + HEAD_IN:
            lines.append({"start": round(b.start + HEAD_IN, 2),
                          "end": round(head_end, 2),
                          "text": b.head})
    props = {
        "title": meta["title"],
        "tag": meta.get("tag", "कथा और रहस्य"),
        "audio": meta["audio"],
        "hook": meta.get("hook", "\x00"),      # no line is the hook: every headline reads the same
        "theme": meta.get("theme", "katha"),
        "mark": meta.get("mark", "🔱"),
        "lines": lines,
        "scenes": scenes,
    }
    return prompts, props


def selftest() -> None:
    b = Beat(10.0, 24.0, "सिर")
    b.prompts = ["a", "b"]
    assert b.shots() == [(10.0, "a"), (17.0, "b")], b.shots()
    b.prompts = ["a"]
    assert b.shots() == [(10.0, "a")]

    meta, beats = parse_text("# audio: x.mp3\n# slug: s\n# title: T\n@ 0 | 7 | H\nprompt one\n")
    assert meta["slug"] == "s" and len(beats) == 1 and beats[0].prompts == ["prompt one"]
    prompts, props = build(meta, beats)
    assert prompts == ["prompt one"]
    assert props["scenes"] == [{"start": 0.0, "img": "img/s/01.png"}]
    # the headline is clipped to the beat, never left hanging past its end
    assert props["lines"][0]["end"] <= 7 - 0.2 + 1e-9, props["lines"]
    print("selftest ok")


def parse_text(text: str) -> tuple[dict, list[Beat]]:
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".txt", encoding="utf-8", delete=False) as f:
        f.write(text)
        p = Path(f.name)
    try:
        return parse(p)
    finally:
        p.unlink()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan", nargs="?", help="tools/<slug>.plan.txt")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        selftest()
        return 0
    if not a.plan:
        ap.error("plan is required")

    meta, beats = parse(Path(a.plan).expanduser())
    check(meta, beats)
    prompts, props = build(meta, beats)

    slug = meta["slug"]
    pfile = ROOT / "tools" / f"{slug}.prompts.txt"
    jfile = ROOT / "out" / f"{slug}.props.json"
    jfile.parent.mkdir(exist_ok=True)
    pfile.write_text("\n".join(prompts) + "\n", encoding="utf-8")
    jfile.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")

    span = beats[-1].end - beats[0].start
    print(f"{len(beats)} beats, {len(prompts)} shots over {span / 60:.1f} min "
          f"({span / len(prompts):.1f}s each)")
    print(f"  {pfile.relative_to(ROOT)}")
    print(f"  {jfile.relative_to(ROOT)}")
    print(f"\nnext:  python3 tools/song2video.py scenes {slug} --prompts {pfile.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
