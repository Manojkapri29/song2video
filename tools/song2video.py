#!/usr/bin/env python3
"""Turn a music MP4/MP3 into a premium lyric motion-graphics video.

  python tools/song2video.py prepare song.mp4 --title "..." [--lyrics lyrics.txt]
  python tools/song2video.py scenes  <slug> --prompts scenes.txt    [--size 1024x576]
  python tools/song2video.py scenetrack <slug> --prompts scenes.txt --set v2 [--media dir]
  python tools/song2video.py render  <slug> [--short] [--preview]

prepare  extracts the audio, isolates the vocals, finds what is ACTUALLY sung and where the
         instrumental gaps are, and writes out/<slug>.props.json plus out/<slug>.scenes.todo.txt.
scenes   generates one background per prompt with local FLUX and attaches them to the lines.
scenetrack cuts the picture every few seconds on its own clock. Each line of the scene list is
         either a FLUX prompt or @name for one of your own stills/clips from --media.
render   checks a still, then renders 1920x1080 (and 1080x1920 with --short).

Why the split: picking scene imagery from lyrics is a judgement call, so the agent writes the
prompt list between `prepare` and `scenes`. Everything else is mechanical and lives here.
"""
import argparse, json, re, shutil, subprocess, sys, time, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
OUT = ROOT / "out"
WORK = ROOT / ".song2video"
AI = Path.home() / "AI-Studio"
FPS = 30


def sh(cmd, **kw):
    r = subprocess.run(cmd, cwd=kw.pop("cwd", ROOT), text=True,
                       capture_output=kw.pop("quiet", False), **kw)
    if r.returncode != 0:
        out = (r.stderr or r.stdout or "").strip().splitlines()[-3:]
        sys.exit(f"FAILED: {' '.join(str(c) for c in cmd[:4])}...\n  " + "\n  ".join(out))
    return r


def slugify(name):
    s = unicodedata.normalize("NFKD", name)
    s = re.sub(r"[^\w]+", "-", s, flags=re.UNICODE).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)[:40] or "song"


# ---------------------------------------------------------------- prepare
def transcribe_vocals(vocals, lang):
    import stable_whisper
    model = stable_whisper.load_model("medium")
    res = model.transcribe(str(vocals), language=lang, regroup=True, verbose=None)
    return [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()}
            for s in res.segments if s.text.strip()]


def pair_lyrics(segments, lyrics):
    """Give each sung segment its written line, strictly in order.

    Do NOT fuzzy-match: whisper mishears Hindi badly enough that similarity against the real
    lyric is noise, and matching on noise reorders the song. The transcript is trusted only for
    WHERE a phrase is sung; the text comes from the lyrics file, position by position.

    Counts rarely line up (whisper merges two short lines into one segment, and a song skips
    lines you wrote). That is not silently guessed — the caller writes a review file.
    """
    if not lyrics:
        return [(s["start"], s["end"], s["text"], s["text"]) for s in segments], False
    out = []
    for i, seg in enumerate(segments):
        text = lyrics[i] if i < len(lyrics) else seg["text"]
        out.append((seg["start"], seg["end"], text, seg["text"]))
    return out, len(lyrics) == len(segments)


