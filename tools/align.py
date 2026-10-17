"""usage: align.py public/song.mp3 lyrics.txt  -> public/lyrics.json (one lyric line per text line)"""
import sys, json, stable_whisper
audio, txt = sys.argv[1], sys.argv[2]
model = stable_whisper.load_model("small")
res = model.align(audio, open(txt, encoding="utf-8").read(), language=sys.argv[3] if len(sys.argv) > 3 else "hi", original_split=True)
json.dump([{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in res.segments],
          open("public/lyrics.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote public/lyrics.json")
