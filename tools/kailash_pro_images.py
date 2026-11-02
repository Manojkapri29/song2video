"""usage: kailash_pro_images.py -> public/img/kailash_pro/NN.png, one realistic still per story beat.

FLUX schnell via ~/AI-Studio (ComfyUI must be running). Resume-safe: existing NN.png are skipped.
Generic landscape and ritual scenes only. No photoreal people or real events.
"""
import glob, os, shutil, subprocess, sys
from pathlib import Path

AI = Path.home() / "AI-Studio"
OUT = Path("public/img/kailash_pro")
STYLE = ", photographic, natural light, 35mm lens, realistic colour, no text, no watermark"

PROMPTS = [
    "Mount Kailash pyramid peak at first light, Tibetan plateau in foreground, thin cloud across the summit" + STYLE,
    "vast empty Tibetan plateau under a huge sky, lenticular clouds over snow ridges, aerial wide shot" + STYLE,
    "north face of Mount Kailash at dusk, snow streaks on the black rock, aerial telephoto" + STYLE,
    "prayer flags on a high mountain pass, Kailash peak behind, wind blowing, late afternoon" + STYLE,
    "south face of Kailash with a vertical snow scar, seen across a frozen plain, enormous scale" + STYLE,
    "mountain peak breaking through twilight clouds, shafts of light, rest of the valley in blue shadow" + STYLE,
    "frozen high-altitude lake with ice formations on the shore, clear blue sky" + STYLE,
    "stone path winding up a barren hillside at dawn, a few prayer flags, snow patches" + STYLE,
    "open snowfield under wind, drifting powder, a bare rocky ridge in the distance, nothing built" + STYLE,
    "Mansarovar lake, turquoise water, calm shoreline, Kailash faintly behind the mist" + STYLE,
    "two high-altitude lakes side by side from above, one clear and one dark green, Himalayan plateau" + STYLE,
    "misty mountain valley with a single dark rock spire, dramatic cloud layers, muted colours" + STYLE,
    "stone cairn of carved mani stones beside a pilgrim trail, Himalayan peaks in the background" + STYLE,
    "interior of a small Himalayan shrine, butter lamps glowing, carved stone, warm light" + STYLE,
    "night sky over a high Himalayan plateau, dense Milky Way, mountain silhouette" + STYLE,
    "close-up of a stone sundial on a mountain ledge, long shadow across snow, late afternoon" + STYLE,
    "snow-covered mountain face in blue hour, fresh snow, crisp detail" + STYLE,
    "frozen lake surface with cracks in the ice, wind-blown snow, distant peaks" + STYLE,
    "sunrise over a high mountain range, golden light hitting the summit, clouds below" + STYLE,
    "starry sky above a sacred mountain at night, long exposure, the peak as a dark shape" + STYLE,
]


def gen(i: int, prompt: str) -> None:
    dst = OUT / f"{i:02d}.png"
    if dst.exists():
        return
    before = set(glob.glob(str(AI / "output/**/*.png"), recursive=True))
    subprocess.run([sys.executable, "scripts/generate_image.py", "--prompt", prompt,
                    "--width", "1024", "--height", "576", "--steps", "4"], cwd=AI, check=True)
    new = sorted(set(glob.glob(str(AI / "output/**/*.png"), recursive=True)) - before, key=os.path.getmtime)
    if not new:
        sys.exit(f"no output for beat {i}")
    shutil.copy(new[-1], dst)
    print("saved", dst, flush=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for i, p in enumerate(PROMPTS):
        gen(i, p)
    print("done", flush=True)
