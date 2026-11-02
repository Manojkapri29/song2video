"""usage: kailash_vox_images.py -> public/img/kailash_vox/NN.png, one collage still per beat.

Reads tools/kailash_vox_prompts.txt (lines "[NN] prompt"), adds the paper-collage STYLE LOCK,
and runs FLUX schnell through ~/AI-Studio (ComfyUI must be running). Resume-safe: existing
NN.png are skipped. Prompts stay faceless and text-free.
"""
import glob, os, re, shutil, subprocess, sys
from pathlib import Path

AI = Path.home() / "AI-Studio"
OUT = Path("public/img/kailash_vox")
SRC = Path("tools/kailash_vox_prompts.txt")
STYLE = ("scissor cut documentary paper collage on aged newsprint, monochrome halftone cutouts, "
         "ragged hand cut edges, soft cutout drop shadows, tan and ink black with one red accent, "
         "flat even lighting, matte, 16:9, no text, no watermark, no faces")

LINE = re.compile(r"^\[(\d{2})\]\s+(.*\S)\s*$")


def prompts() -> list[tuple[int, str]]:
    out = []
    for raw in SRC.read_text(encoding="utf-8").splitlines():
        m = LINE.match(raw)
        if m:
            out.append((int(m.group(1)), m.group(2) + ", " + STYLE))
    return out


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


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    todo = prompts()
    print(f"{len(todo)} collage prompts from {SRC}", flush=True)
    for i, p in todo:
        gen(i, p)
    print("done", flush=True)


if __name__ == "__main__":
    main()
