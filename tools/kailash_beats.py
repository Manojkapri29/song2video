"""Content-specific stills for the Kailash film, one per explained beat. Resumable.

    python3 tools/kailash_beats.py            # generate every missing image
Each image is written to public/img/kailash/beat_<name>.png and named in kailash_film.json.
"""
import glob, os, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AI = Path.home() / "AI-Studio"
OUT = ROOT / "public/img/kailash"
STYLE = ", cinematic, photoreal, dramatic light, no text, no people's faces, 16:9"

JOBS = {
    "mansarovar": "Lake Manasarovar at dawn, turquoise freshwater, calm mirror surface, Himalayan peaks around it" + STYLE,
    "rakshastal": "Rakshastal lake, dark brackish water, grey salt crust on shore, ominous still lake under overcast sky, Tibetan plateau" + STYLE,
    "ashtapad": "Ancient Jain temple on a mountain, eight tiers stepped mountain Ashtapad, weathered stone steps, misty valley" + STYLE,
    "meru": "Golden mountain Mount Meru rising from clouds, cosmic light rays, sacred Hindu mountain symbol, painted atmosphere" + STYLE,
    "kora": "Pilgrims walking the kora circuit around a sacred snow mountain, prayer wheels on stone path, sunrise, rear views only" + STYLE,
    "ravana": "Ravana lifting Mount Kailash in a mythological painting, Indian miniature art style, dramatic clouds, gold and deep red" + STYLE,
    "crystal": "Crystal palace of ice and jewels on a mountain plateau, glowing translucent walls, fantasy realism" + STYLE,
    "compass": "Mountain shadow and magnetic compass needle spinning, top-down aerial of a snowy peak, mysterious blue light" + STYLE,
}

KEEP = {"meru", "mansarovar", "ravana", "compass"}  # cut to 4 for time

def gen(name: str, prompt: str) -> None:
    dst = OUT / f"beat_{name}.png"
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
    for n, p in JOBS.items():
        if n in KEEP:
            gen(n, p)
