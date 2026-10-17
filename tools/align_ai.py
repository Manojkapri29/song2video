"""Force-align bhajan.json lines to public/bhajan_ai.mp3 -> public/bhajan_ai.json; prints match score (no text)."""
import json, difflib, stable_whisper
d = json.load(open("public/bhajan.json", encoding="utf-8")); texts = [l["text"] for l in d["lines"]]
m = stable_whisper.load_model("medium")
tr = m.transcribe("public/bhajan_ai.mp3", language="hi", regroup=True)
heard = " ".join(s.text for s in tr.segments)
print("similarity heard-vs-lyrics:", round(difflib.SequenceMatcher(None, "".join(heard.split()), "".join("".join(texts).split())).ratio(), 2))
res = m.align("public/bhajan_ai.mp3", "\n".join(texts), language="hi", original_split=True)
segs = [s for s in res.segments if s.text.strip()]
out = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
        "words": [{"w": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)} for w in s.words if w.word.strip()]} for s in segs]
json.dump({"title": d["title"], "lines": out}, open("public/bhajan_ai.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("lines:", len(out), [(o["start"], o["end"]) for o in out])
