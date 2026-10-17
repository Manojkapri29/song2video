"""usage: align_lines.py <lines.json> <audio> <out.json> [lang] [model]
Force-align known lyric lines to the audio -> real word-level timing.
Input: list of {"text": ...} (extra keys ignored). Output: same shape as katha.json.
"""
import json, sys, stable_whisper

lines_path, audio, dst = sys.argv[1], sys.argv[2], sys.argv[3]
lang = sys.argv[4] if len(sys.argv) > 4 else "hi"
size = sys.argv[5] if len(sys.argv) > 5 else "medium"

src = json.load(open(lines_path, encoding="utf-8"))
texts = [l["text"] for l in (src["lines"] if isinstance(src, dict) else src)]

model = stable_whisper.load_model(size)
res = model.align(audio, "\n".join(texts), language=lang, original_split=True)

segs = [s for s in res.segments if s.text.strip()]
print("aligned segments:", len(segs), "of", len(texts))
out = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
        "words": [{"w": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)}
                  for w in s.words if w.word.strip()]}
       for s in segs]
json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for o in out:
    print(f"{o['start']:7.2f} {o['end']:7.2f}  {o['text']}")