def cmd_prepare(a):
    src = Path(a.input).expanduser()
    if not src.exists():
        sys.exit(f"no such file: {src}")
    slug = a.slug or slugify(src.stem)
    WORK.mkdir(exist_ok=True)
    OUT.mkdir(exist_ok=True)

    mp3 = PUB / f"{slug}.mp3"
    print(f"[1/4] audio -> public/{mp3.name}")
    sh(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-map", "0:a", "-c:a", "libmp3lame",
        "-q:a", "2", str(mp3)])

    stems = WORK / slug
    vocals = stems / "htdemucs" / slug / "vocals.wav"
    if vocals.exists():
        print("[2/4] vocals already isolated")
    else:
        print("[2/4] isolating vocals (demucs, a few minutes)")
        sh([sys.executable, "-m", "demucs", "--two-stems=vocals", "-n", "htdemucs",
            "-o", str(stems), str(mp3)])

    print("[3/4] transcribing vocals (whisper)")
    segments = transcribe_vocals(vocals, a.lang)
    if not segments:
        sys.exit("no vocals found — is this an instrumental?")

    lyrics = []
    if a.lyrics:
        lyrics = [l.strip() for l in Path(a.lyrics).expanduser().read_text(encoding="utf-8").splitlines()
                  if l.strip() and not l.strip().startswith(("#", "["))]
    paired, exact = pair_lyrics(segments, lyrics)

    lines = []
    for start, end, text, heard in paired:
        parts = text.split()
        d = (end - start) / max(1, len(parts))
        lines.append({"start": start, "end": end, "text": text,
                      "words": [{"w": w, "start": round(start + i * d, 2),
                                 "end": round(start + (i + 1) * d, 2)} for i, w in enumerate(parts)]})

    props = {"title": a.title or src.stem, "tag": a.tag or "", "audio": mp3.name,
             "hook": a.hook or (lines[0]["text"] if lines else ""), "lines": lines}
    (OUT / f"{slug}.props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")

    gaps = [(round(lines[i - 1]["end"], 1), round(lines[i]["start"], 1))
            for i in range(1, len(lines)) if lines[i]["start"] - lines[i - 1]["end"] > 2]

    todo = OUT / f"{slug}.scenes.todo.txt"
    todo.write_text(
        "# One image prompt per line, in order. Each prompt covers a run of lyric lines.\n"
        "# End every prompt with ', no text' — generated lettering fights the lyrics.\n"
        f"# {len(lines)} sung lines, {len(gaps)} instrumental gaps: {gaps}\n#\n"
        + "".join(f"# {l['start']:7.2f} {l['text']}\n" for l in lines), encoding="utf-8")

    review = OUT / f"{slug}.lines.review.txt"
    review.write_text(
        "# time | text used | what whisper heard.  Fix the text column if a line is off,\n"
        "# then edit out/<slug>.props.json (or trim the lyrics file and re-run prepare).\n"
        + "".join(f"{st:7.2f} | {tx} | {hd}\n" for st, en, tx, hd in paired), encoding="utf-8")

    if lyrics and not exact:
        print(f"      WARNING: {len(lyrics)} lyric lines vs {len(segments)} sung phrases — "
              f"text was assigned in order, so some lines are probably on the wrong phrase.")
        print(f"      Check out/{slug}.lines.review.txt before rendering.")
    print(f"[4/4] {len(lines)} lines, {len(gaps)} instrumental gaps")
    print(f"      out/{slug}.props.json")
    print(f"      out/{slug}.lines.review.txt")
    print(f"      out/{slug}.scenes.todo.txt   <- write the prompts here, then: scenes {slug}")
    return slug


# ---------------------------------------------------------------- scenes
def cmd_scenes(a):
    props_path = OUT / f"{a.slug}.props.json"
    props = json.loads(props_path.read_text(encoding="utf-8"))
    prompts = read_prompts(a.prompts)
    generate(prompts, PUB / "img" / a.slug, a.size)

    # spread the scenes evenly across the lines, keeping each scene on screen for a whole run
    lines = props["lines"]
    per = max(1, round(len(lines) / len(prompts)))
    for i, l in enumerate(lines):
        n = min(len(prompts), i // per + 1)
        l["img"] = f"img/{a.slug}/{n:02d}.png"
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"attached {len(prompts)} scenes to {len(lines)} lines")


