"""usage: srt_lines.py <file.srt> <out.json>
Rolling-window SRT (each cue repeats previous lines) -> one entry per lyric line.
A line's start is the start of the cue it enters in; ties inside one cue
are spread evenly across that cue. Repeated lines (hook) stay as separate entries. End = next line's start.
"""
import json, re, sys

def ts(s):
    h, m, rest = s.split(":")
    sec, ms = rest.replace(".", ",").split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000

src, dst = sys.argv[1], sys.argv[2]
blocks = re.split(r"\n\s*\n", open(src, encoding="utf-8").read().strip())
cues = []
for b in blocks:
    rows = [r for r in b.splitlines() if r.strip()]
    i = next((n for n, r in enumerate(rows) if "-->" in r), None)
    if i is None:
        continue
    a, z = [t.strip() for t in rows[i].split("-->")]
    text = [re.sub(r"[♪♪]", "", r).strip() for r in rows[i + 1:]]
    cues.append((ts(a), ts(z), [t for t in text if t]))

prev, out = [], []
for start, end, lines in cues:                   # a line is "entering" if the previous cue lacked it
    fresh = [l for l in lines if l not in prev]
    prev = lines
    for k, l in enumerate(fresh):
        out.append({"start": round(start + (end - start) * k / len(fresh), 2), "text": l})

for n, o in enumerate(out):                      # end = next line's start
    o["end"] = out[n + 1]["start"] if n + 1 < len(out) else round(cues[-1][1], 2)
    parts = o["text"].split()
    d = (o["end"] - o["start"]) / max(1, len(parts))
    o["words"] = [{"w": w, "start": round(o["start"] + i * d, 2), "end": round(o["start"] + (i + 1) * d, 2)}
                  for i, w in enumerate(parts)]

assert all(out[n]["end"] > out[n]["start"] for n in range(len(out))), "non-positive line duration"
assert all(out[n]["end"] <= out[n + 1]["start"] + 1e-6 for n in range(len(out) - 1)), "overlapping lines"
json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("lines:", len(out), "| span:", out[0]["start"], "->", out[-1]["end"])
