#!/usr/bin/env python3
"""Twelve storybook panels for the Pahadi song, generated with local FLUX schnell.

    python3 tools/pahadi_panels.py            # generate everything still missing
    python3 tools/pahadi_panels.py --only 3   # just panel 3, to test the look

Why the RAM check up front: FLUX schnell Q4 plus the T5 encoder needs roughly 11GB resident.
On a 16GB Mac with a browser open it does not get that, swaps, and then produces nothing at
all for an hour instead of failing. So this refuses to start rather than wasting the evening.
"""
import argparse, shutil, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "public" / "pahadi"
AI = Path.home() / "AI-Studio"
NEED_GB = 6.5          # floor for schnell Q4 + t5 Q5 at 1024x576 with ComfyUI --lowvram

STYLE = (
    "children's storybook illustration, hand-painted gouache on textured paper, "
    "Indian folk art influence, soft flat washes, delicate ink linework, warm and tender, "
    "visible paper grain, gentle grain and brush texture, cinematic wide composition, "
    "no text, no words, no letters, no watermark, no signature, no frame, no border"
)

PANELS = [
    ("dawn", "first light breaking over immense snow-covered Himalayan peaks, thick mist filling "
             "the valleys below, a thin trail of pink cloud, pine silhouettes in the foreground"),
    ("village", "a small Kumaoni hill village of slate-roofed stone houses waking at morning, "
                "thin woodsmoke rising from chimneys, terraced fields falling away below, pine trees"),
    ("terrace", "a young Pahadi woman in a traditional ghagra walking a narrow path between green "
                "terraced fields, a copper water pot balanced on her head, mountains behind her"),
    ("buransh", "a hillside forest of rhododendron trees in full crimson bloom, buransh flowers "
                "everywhere, dappled light, a narrow earth path winding through the red canopy"),
    ("flute", "a young Pahadi shepherd sitting on a grassy mountain ridge playing a bamboo bansuri, "
              "a few sheep grazing around him, wide valley and snow peaks beyond"),
    ("glance", "a young man and a young woman catching sight of each other across green terraced "
               "fields on a Himalayan hillside, distance between them, soft afternoon light"),
    ("pines", "a path through a tall deodar pine forest in the Kumaon hills, shafts of light "
              "between the trunks, two small figures walking the path, soft green shadow"),
    ("lamps", "a Himalayan village at dusk, warm oil lamps glowing in the windows of slate-roofed "
              "houses, the snow peaks behind turning gold and violet, first stars appearing"),
    ("river", "a clear mountain stream in a Himalayan valley crossed by an old wooden bridge strung "
              "with colourful prayer flags, smooth boulders, pines on both banks"),
    ("monsoon", "heavy monsoon clouds rolling over Himalayan peaks, rain falling in soft grey sheets "
                "on the slate roofs of a hill village, mist, wet green terraces"),
    ("stars", "a clear Himalayan night, the Milky Way blazing over snow peaks, two tiny warm lantern "
              "lights on a dark ridge below, deep indigo sky"),
    ("sunrise", "sunrise over the Himalaya, two small figures standing together on a ridge in "
                "silhouette against a vast golden sky, rhododendron blossoms in the foreground"),
]


def free_gb() -> float:
    """Reclaimable RAM. Apple silicon reports 16K pages, so never hardcode 4096 here."""
    out = subprocess.run(["vm_stat"], capture_output=True, text=True).stdout
    size = 4096
    first = out.splitlines()[0]
    if "page size of" in first:
        size = int(first.split("page size of")[1].split()[0])
    pages = 0
    for key in ("Pages free", "Pages inactive", "Pages speculative"):
        for line in out.splitlines():
            if line.startswith(key):
                pages += int(line.split(":")[1].strip().rstrip("."))
    return pages * size / 1024 ** 3


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", type=int, help="1-based panel number")
    ap.add_argument("--size", default="1024x576")
    ap.add_argument("--force", action="store_true", help="skip the free-RAM check")
    args = ap.parse_args()

    have = free_gb()
    if have < NEED_GB and not args.force:
        sys.exit(f"sirf {have:.1f} GB RAM free hai, FLUX ko ~{NEED_GB} GB chahiye.\n"
                 "Chrome aur baaki apps band karke dobara chalao (ya --force).")

    sys.path.insert(0, str(AI))
    from api import comfy_client as cc, workflows as wf   # noqa: E402

    w, h = (int(v) for v in args.size.split("x"))
    DEST.mkdir(parents=True, exist_ok=True)
    todo = list(enumerate(PANELS, 1))
    if args.only:
        todo = [t for t in todo if t[0] == args.only]

    for n, (tag, prompt) in todo:
        dest = DEST / f"{n:02d}_{tag}.png"
        if dest.exists() and not args.only:
            print(f"[{tag}] already have it", flush=True)
            continue
        t0 = time.time()
        job = wf.flux_t2i(f"{prompt}, {STYLE}", width=w, height=h, steps=4,
                          prefix=f"images/pb_{n:02d}_{tag}", batch=1)
        try:
            res = cc.wait(cc.submit(job), timeout=900, poll=5)
        except Exception as e:                                    # noqa: BLE001
            print(f"[{tag}] ERROR {e} {int(time.time() - t0)}s", flush=True)
            continue
        if res["status"] != "done" or not res.get("files"):
            print(f"[{tag}] FAIL {res['status']} {res.get('error') or ''} "
                  f"{int(time.time() - t0)}s", flush=True)
            continue
        shutil.copy(cc.OUTPUT / res["files"][0], dest)
        print(f"[{tag}] {dest.name} {int(time.time() - t0)}s  (RAM free {free_gb():.1f} GB)", flush=True)

    made = sorted(DEST.glob("*.png"))
    print(f"DONE {len(made)}/{len(PANELS)} panels in {DEST}")


if __name__ == "__main__":
    main()