def comfy_up(timeout=300):
    """True once ComfyUI answers on 8188, starting it if it is not running."""
    import urllib.request
    def ping():
        try:
            urllib.request.urlopen("http://127.0.0.1:8188/", timeout=5)
            return True
        except Exception:
            return False
    if ping():
        return True
    subprocess.Popen([str(AI / "launcher/start-comfy.sh"), "--no-open"],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(timeout // 5):
        time.sleep(5)
        if ping():
            return True
    return False


def flux(prompt, dst, size, tries=3):
    """One local FLUX image into dst.

    ComfyUI gets OOM-killed partway through a long batch on a 16 GB Mac, so the image is
    retried with the server restarted in between rather than losing the whole run.
    """
    w, h = (int(x) for x in size.split("x"))
    py = AI / ".venv/bin/python"
    py = str(py) if py.exists() else sys.executable
    for attempt in range(1, tries + 1):
        if not comfy_up():
            sys.exit("ComfyUI did not come up on port 8188")
        try:
            sh([py, "scripts/generate_image.py", "--prompt", prompt,
                "--width", str(w), "--height", str(h)], cwd=AI, quiet=True)
            newest = max((AI / "output/images").glob("flux*.png"), key=lambda p: p.stat().st_mtime)
            shutil.move(str(newest), dst)
            return
        except SystemExit:
            if attempt == tries:
                raise
            print(f"     attempt {attempt} failed (ComfyUI likely out of memory), restarting",
                  flush=True)
            subprocess.run([str(AI / "launcher/stop-comfy.sh")],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(10)


def read_scenes(path):
    """One entry per scene, in order: either `@file.ext` (the user's own) or a FLUX prompt."""
    entries = [l.strip() for l in Path(path).expanduser().read_text(encoding="utf-8").splitlines()
               if l.strip() and not l.strip().startswith("#")]
    if not entries:
        sys.exit("scene list is empty")
    return entries


def plan_cuts(total, n, step, starts, snap):
    """n cut times across the song, each pulled onto a nearby line start when there is one."""
    cuts, used = [], set()
    for i in range(n):
        t = min(i * step, max(0.0, total - 1))
        near = [s for s in starts if abs(s - t) <= snap and s not in used]
        if near:
            t = min(near, key=lambda s: abs(s - t))
            used.add(t)
        cuts.append(round(t, 2))
    for i in range(1, n):                              # snapping must never reorder the cuts
        cuts[i] = max(cuts[i], round(cuts[i - 1] + 0.5, 2))
    return cuts


CLIP_EXT = {".mp4", ".mov", ".webm", ".m4v"}


def clip_seconds(path):
    """Length of a clip, so a short one can be looped to fill its slot."""
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    try:
        return round(float(out.stdout.strip()), 2)
    except ValueError:
        return None


def adopt(src, imgdir, n):
    """Put one of the user's own files into imgdir as NN.ext; stills are converted to .png
    so the depth map and the Remotion side find them by one rule."""
    ext = src.suffix.lower() if src.suffix.lower() in CLIP_EXT else ".png"
    dst = imgdir / f"{n:02d}{ext}"
    if not dst.exists():
        if ext == ".png" and src.suffix.lower() != ".png":
            sh(["ffmpeg", "-y", "-v", "error", "-i", str(src), str(dst)])
        else:
            shutil.copy2(src, dst)
    return dst.name


def build_scenes(entries, imgdir, size, media):
    """Fill imgdir with one file per scene, in order: the user's own where an entry is
    `@name`, a freshly generated FLUX still everywhere else. Existing files are left alone,
    so a run that died partway through picks up where it stopped."""
    imgdir.mkdir(parents=True, exist_ok=True)
    todo = sum(1 for e in entries if not e.startswith("@"))
    print(f"{len(entries)} scenes: {len(entries) - todo} of yours, {todo} to generate "
          f"at {size} (~5 min each)", flush=True)
    names = []
    for i, entry in enumerate(entries, 1):
        if entry.startswith("@"):
            src = Path(media or ".").expanduser() / entry[1:].strip()
            if not src.exists():
                sys.exit(f"scene {i:02d}: no such file {src}")
            names.append(adopt(src, imgdir, i))
            print(f"  {i:02d} {src.name}", flush=True)
            continue
        dst = imgdir / f"{i:02d}.png"
        names.append(dst.name)
        if dst.exists():
            print(f"  {i:02d} exists, skipping", flush=True)
            continue
        print(f"  {i:02d} {entry[:62]}", flush=True)
        flux(entry, dst, size)
    return names


# ---------------------------------------------------------------- scenetrack
def cmd_scenetrack(a):
    """Cut the picture every few seconds, independent of the lyric lines (reference-video style).

    Writes props["scenes"] = [{start, img}], one per prompt, spread across the song and
    snapped to a nearby line start so a cut never lands in the middle of a sung word.
    Also writes a depth map per image, for the 2.5D parallax backdrop.
    """
    props_path = OUT / f"{a.slug}.props.json"
    props = json.loads(props_path.read_text(encoding="utf-8"))
    imgdir = PUB / "img" / (f"{a.slug}_{a.set}" if a.set else a.slug)

    names = build_scenes(read_scenes(a.prompts), imgdir, a.size, a.media)
    py = AI / ".venv/bin/python"
    py = str(py) if py.exists() else sys.executable
    sh([py, str(ROOT / "tools/depthmap.py"), str(imgdir)], cwd=ROOT)

    total = props.get("duration") or max(l["end"] for l in props["lines"])
    step = a.every or total / len(names)
    cuts = plan_cuts(total, len(names), step, [l["start"] for l in props["lines"]], a.snap)

    rel = imgdir.relative_to(PUB).as_posix()
    props["scenes"] = []
    for name, t in zip(names, cuts):
        cut = {"start": t, "img": f"{rel}/{name}"}
        if Path(name).suffix.lower() in CLIP_EXT:
            cut["clip"] = clip_seconds(imgdir / name)
        props["scenes"].append(cut)
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(cuts)} scene cuts written to out/{a.slug}.props.json "
          f"(every ~{step:.1f}s, snapped to line starts)")


# ---------------------------------------------------------------- fix
def cmd_fix(a):
    """Re-apply an edited review file to the props. Lines whose text is blank are dropped."""
    props_path = OUT / f"{a.slug}.props.json"
    props = json.loads(props_path.read_text(encoding="utf-8"))
    rows = []
    for raw in (OUT / f"{a.slug}.lines.review.txt").read_text(encoding="utf-8").splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        parts = [c.strip() for c in raw.split("|")]
        if len(parts) < 2:
            continue
        rows.append((float(parts[0]), parts[1]))

    by_start = {round(l["start"], 2): l for l in props["lines"]}
    kept = []
    for start, text in rows:
        line = by_start.get(round(start, 2))
        if line is None or not text:
            continue
        line["text"] = text
        words = text.split()
        d = (line["end"] - line["start"]) / max(1, len(words))
        line["words"] = [{"w": w, "start": round(line["start"] + i * d, 2),
                          "end": round(line["start"] + (i + 1) * d, 2)} for i, w in enumerate(words)]
        kept.append(line)

    dropped = len(props["lines"]) - len(kept)
    props["lines"] = kept
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(kept)} lines kept, {dropped} dropped -> out/{a.slug}.props.json")


