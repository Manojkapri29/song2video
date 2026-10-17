"""usage: transcribe.py public/song.mp3 [lang] [model] -> public/lyrics.json (auto lyrics + timing)"""
import sys, json, stable_whisper
audio = sys.argv[1]; lang = sys.argv[2] if len(sys.argv) > 2 else "hi"; size = sys.argv[3] if len(sys.argv) > 3 else "medium"
model = stable_whisper.load_model(size)
res = model.transcribe(audio, language=lang, regroup=True)
out = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
        "words": [{"w": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)} for w in s.words if w.word.strip()]}
       for s in res.segments if s.text.strip()]
json.dump(out, open("public/lyrics.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("segments:", len(out))
