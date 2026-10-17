"""Check + align Roman-lyrics AI song; map timings onto Devanagari lines -> public/bhajan_ai.json (prints scores only)."""
import json, difflib, re, stable_whisper
ROMAN = open("tools/roman.txt", encoding="utf-8").read().strip().split("\n")
d = json.load(open("public/bhajan.json", encoding="utf-8"))
m = stable_whisper.load_model("medium")
tr = m.transcribe("public/bhajan_ai.mp3", language="en", regroup=True)
norm = lambda t: re.sub(r"[^a-z]", "", t.lower())
print("similarity:", round(difflib.SequenceMatcher(None, norm(" ".join(s.text for s in tr.segments)), norm("".join(ROMAN))).ratio(), 2))
res = m.align("public/bhajan_ai.mp3", "\n".join(ROMAN), language="en", original_split=True)
segs = [s for s in res.segments if s.text.strip()]
times = [(round(float(s.start), 2), round(float(s.end), 2)) for s in segs]
print("lines:", len(times), times)
if len(times) == len(d["lines"]):
    out = [{"start": a, "end": b, "text": l["text"]} for (a, b), l in zip(times, d["lines"])]
    json.dump({"title": d["title"], "lines": out}, open("public/bhajan_ai.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
