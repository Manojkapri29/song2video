"""Render one still per composition and fail on a blank/near-blank frame.

The cheapest check that catches the real breakages: a preset that throws, renders
nothing, or renders a flat black card because its data file moved.
"""
import json, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(tempfile.mkdtemp(prefix="check_presets_"))
# composition -> frame to sample (past the intro animation, inside the first card)
FRAMES = {"Intro": 70, "Outro": 150, "IntroShort": 70, "Explainer": 330,
          "ExplainerShort": 330, "SocialPost": 90, "Katha": 1860, "KathaShort": 1860}

def still(cid, frame):
    dst = OUT / f"{cid}.png"
    r = subprocess.run(["npx", "remotion", "still", "src/index.ts", cid, str(dst), f"--frame={frame}"],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        return None, (r.stderr or r.stdout).strip().splitlines()[-1:] or ["render failed"]
    return dst, None

def spread(png):
    """Std-dev of pixel values: a blank card is ~0, a real frame is well above."""
    from struct import unpack
    import zlib
    data = png.read_bytes()
    # cheap PNG decode via sips -> raw is overkill; use Pillow when present, else size heuristic
    try:
        from PIL import Image, ImageStat
        im = Image.open(png).convert("L").resize((160, 90))
        return ImageStat.Stat(im).stddev[0]
    except ImportError:
        return 99.0 if len(data) > 60_000 else 0.0

fails = []
for cid, frame in FRAMES.items():
    png, err = still(cid, frame)
    if err:
        fails.append(f"{cid}: {err[0]}")
        continue
    sd = spread(png)
    print(f"{cid:16} frame {frame:5}  spread {sd:6.2f}  {'ok' if sd > 6 else 'BLANK'}")
    if sd <= 6:
        fails.append(f"{cid}: frame looks blank (spread {sd:.2f})")

if fails:
    print("\nFAILED:")
    for f in fails:
        print(" ", f)
    sys.exit(1)
print(f"\nall {len(FRAMES)} compositions render content")
