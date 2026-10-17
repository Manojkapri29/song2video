#!/usr/bin/env python3
"""make_premium.py AUDIO LYRICS.txt [--start 0] [--dur 60] [--title T] [--lang hi] [--out out/final.mp4] [--no-render]
Cuts AUDIO, force-aligns LYRICS.txt (1 line per lyric line) with Whisper, renders the Premium 3D composition."""
import argparse, json, subprocess, sys, os, stable_whisper
ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("lyrics")
ap.add_argument("--start", type=float, default=0); ap.add_argument("--dur", type=float, default=60)
ap.add_argument("--title", default=""); ap.add_argument("--tag", default="")
ap.add_argument("--lang", default="hi"); ap.add_argument("--out", default="out/final.mp4"); ap.add_argument("--no-render", action="store_true")
a = ap.parse_args()
os.makedirs("out", exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(a.start), "-t", str(a.dur), "-i", a.audio,
                "-af", f"loudnorm=I=-14:TP=-1.5,afade=t=out:st={a.dur-2.5}:d=2.5", "-b:a", "192k", "public/user_audio.mp3"], check=True)
text = [l.strip() for l in open(a.lyrics, encoding="utf-8") if l.strip()]
m = stable_whisper.load_model("medium")
res = m.align("public/user_audio.mp3", "\n".join(text), language=a.lang, original_split=True)
segs = [s for s in res.segments if s.text.strip()]
lines = [{"start": round(float(s.start), 2), "end": round(float(s.end), 2), "text": s.text.strip(),
          "words": [{"w": w.word.strip(), "start": round(float(w.start), 2), "end": round(float(w.end), 2)} for w in s.words if w.word.strip()]} for s in segs]
bad = [i for i, (x, y) in enumerate(zip(lines, lines[1:])) if y["start"] < x["start"] or x["end"] - x["start"] < 0.3]
print(f"{len(lines)}/{len(text)} lines aligned; suspicious lines: {bad or 'none'}")
json.dump({"audio": "user_audio.mp3", "title": a.title or text[0][:24], "tag": a.tag, "lines": lines}, open("tools/tmp/user_props.json", "w", encoding="utf-8"), ensure_ascii=False)
if not a.no_render:
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "Premium", a.out, "--concurrency=3", "--props=tools/tmp/user_props.json"], check=True)
    print("DONE", a.out)
