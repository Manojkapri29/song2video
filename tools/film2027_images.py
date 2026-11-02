"""Scene stills for the 2027 film, written to public/img/film2027/<name>.png. Resumable."""
import glob, os, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AI = Path.home() / "AI-Studio"
OUT = ROOT / "public/img/film2027"
TAIL = ", cinematic, photoreal, dramatic light, no text, no people's faces, 16:9"
JOBS = {
    "grantha": "ancient palm-leaf manuscript bundle glowing in a dark temple, golden light, mystical" + TAIL,
    "sages": "silhouette of sages meditating on a snowy mountain peak under a starry sky, mystical" + TAIL,
    "drought": "cracked dry earth at sunset under heat haze, dead crops, desolate landscape" + TAIL,
    "kalki": "mythic warrior on a white horse under a comet in a stormy sky, painted illustration, gold light, no weapons logos" + TAIL,
    "gate": "ancient stone door slightly open with golden light spilling out, mysterious atmosphere" + TAIL,
    "globe": "abstract glowing globe network with fractured light lines, dark background, uneasy tension" + TAIL,
}

def gen(name: str, prompt: str) -> None:
    dst = OUT / f"{name}.png"
    if dst.exists():
        return
    before = set(glob.glob(str(AI / "output/**/*.png"), recursive=True))
    subprocess.run([sys.executable, "scripts/generate_image.py", "--prompt", prompt,
                    "--width", "1024", "--height", "576", "--steps", "4"], cwd=AI, check=True)
    new = sorted(set(glob.glob(str(AI / "output/**/*.png"), recursive=True)) - before, key=os.path.getmtime)
    if not new:
        sys.exit(f"no output for {name}")
    shutil.copy(new[-1], dst)
    print("saved", dst, flush=True)

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for n, p in JOBS.items():
        if n in ("grantha", "sages", "drought", "kalki"):
            gen(n, p)
