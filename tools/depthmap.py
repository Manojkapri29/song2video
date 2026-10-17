#!/usr/bin/env python
"""Depth map per scene image, for the 2.5D parallax backdrop.

  python tools/depthmap.py public/img/pahadi          # whole folder
  python tools/depthmap.py public/img/pahadi/03.png   # one image

Writes <name>.depth.png beside each source: 8-bit grayscale, white = near.
Runs Depth Anything V2 Small locally on MPS (free, ~2 s per image).
"""
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

MODEL = "depth-anything/Depth-Anything-V2-Small-hf"
SUFFIX = ".depth.png"


def targets(arg):
    p = Path(arg).expanduser()
    if p.is_dir():
        return sorted(f for f in p.glob("*.png") if not f.name.endswith(SUFFIX))
    return [p]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    files = [f for a in sys.argv[1:] for f in targets(a)]
    todo = [f for f in files if not f.with_suffix("").with_suffix(SUFFIX).exists()]
    if not todo:
        print(f"{len(files)} image(s), all depth maps present")
        return

    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    proc = AutoImageProcessor.from_pretrained(MODEL)
    model = AutoModelForDepthEstimation.from_pretrained(MODEL).to(dev).eval()

    for f in todo:
        img = Image.open(f).convert("RGB")
        with torch.no_grad():
            out = model(**proc(images=img, return_tensors="pt").to(dev)).predicted_depth
        d = torch.nn.functional.interpolate(
            out[:, None], size=img.size[::-1], mode="bicubic", align_corners=False
        )[0, 0].float().cpu().numpy()
        lo, hi = np.percentile(d, 1), np.percentile(d, 99)   # clip outliers, or one pixel eats the range
        d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
        dst = f.with_suffix("").with_suffix(SUFFIX)
        Image.fromarray((d * 255).astype("uint8")).save(dst)
        print(f"  {dst.name}")

    print(f"{len(todo)} depth map(s) written")


if __name__ == "__main__":
    main()


def _demo():
    """assert the normalisation keeps the full 0..255 range and orientation (white = near)."""
    d = np.array([[0.0, 5.0], [10.0, 100.0]])
    lo, hi = np.percentile(d, 1), np.percentile(d, 99)
    n = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
    assert n.min() == 0.0 and n.max() == 1.0, n
    assert n[1, 1] > n[0, 0]
