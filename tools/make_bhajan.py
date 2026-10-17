"""Build public/bhajan.mp3 + public/bhajan.json (~60s): TTS recitation of public-domain Tulsidas verses over a synthesized drone."""
import asyncio, json, subprocess, wave, math, os, edge_tts
import numpy as np

LINES = [
    "श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि।",
    "बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि॥",
    "बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।",
    "बल बुद्धि बिद्या देहु मोहिं, हरहु कलेस बिकार॥",
    "जय हनुमान ज्ञान गुन सागर।",
    "जय कपीस तिहुँ लोक उजागर॥",
    "राम दूत अतुलित बल धामा।",
    "अंजनि-पुत्र पवनसुत नामा॥",
    "महाबीर बिक्रम बजरंगी।",
    "कुमति निवार सुमति के संगी॥",
]
TITLE, TOTAL, INTRO, OUTRO = "हनुमान चालीसा", 60.0, 3.0, 2.5
os.makedirs("tools/tmp", exist_ok=True)

async def tts(i, text):
    p = f"tools/tmp/l{i}.mp3"
    await edge_tts.Communicate(text, "hi-IN-MadhurNeural", rate="-18%").save(p)
    return p

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))

async def main():
    files = [await tts(i, t) for i, t in enumerate(LINES)]
    ds = [dur(f) for f in files]
    gap = max(0.4, (TOTAL - INTRO - OUTRO - sum(ds)) / len(LINES))
    # ponytail: gap stretches/shrinks to hit TOTAL; if speech alone exceeds it, video runs longer than 60s
    t, lines, filt, ins = INTRO, [], [], []
    for i, (f, d, txt) in enumerate(zip(files, ds, LINES)):
        lines.append({"start": round(t, 2), "end": round(t + d + gap, 2), "text": txt})
        ins += ["-i", f]; filt.append(f"[{i}:a]adelay={int(t*1000)}|{int(t*1000)}[a{i}]")
        t += d + gap
    total = max(TOTAL, t + OUTRO)
    mix = "".join(f"[a{i}]" for i in range(len(files))) + f"amix=inputs={len(files)}:normalize=0[v]"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", ";".join(filt) + ";" + mix, "-map", "[v]", "tools/tmp/voice.wav"], check=True)
    # tanpura-ish drone: Pa-Sa-Sa-Sa pluck loop, harmonics + slow decay
    sr, sa = 44100, 138.59
    n = int(sr * (total + 1)); sig = np.zeros(n)
    for k, (mult, off) in enumerate([(1.5, 0.0), (2.0, 1.0), (2.0, 2.0), (1.0, 3.0)] * int(total // 4 + 2)):
        s = int((k // 4 * 4 + off) * sr) if False else int((k * 1.0) * sr)
        if s >= n: break
        L = min(n - s, int(sr * 3.2)); x = np.arange(L) / sr
        f0 = sa * mult
        w = sum(np.sin(2 * math.pi * f0 * h * x) / h ** 1.3 for h in range(1, 9)) * np.exp(-x * 0.9)
        sig[s:s + L] += w
    sig = sig / np.abs(sig).max() * 0.35
    with wave.open("tools/tmp/drone.wav", "w") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes((sig * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "tools/tmp/voice.wav", "-i", "tools/tmp/drone.wav",
        "-filter_complex", "[1:a]volume=0.55,aecho=0.6:0.5:120:0.25[d];[0:a][d]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[o]",
        "-map", "[o]", "-t", str(total), "-b:a", "192k", "public/bhajan.mp3"], check=True)
    json.dump({"title": TITLE, "total": round(total, 2), "lines": lines}, open("public/bhajan.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("done", round(total, 1), "s, gap", round(gap, 2))

asyncio.run(main())