# ---------------------------------------------------------------- render
def loudnorm(mp4, target):
    """Bring the mix to the platform's loudness so it is not quiet next to everything else.
    YouTube normalises to about -14 LUFS, Instagram to about -16; delivering louder than that
    only gets turned down, and quieter just sounds weak. Two passes: the first measures the
    track, the second corrects it — one pass alone lands a dB or so off."""
    f = f"loudnorm=I={target}:TP=-1.5:LRA=11"
    probe = subprocess.run(["ffmpeg", "-nostats", "-i", str(mp4), "-af", f + ":print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    try:
        m = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
        f += (f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
              f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
              f":offset={m['target_offset']}:linear=true")
    except (ValueError, KeyError):
        pass                                   # no measurement: the single pass still helps
    tmp = mp4.with_name(mp4.stem + ".loud.mp4")
    sh(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-c:v", "copy",
        "-af", f, "-c:a", "aac", "-b:a", "192k", str(tmp)])
    tmp.replace(mp4)
    print(f"  loudness: {target} LUFS")


def cmd_render(a):
    props_path = OUT / f"{a.slug}.props.json"
    if not props_path.exists():
        sys.exit(f"missing {props_path} — run prepare first")
    props = json.loads(props_path.read_text(encoding="utf-8"))
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", str(PUB / props["audio"])],
                               capture_output=True, text=True).stdout.strip())

    jobs = [("Song", OUT / f"{a.slug}.mp4", [])]
    if a.short:
        # YouTube Shorts stops at 180 s
        frames = min(int(dur * FPS), 179 * FPS) - 1
        jobs.append(("SongShort", OUT / f"{a.slug}_short.mp4", [f"--frames=0-{frames}"]))

    for cid, dst, extra in jobs:
        chk = OUT / f"{a.slug}.chk.png"
        mid = int(min(dur * 0.4, dur - 1) * FPS)
        sh(["npx", "remotion", "still", "src/index.ts", cid, str(chk),
            f"--frame={mid}", f"--props={props_path}"], quiet=True)
        print(f"  still ok: {chk.name} (frame {mid}) — look at it if anything seems off")
        print(f"  rendering {cid} -> {dst.name}")
        sh(["npx", "remotion", "render", "src/index.ts", cid, str(dst),
            "--codec=h264", "--crf=18", f"--props={props_path}", *extra])
        if not a.no_loudnorm:
            loudnorm(dst, -16.0 if "short" in dst.stem else -14.0)

    if a.preview:
        for _, dst, _ in jobs:
            prev = dst.with_name(dst.stem + "_preview.mp4")
            scale = "720:1280" if "short" in dst.stem else "1280:720"
            sh(["ffmpeg", "-v", "error", "-y", "-i", str(dst), "-vf", f"scale={scale}",
                "-c:v", "libx264", "-crf", "30", "-preset", "fast", "-c:a", "aac", str(prev)])
            print(f"  preview: {prev.name}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("prepare"); p.set_defaults(fn=cmd_prepare)
    p.add_argument("input"); p.add_argument("--title"); p.add_argument("--tag")
    p.add_argument("--hook"); p.add_argument("--slug"); p.add_argument("--lyrics")
    p.add_argument("--lang", default="hi")

    p = sub.add_parser("fix"); p.set_defaults(fn=cmd_fix)
    p.add_argument("slug")

    p = sub.add_parser("scenes"); p.set_defaults(fn=cmd_scenes)
    p.add_argument("slug"); p.add_argument("--prompts", required=True)
    p.add_argument("--size", default="1024x576", help="1024x576 is ~4 min/image on a 16 GB Mac")

    p = sub.add_parser("scenetrack"); p.set_defaults(fn=cmd_scenetrack)
    p.add_argument("slug")
    p.add_argument("--prompts", required=True,
                   help="scene list, one per line: a FLUX prompt, or @name to use your own file")
    p.add_argument("--media", help="folder the @name entries are taken from")
    p.add_argument("--set", default="", help="image subfolder suffix, e.g. v2 or own")
    p.add_argument("--size", default="1024x576")
    p.add_argument("--every", type=float, help="seconds per cut (default: song length / prompts)")
    p.add_argument("--snap", type=float, default=1.2, help="snap a cut to a line start within this many seconds")

    p = sub.add_parser("render"); p.set_defaults(fn=cmd_render)
    p.add_argument("slug"); p.add_argument("--short", action="store_true")
    p.add_argument("--preview", action="store_true")
    p.add_argument("--no-loudnorm", action="store_true",
                   help="skip the loudness pass (default: -14 LUFS, -16 for the Short)")

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
