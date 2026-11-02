"""Narrate an explainer script: one Hindi TTS clip per card, joined into one track.

Reads public/nalanda/script.json (each card has a `say` line), writes
public/nalanda/vo_<i>.mp3 per card, public/nalanda/vo.mp3 for the whole video,
and public/nalanda/props.json with each card's `dur` set to its clip length.

Free: edge-tts (Microsoft neural voices, no key). Run: python3 tools/nalanda_vo.py
"""
import asyncio, json, pathlib, subprocess, sys
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
# usage: python3 tools/nalanda_vo.py [folder under public/]  (default: nalanda)
FOLDER = sys.argv[1] if len(sys.argv) > 1 else "nalanda"
OUT = ROOT / "public" / FOLDER
VOICE = "hi-IN-MadhurNeural"
GAP = 0.6  # silence after each card's narration, seconds


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


async def synth(text, path):
    await edge_tts.Communicate(text, VOICE, rate="-4%").save(str(path))


async def main():
    script = json.loads((OUT / "script.json").read_text(encoding="utf-8"))
    cards, parts = [], []
    for i, card in enumerate(script["cards"]):
        clip = OUT / f"vo_{i}.mp3"
        await synth(card["say"], clip)
        dur = round(duration(clip) + GAP, 2)
        silence = OUT / f"gap_{i}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
                        "anullsrc=r=24000:cl=mono", "-t", str(GAP), str(silence)], check=True)
        parts += [clip, silence]
        clean = {k: v for k, v in card.items() if k != "say"}
        clean["dur"] = dur
        cards.append(clean)
        print(f"card {i}: {dur}s  {card['text'][:30]}")

    listing = OUT / "concat.txt"
    listing.write_text("".join(f"file '{p.name}'\n" for p in parts), encoding="utf-8")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i",
                    str(listing), "-c:a", "libmp3lame", "-q:a", "3", str(OUT / "vo.mp3")],
                   check=True, cwd=OUT)
    for p in parts:
        p.unlink()
    listing.unlink()

    props = {"tag": script["tag"], "theme": script["theme"], "audio": f"{FOLDER}/vo.mp3", "cards": cards}
    (OUT / "props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(c["dur"] for c in cards)
    print(f"total {total:.1f}s  -> {OUT / 'vo.mp3'}")


if __name__ == "__main__":
    asyncio.run(main())
