#!/usr/bin/env python
"""Force-align known lyrics to a song, word by word.

    python tools/align_lyrics.py <audio> <lyrics.txt> <slug> --title "..." --tag "..."

Whisper's own segmentation guesses where phrases are and gets Hindi wrong; alignment is
told the words and only has to find where each one lands. Writes out/<slug>.props.json
with per-word timing, which is what the sketch video writes letter by letter.
"""
import argparse, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"

ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("lyrics"); ap.add_argument("slug")
ap.add_argument("--title", default=""); ap.add_argument("--tag", default="")
ap.add_argument("--handle", default="@kathaaurrahasya")
ap.add_argument("--model", default="medium"); ap.add_argument("--lang", default="hi")
a = ap.parse_args()

lines = [l.strip() for l in Path(a.lyrics).read_text(encoding="utf-8").splitlines() if l.strip()]
if not lines:
    sys.exit("no lyrics")

import stable_whisper
model = stable_whisper.load_model(a.model)
res = model.align(a.audio, "\n".join(lines), language=a.lang)

words = [w for seg in res.segments for w in seg.words]
print(f"aligned {len(words)} words across {len(lines)} lines")

out, cursor = [], 0
for text in lines:
    want = len(re.findall(r"\S+", text))
    take = words[cursor:cursor + want]
    cursor += want
    if not take:
        break
    out.append({
        "start": round(take[0].start, 2), "end": round(take[-1].end, 2), "text": text,
        "words": [{"w": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)}
                  for w in take],
    })

import subprocess
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "csv=p=0", a.audio], capture_output=True, text=True).stdout.strip())
props = {"title": a.title or a.slug, "tag": a.tag, "handle": a.handle,
         "audio": Path(a.audio).name, "duration": round(dur, 2), "lines": out}
OUT.mkdir(exist_ok=True)
(OUT / f"{a.slug}.props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1),
                                          encoding="utf-8")
drift = [l for i, l in enumerate(out[1:], 1) if l["start"] < out[i - 1]["start"]]
print(f"out/{a.slug}.props.json — {len(out)} lines, {dur:.1f}s"
      + (f"  WARNING: {len(drift)} line(s) out of order" if drift else ""))
