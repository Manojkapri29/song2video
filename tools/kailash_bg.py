"""Fill public/img/kailash with stills for the Kailash film. Resumable: skips existing NN.png."""
import glob, os, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AI = Path.home() / "AI-Studio"
OUT = ROOT / "public/img/kailash"
PROMPTS = (ROOT / "tools/kailash.prompts.txt").read_text(encoding="utf-8").splitlines()
PROMPTS = [p for p in PROMPTS if p.strip() and not p.startswith("#")]

for i, prompt in enumerate(PROMPTS[4:12], start=5):
    dst = OUT / f"{i:02d}.png"
    if dst.exists():
        continue
    before = set(glob.glob(str(AI / "output/**/*.png"), recursive=True))
    subprocess.run([sys.executable, "scripts/generate_image.py", "--prompt", prompt,
                    "--width", "1024", "--height", "576", "--steps", "4"], cwd=AI, check=True)
    new = sorted(set(glob.glob(str(AI / "output/**/*.png"), recursive=True)) - before, key=os.path.getmtime)
    if not new:
        sys.exit(f"no output for scene {i:02d}")
    shutil.copy(new[-1], dst)
    print("saved", dst, flush=True)
