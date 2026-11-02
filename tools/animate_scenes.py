"""Still scenes -> short animated clips, so the picture moves instead of sliding.

The depth-map parallax in song2video gives a still a camera push. That is not the same
thing as the characters moving: for a 2D animated story video the people have to turn,
gesture and speak. This runs Wan 2.1 Fun-InP over each already-generated FLUX still, so
scene 03.png becomes 03.mp4 with the first frame unchanged, and `scenetrack` then picks
the clip up by extension without any further wiring.

    python3 tools/animate_scenes.py public/img/<slug> --prompts tools/scene_prompts.txt

A prompt line may carry its own motion after a `|`:

    old spy in a Karachi tea stall, worn kurta, ... | he lifts the cup slowly, eyes flicking to the door

Without one, a quiet default is used. Wan reads motion, not composition, so the motion
half should say what MOVES, never what the shot looks like -- the still already settled
that, and repeating it makes the model redraw the frame instead of animating it.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import shutil
import subprocess
import urllib.request
import sys
import time
from pathlib import Path

AI = Path.home() / "AI-Studio"

# Wan 2.1 Fun-InP wants 4n+1 frames at 16 fps; 33 is ~2.1s, 49 is ~3.1s.
DEFAULT_FRAMES = 49
DEFAULT_MOTION = (
    "subtle natural motion, the subject breathes and shifts weight slightly, "
    "cloth and hair move gently, slow drifting camera, firelight flickering"
)


def split_motion(line: str) -> tuple[str, str]:
    """A prompt line -> (look, motion). The motion half is optional."""
    look, _, motion = line.partition("|")
    return look.strip(), motion.strip() or DEFAULT_MOTION


def read_prompts(path: Path) -> list[str]:
    return [l.strip() for l in path.read_text(encoding="utf-8").splitlines()
            if l.strip() and not l.strip().startswith("#")]


SAVED_RE = re.compile(r"^\[image-to-video\] saved (.+\.mp4)\s*$", re.MULTILINE)


def saved_clip(stdout: str) -> Path | None:
    """The clip Wan wrote, taken from the path it printed.

    Picking the newest mp4 by mtime instead looks equivalent and is not: a job whose waiter
    was killed keeps running inside ComfyUI and lands its clip minutes later, and the next
    scene then adopts that orphan as its own. That really happened -- scene 07 ended up
    holding a clip of a different still -- so the only safe source is the path the run itself
    reports.
    """
    m = SAVED_RE.search(stdout)
    if not m:
        return None
    p = Path(m.group(1).strip())
    return p if p.exists() else None


def animate(still: Path, dst: Path, motion: str, frames: int, size: str, steps: int,
            tries: int = 2) -> bool:
    """One still -> one clip. Returns False if Wan never produced a file."""
    w, h = (int(x) for x in size.split("x"))
    py = AI / ".venv/bin/python"
    py = str(py) if py.exists() else sys.executable
    for attempt in range(1, tries + 1):
        run = subprocess.run(
            [py, "scripts/image_to_video.py", "--input", str(still), "--prompt", motion,
             "--width", str(w), "--height", str(h), "--frames", str(frames),
             "--steps", str(steps)],
            cwd=AI, check=False, text=True,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        )
        print(run.stdout.strip()[-400:], flush=True)
        got = saved_clip(run.stdout) if run.returncode == 0 else None
        if got:
            shutil.move(str(got), dst)
            return True
        if attempt < tries:
            # Same failure mode as FLUX on a 16 GB Mac: ComfyUI gets OOM-killed mid-batch.
            print(f"     attempt {attempt} produced nothing, restarting ComfyUI", flush=True)
            restart_comfy()
    return False


def comfy_up() -> bool:
    try:
        with urllib.request.urlopen("http://127.0.0.1:8188/system_stats", timeout=5):
            return True
    except Exception:
        return False


def restart_comfy(wait: int = 300) -> bool:
    """Stop ComfyUI and bring it back up before the next attempt.

    Stopping alone used to be the whole recovery, which is no recovery at all: nothing started
    it again, so every remaining scene failed instantly on `Connection refused` and a run that
    hit one bad clip at 02:30 wrote nothing for the rest of the night. The restart is detached
    because a child would die with this script.
    """
    subprocess.run([str(AI / "launcher/stop-comfy.sh")],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    time.sleep(10)
    subprocess.Popen([str(AI / "launcher/start-comfy.sh")],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                     stdin=subprocess.DEVNULL, start_new_session=True)
    for _ in range(wait // 10):
        if comfy_up():
            print("     ComfyUI back up", flush=True)
            return True
        time.sleep(10)
    print("     ComfyUI did not come back up", flush=True)
    return False


def selftest() -> None:
    assert split_motion("a temple at night") == ("a temple at night", DEFAULT_MOTION)
    assert split_motion("a temple | he turns") == ("a temple", "he turns")
    assert split_motion("a temple |   ") == ("a temple", DEFAULT_MOTION)
    look, motion = split_motion("  spaced  |  walks away  ")
    assert (look, motion) == ("spaced", "walks away"), (look, motion)

    # the misattribution guard: a clip is claimed only from the path the run printed
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        real = pathlib.Path(d) / "wan_i2v_00007_.mp4"
        real.write_bytes(b"x")
        assert saved_clip(f"[image-to-video] queued abc\n[image-to-video] saved {real}\n") == real
        assert saved_clip("[image-to-video] queued abc\n[image-to-video] running 3s\n") is None
        assert saved_clip(f"[image-to-video] saved {real}-gone\n") is None
    print("selftest ok")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("imgdir", nargs="?", help="public/img/<slug>, the folder `scenes` filled")
    ap.add_argument("--prompts", help="the same scene list used to generate the stills; "
                                      "without it every scene gets the default motion")
    ap.add_argument("--frames", type=int, default=DEFAULT_FRAMES,
                    help="4n+1 at 16 fps: 33 is ~2.1s, 49 ~3.1s, 81 ~5.1s")
    ap.add_argument("--size", default="480x832",
                    help="Wan's own working size, not the still's; 832x480 for landscape")
    ap.add_argument("--steps", type=int, default=8,
                    help="image_to_video.py defaults to 20, which measured 167 s/step on this "
                         "Mac (56 min for one clip); 8 is the usable end of that trade")
    ap.add_argument("--only", help="comma-separated scene numbers, e.g. 03,07")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        selftest()
        return 0
    if not a.imgdir:
        ap.error("imgdir is required")

    # image_to_video.py runs with cwd=~/AI-Studio, so a relative still path never resolves there
    imgdir = Path(a.imgdir).expanduser().resolve()
    if not imgdir.is_dir():
        raise SystemExit(f"no such folder: {imgdir}")
    prompts = read_prompts(Path(a.prompts).expanduser()) if a.prompts else []

    stills = sorted(imgdir.glob("[0-9][0-9].png"))
    if not stills:
        raise SystemExit(f"{imgdir} has no NN.png stills yet. Run `song2video.py scenes` first.")
    if prompts and len(prompts) < len(stills):
        raise SystemExit(f"{len(stills)} stills but only {len(prompts)} prompt lines")

    want = {s.strip().zfill(2) for s in a.only.split(",")} if a.only else None
    todo = [s for s in stills
            if (want is None or s.stem in want) and not s.with_suffix(".mp4").exists()]

    print(f"{len(stills)} stills, {len(todo)} to animate at {a.frames} frames / {a.steps} steps "
          f"(~{a.frames / 16:.1f}s of footage each, ~10 min per clip on a 16 GB Mac)", flush=True)

    failed = []
    for still in todo:
        i = int(still.stem) - 1
        motion = split_motion(prompts[i])[1] if 0 <= i < len(prompts) else DEFAULT_MOTION
        print(f"  {still.stem} {motion[:66]}", flush=True)
        if not animate(still, still.with_suffix(".mp4"), motion, a.frames, a.size, a.steps):
            failed.append(still.stem)
            print(f"  {still.stem} FAILED, leaving the still in place", flush=True)

    done = sorted(p.stem for p in imgdir.glob("[0-9][0-9].mp4"))
    print(f"\n{len(done)} of {len(stills)} scenes animated: {', '.join(done) or 'none'}")
    if failed:
        print(f"failed: {', '.join(failed)} — these stay stills, which still render fine")
    print("Now re-run `song2video.py scenetrack` and it will pick the clips up.")
    return 1 if failed and len(failed) == len(todo) else 0


if __name__ == "__main__":
    sys.exit(main())
