"""Song → motion-graphics video, as a local web app.

    cd ~/Claude/lyric-video && streamlit run tools/app.py

A thin UI over tools/song2video.py: the pipeline, the models and the renderer are unchanged,
this only drives them and shows the two steps that still need a human — correcting the lyric
review file, and writing the scene prompts.
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests
import streamlit as st

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
S2V = ROOT / "tools/song2video.py"
JOB = OUT / ".job.json"
OLLAMA = "http://127.0.0.1:11434"
THEMES = ["romance", "katha", "mystery", "paper", "punch"]
STYLES = {
    "Photoreal": ("photorealistic, shot on a full-frame camera, 35mm lens, natural light, "
                  "true-to-life textures, shallow depth of field, documentary photography, no text"),
    "Cinematic film": ("cinematic film still, anamorphic lens, soft key light, filmic colour "
                       "grade, fine grain, realistic detail, no text"),
    "Illustrated 3D": ("stylized 3D render, painterly digital art, soft volumetric light, "
                       "cinematic, no text"),
}

st.set_page_config(page_title="Song → Video", page_icon="🎬", layout="wide")


# ------------------------------------------------------------------ background jobs
def start_job(name: str, args: list[str], script: Path = None):
    """Run one pipeline step detached, logging to out/<name>.log. One job at a time.

    `script` defaults to song2video.py; the one-click path passes autoviz.py.
    """
    if job_running():
        st.warning("A job is already running.")
        return
    log = OUT / f"{name}.log"
    OUT.mkdir(exist_ok=True)
    with log.open("w") as fh:
        p = subprocess.Popen([sys.executable, str(script or S2V), *args], cwd=ROOT,
                             stdout=fh, stderr=subprocess.STDOUT, start_new_session=True)
    JOB.write_text(json.dumps({"name": name, "pid": p.pid, "log": log.name,
                               "started": time.time(), "args": args}))


def job() -> dict | None:
    return json.loads(JOB.read_text()) if JOB.exists() else None


def job_running() -> bool:
    j = job()
    if not j:
        return False
    try:
        os.kill(j["pid"], 0)
        return True
    except OSError:
        return False


def job_panel():
    j = job()
    if not j:
        return
    live = job_running()
    mins = (time.time() - j["started"]) / 60
    head = f"{'▶︎ running' if live else '■ finished'} — {j['name']} ({mins:.0f} min)"
    with st.expander(head, expanded=live):
        log = OUT / j["log"]
        st.code("\n".join(log.read_text(errors="replace").splitlines()[-25:]) or "(no output yet)")
        if live:
            if st.button("Stop this job"):
                os.killpg(os.getpgid(j["pid"]), 15)
                st.rerun()
            time.sleep(4)
            st.rerun()


# ------------------------------------------------------------------ project state
def slugs() -> list[str]:
    return sorted(p.name[: -len(".props.json")] for p in OUT.glob("*.props.json"))


def props_path(slug: str) -> Path:
    return OUT / f"{slug}.props.json"


def load_props(slug: str) -> dict:
    return json.loads(props_path(slug).read_text(encoding="utf-8"))


def save_props(slug: str, props: dict):
    props_path(slug).write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")


def draft_prompts(lyrics: str, n: int, model: str, style: str) -> list[str]:
    """Ask the local Ollama model for n scene descriptions; the style suffix is added here."""
    ask = (f"Here are the lyrics of a Garhwali/Hindi folk song:\n\n{lyrics[:2500]}\n\n"
           f"Write exactly {n} image descriptions for the scenes of a music video, in the order "
           "the song moves. Each must be one English line, 12-25 words, describing a place, object "
           "or landscape. Keep people distant, silhouetted or seen from behind, never a close face. "
           "Output only the lines, no numbering, no commentary.")
    r = requests.post(f"{OLLAMA}/api/generate", timeout=600,
                      json={"model": model, "prompt": ask, "stream": False,
                            "options": {"temperature": 0.8}})
    r.raise_for_status()
    out = []
    for line in r.json()["response"].splitlines():
        line = line.strip().lstrip("0123456789.-) ").strip()
        if len(line) > 25:
            out.append(f"{line}, {STYLES[style]}")
    return out[:n]


def ollama_models() -> list[str]:
    """Installed models, with embedding and narrow fine-tuned ones pushed to the bottom."""
    try:
        names = [m["name"] for m in requests.get(f"{OLLAMA}/api/tags", timeout=5).json()["models"]]
    except Exception:
        return []
    narrow = ("embed", "sft", "guard", "rerank")
    return sorted(names, key=lambda n: any(k in n.lower() for k in narrow))


# ------------------------------------------------------------------ UI
st.title("🎬 Song → motion-graphics video")
st.caption("Song ho ya explainer — audio do, script do, video mil jaayega. "
           "Sab local: FLUX, demucs, whisper, Ollama, Remotion. Koi paid service nahi.")
job_panel()

existing = slugs()
choice = st.sidebar.selectbox("Project", ["➕ new song", *existing])
slug = None if choice.startswith("➕") else choice
if slug:
    st.sidebar.caption(f"out/{slug}.props.json")

tabs = st.tabs(["⚡ 1-click", "1 · Audio + script", "2 · Timing review", "3 · Scenes",
                "4 · Render", "Merge clips"])

# ---- 0. one click -----------------------------------------------------------
with tabs[0]:
    st.subheader("Audio do, video lo")
    st.caption("Motion audio se banti hai — beat, energy aur teen frequency bands. "
               "Koi transcription nahi, isliye beech me kuch check karne ko nahi hai. "
               "Screen par lyrics chahiye to woh dusra tab hai, aur wahan timing dekhni padti hai.")
    up1 = st.file_uploader("mp3 / wav / m4a / mp4 / mov", type=["mp3", "wav", "m4a", "mp4", "mov"],
                           key="oneclick_file")
    c1, c2 = st.columns(2)
    t1 = c1.text_input("Title (screen par bada)", key="oneclick_title")
    th1 = c2.selectbox("Theme", THEMES, index=THEMES.index("katha"), key="oneclick_theme")
    c3, c4 = st.columns(2)
    tag1 = c3.text_input("Channel tag", "कथा और रहस्य", key="oneclick_tag")
    short1 = c4.checkbox("Shorts / Reels (1080x1920)", key="oneclick_short")
    st.caption("1080p ka ek minute is Mac par ~4 minute leta hai. Pehle **Still** dekh lo — "
               "woh sekandon me aata hai aur look wahi hota hai.")
    b1, b2 = st.columns(2)
    if b1.button("Still dekho", disabled=not up1, key="oneclick_still") and up1:
        d = OUT / "uploads"; d.mkdir(parents=True, exist_ok=True)
        f = d / up1.name; f.write_bytes(up1.getbuffer())
        args = [str(f), "--theme", th1, "--tag", tag1, "--still"]
        if t1: args += ["--title", t1]
        if short1: args += ["--short"]
        start_job("autoviz-still", args, script=ROOT / "tools" / "autoviz.py")
        st.rerun()
    if b2.button("Video banao", type="primary", disabled=not up1, key="oneclick_render") and up1:
        d = OUT / "uploads"; d.mkdir(parents=True, exist_ok=True)
        f = d / up1.name; f.write_bytes(up1.getbuffer())
        args = [str(f), "--theme", th1, "--tag", tag1]
        if t1: args += ["--title", t1]
        if short1: args += ["--short"]
        start_job("autoviz", args, script=ROOT / "tools" / "autoviz.py")
        st.rerun()

    made = sorted(OUT.glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True)
    shots = sorted(OUT.glob("*.png"), key=lambda f: f.stat().st_mtime, reverse=True)
    if shots:
        st.image(str(shots[0]), caption=f"last still: {shots[0].name}")
    if made:
        st.video(str(made[0]))
        st.caption(f"out/{made[0].name}")

# ---- 1. song ----------------------------------------------------------------
with tabs[1]:
    if slug:
        p = load_props(slug)
        st.write(f"**{p['title']}** — {len(p['lines'])} lines, "
                 f"{len(p.get('scenes', []))} scene cuts")
        c1, c2 = st.columns(2)
        theme = c1.selectbox("Theme", THEMES, index=THEMES.index(p.get("theme", "romance"))
                             if p.get("theme", "romance") in THEMES else 0)
        mark = c2.text_input("Corner mark (emoji)", p.get("mark", "🔱"))
        if st.button("Save look"):
            save_props(slug, {**p, "theme": theme, "mark": mark})
            st.success("Saved.")
    else:
        up = st.file_uploader("Song ya voiceover file (mp4 / mp3)", type=["mp4", "mp3", "wav", "m4a"])
        c1, c2 = st.columns(2)
        title = c1.text_input("Title (shown on screen)")
        tag = c2.text_input("Channel tag", "कथा और रहस्य")
        lyrics = st.text_area(
            "Lyrics ya explainer script — ek line per bola hua vaakya, order me",
            height=220,
            help="Zaroori hai. Whisper Garhwali/Hindi bahut galat sunta hai, isliye lines "
                 "tumhare text se aati hain, uske sune hue se nahi.")
        if st.button("Prepare (audio + vocals + timing)", type="primary",
                     disabled=not (up and title and lyrics)):
            up_dir = OUT / "uploads"
            up_dir.mkdir(parents=True, exist_ok=True)
            song = up_dir / up.name
            song.write_bytes(up.getbuffer())
            lyr = up_dir / f"{song.stem}.lyrics.txt"
            lyr.write_text(lyrics, encoding="utf-8")
            start_job("prepare", ["prepare", str(song), "--title", title, "--tag", tag,
                                  "--lyrics", str(lyr)])
            st.rerun()

# ---- 2. review --------------------------------------------------------------
with tabs[2]:
    if not slug:
        st.info("Pehle audio + script prepare karo.")
    else:
        review = OUT / f"{slug}.lines.review.txt"
        if not review.exists():
            st.info("Koi review file nahi mili — prepare chala hua hai?")
        else:
            st.caption("Beech wala column theek karo. Line blank karne se wo nikal jaayegi. "
                       "Phir 'Apply' — ye props ki timing dobara likhta hai.")
            text = st.text_area("Review", review.read_text(encoding="utf-8"), height=420)
            if st.button("Apply corrections", type="primary"):
                review.write_text(text, encoding="utf-8")
                subprocess.run([sys.executable, str(S2V), "fix", slug], cwd=ROOT, check=True)
                st.success("Timing updated.")

# ---- 3. scenes --------------------------------------------------------------
with tabs[3]:
    if not slug:
        st.info("Pehle ek song ya explainer prepare karo.")
    else:
        p = load_props(slug)
        pf = OUT / f"{slug}.prompts.txt"
        media = OUT / "uploads" / f"{slug}_media"
        st.caption("Scene list hi sab kuch hai — har line ek scene. Line ya to AI ke liye prompt "
                   "hai, ya `@filename` jo tumhari apni photo/clip use karti hai. Photos par 2.5D "
                   "parallax camera chalti hai, clips jaise hain waise chalte hain.")

        ups = st.file_uploader("Apni photos / clips", accept_multiple_files=True,
                               type=["png", "jpg", "jpeg", "webp", "mp4", "mov", "m4v", "webm"])
        if ups:
            media.mkdir(parents=True, exist_ok=True)
            for u in ups:
                (media / u.name).write_bytes(u.getbuffer())
        mine = sorted(f.name for f in media.glob("*")) if media.exists() else []
        if mine:
            st.caption(f"Tumhari files ({len(mine)}): " + ", ".join(f"@{m}" for m in mine))

        c1, c2, c3 = st.columns([1, 1, 1])
        n = c1.number_input("Kitne scenes", 6, 80, 40, help="40 ≈ har 4.5 sec par cut")
        style = c2.selectbox("Look", list(STYLES))
        size = c3.selectbox("Image size", ["1024x576", "1344x768"],
                            help="1344x768 16 GB Mac par swap thrash karta hai")

        b1, b2 = st.columns(2)
        models = ollama_models()
        model = st.selectbox("Ollama model (prompts likhne ke liye)", models or ["(ollama band hai)"])
        if b1.button("Draft scene list with Ollama", disabled=not models):
            with st.spinner("Soch raha hai…"):
                lines = "\n".join(l["text"] for l in p["lines"])
                pf.write_text("\n".join(draft_prompts(lines, int(n), model, style)), encoding="utf-8")
            st.rerun()
        if b2.button("Meri files list me jodo", disabled=not mine):
            have = pf.read_text(encoding="utf-8").rstrip() + "\n" if pf.exists() else ""
            pf.write_text(have + "\n".join(f"@{m}" for m in mine if f"@{m}" not in have) + "\n",
                          encoding="utf-8")
            st.rerun()

        scenes = st.text_area("Scene list — ek line per scene",
                              pf.read_text(encoding="utf-8") if pf.exists() else "", height=320)
        imgdir = ROOT / "public/img" / f"{slug}_v2"
        done = len([f for f in imgdir.glob("[0-9]*.*") if not f.name.endswith(".depth.png")]) \
            if imgdir.exists() else 0
        want = len([l for l in scenes.splitlines() if l.strip() and not l.startswith("#")])
        st.caption(f"{done}/{want} scenes taiyaar. AI wali har image ~5 min — "
                   "generation se pehle Chrome poori tarah quit karo.")
        if st.button("Build scenes + depth maps", type="primary", disabled=not scenes.strip()):
            pf.write_text(scenes, encoding="utf-8")
            start_job("scenes", ["scenetrack", slug, "--prompts", str(pf), "--media", str(media),
                                 "--set", "v2", "--size", size])
            st.rerun()

# ---- 4. render --------------------------------------------------------------
with tabs[4]:
    if not slug:
        st.info("Pehle audio + script prepare karo.")
    else:
        c1, c2 = st.columns(2)
        short = c1.checkbox("Short (1080x1920) bhi", True)
        prev = c2.checkbox("Preview copies (phone ke liye)", True)
        if st.button("Render", type="primary"):
            start_job("render", ["render", slug, *(["--short"] if short else []),
                                 *(["--preview"] if prev else [])])
            st.rerun()
        made = [f"{slug}.mp4", f"{slug}_preview.mp4", f"{slug}_short.mp4",
                f"{slug}_short_preview.mp4"]        # exact names, or a sibling slug leaks in
        for mp4 in (OUT / n for n in made if (OUT / n).exists()):
            mb = mp4.stat().st_size / 1e6
            st.write(f"**{mp4.name}** — {mb:.0f} MB")
            if mb < 40:
                st.video(str(mp4))
            st.download_button("Download", mp4.read_bytes(), file_name=mp4.name,
                               mime="video/mp4", key=mp4.name)

# ---- merge clips ------------------------------------------------------------
with tabs[5]:
    st.caption("Chhoti videos aur photos ek proper video me jod do — koi lyrics nahi. "
               "File ke naam ka order hi cut order hai. Clips apni awaaz ke saath chalte hain, "
               "music bed dene par clips mute ho jaate hain aur music chalta hai.")
    name = st.text_input("Project ka naam (slug)", "cut1")
    clips = st.file_uploader("Clips aur photos", accept_multiple_files=True,
                             type=["mp4", "mov", "m4v", "webm", "png", "jpg", "jpeg", "webp"],
                             key="cutmedia")
    music = st.file_uploader("Music bed (optional)", type=["mp3", "wav", "m4a"], key="cutmusic")
    c1, c2, c3 = st.columns(3)
    mx = c1.number_input("Har clip max (sec, 0 = poora)", 0.0, 60.0, 0.0, step=0.5)
    still = c2.number_input("Har photo (sec)", 1.0, 15.0, 4.0, step=0.5)
    th = c3.selectbox("Theme", THEMES, key="cuttheme")
    title = st.text_input("On-screen title", "", key="cuttitle")

    if st.button("Cut them together", type="primary", disabled=not (clips and name.strip())):
        slug2 = "".join(ch for ch in name.strip() if ch.isalnum() or ch in "-_") or "cut1"
        d = OUT / "uploads" / f"{slug2}_cut"
        d.mkdir(parents=True, exist_ok=True)
        for u in clips:
            (d / u.name).write_bytes(u.getbuffer())
        args = ["cut", slug2, "--media", str(d), "--still", str(still), "--theme", th]
        if mx:
            args += ["--max", str(mx)]
        if title.strip():
            args += ["--title", title.strip()]
        if music:
            mp = d.parent / music.name
            mp.write_bytes(music.getbuffer())
            args += ["--music", str(mp)]
        start_job("cut", args)
        st.rerun()
    st.caption("Ban jaane par sidebar se wo project chuno aur Render tab se render kar lo.")
