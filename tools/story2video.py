#!/usr/bin/env python3
"""Text in, narrated cinematic explainer out. Every step is local and free.

    python3 tools/story2video.py notes.txt --slug trial --style storybook
    python3 tools/story2video.py notes.txt --slug trial --no-images   # layout test, no FLUX

Each blank-line-separated paragraph of the input becomes one scene:
  narration  macOS `say` -> mp3 (its length sets the scene length)
  picture    FLUX in the chosen style (or a flat grey stand-in with --no-images)
  depth      tools/depthmap.py, so the still gets the 2.5D parallax camera
Then it writes public/story/<slug>.json and renders the Remotion `Story` composition.
"""
import argparse, json, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from song2video import flux, sh  # noqa: E402  (same FLUX + retry path as the song builder)

STYLES = {
    "storybook": "children's storybook illustration, hand-painted watercolor, warm soft light, "
                 "gentle paper texture",
    "3d": "3D rendered cinematic scene, high-end CGI render, volumetric light, shallow depth "
          "of field, ultra detailed",
    "cinematic": "cinematic film still, photoreal, 35mm lens, dramatic natural lighting, "
                 "anamorphic bokeh",
}
SUFFIX = ", wide 16:9 composition, no text, no letters, no watermark"


def scenes_from(text):
    """One scene per paragraph. A line that is just '---' also separates scenes."""
    parts = re.split(r"\n\s*\n|^\s*---\s*$", text, flags=re.M)
    return [" ".join(p.split()) for p in parts if p.strip()]


def audio_seconds(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def narrate(line, voice, aiff, mp3):
    sh(["say", "-v", voice, "-o", str(aiff), line], quiet=True)
    sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff), "-codec:a", "libmp3lame",
        "-q:a", "4", str(mp3)])
    aiff.unlink()
    return audio_seconds(mp3)


def placeholder(dst, size):
    """Flat grey still and matching depth map. Layout checks only; no parallax shows."""
    w, h = size.split("x")
    sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
        f"color=c=0x6b5a48:s={w}x{h}", "-frames:v", "1", str(dst)])


def placeholder_depth(dst, size):
    w, h = size.split("x")
    sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
        f"color=c=0x808080:s={w}x{h}", "-frames:v", "1", str(dst)])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script", help="text file, one paragraph per scene")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--style", choices=sorted(STYLES), default="storybook")
    ap.add_argument("--voice", default="Samantha", help="`say -v ?` lists voices")
    ap.add_argument("--size", default="1280x720", help="FLUX still size")
    ap.add_argument("--min-seconds", type=float, default=4.0)
    ap.add_argument("--no-images", action="store_true", help="grey stand-ins, no FLUX")
    ap.add_argument("--render", action="store_true", help="render out/<slug>.mp4 with Remotion")
    a = ap.parse_args()

    scenes = scenes_from(Path(a.script).read_text(encoding="utf-8"))
    if not scenes:
        sys.exit("no scenes: the file is empty")
    base = ROOT / "public" / "story" / a.slug
    base.mkdir(parents=True, exist_ok=True)
    print(f"{len(scenes)} scenes -> {base}", flush=True)

    out = []
    for i, line in enumerate(scenes, 1):
        tag = f"{i:02d}"
        print(f"[{tag}] narrate", flush=True)
        dur = narrate(line, a.voice, base / f"{tag}.aiff", base / f"{tag}.mp3")
        img, dep = base / f"{tag}.png", base / f"{tag}.depth.png"
        if a.no_images:
            placeholder(img, a.size)
            placeholder_depth(dep, a.size)
        else:
            print(f"[{tag}] picture", flush=True)
            flux(line + STYLES[a.style] + SUFFIX, img, a.size)
        out.append({
            "img": f"story/{a.slug}/{tag}.png",
            "depth": f"story/{a.slug}/{tag}.depth.png",
            "audio": f"story/{a.slug}/{tag}.mp3",
            "dur": round(max(dur + 0.6, a.min_seconds), 2),
            "text": line,
        })

    if not a.no_images:
        print("depth maps", flush=True)
        sh([sys.executable, str(ROOT / "tools/depthmap.py"), str(base)], cwd=ROOT)

    props = ROOT / "public" / "story" / f"{a.slug}.json"
    props.write_text(json.dumps({"scenes": out, "theme": "katha"}, ensure_ascii=False, indent=1),
                     encoding="utf-8")
    total = sum(s["dur"] for s in out)
    print(f"wrote {props} ({total:.1f}s)", flush=True)

    if a.render:
        dst = ROOT / "out" / f"{a.slug}.mp4"
        npx = shutil.which("npx") or "npx"
        sh([npx, "remotion", "render", "src/index.ts", "Story", str(dst),
            f"--props={props}"], cwd=ROOT)
        print(f"rendered {dst}", flush=True)


if __name__ == "__main__":
    main()
