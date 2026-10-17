# song2video

Audio in, motion-graphics video out — a song or a narrated explainer. Everything runs locally
and free: FLUX for the scenes, demucs + whisper for the timing, Ollama for the scene list,
Remotion for the render.

## What it makes

A 1920x1080 video and a 1080x1920 Short: illustrated or photoreal scenes cutting every few
seconds, each still filmed with a 2.5D parallax camera (depth map + a real perspective move),
your own photos and clips mixed in wherever you want them, and kinetic lyric or script type
over the top.

## Set it up on a new machine

```bash
git clone https://github.com/Manojkapri29/song2video.git
cd song2video
./setup.sh          # node deps, a python venv, and a report of what is missing
./run.command       # or: .venv/bin/streamlit run tools/app.py
```

It runs on your own machine, not in the cloud: the scenes come from a local FLUX, the timing
from demucs and whisper, and the video from a headless Chrome render. There is no hosted
version, and a serverless host (Vercel, Netlify and the like) cannot run any of it.

Five tabs:

1. **Audio + script** — upload the song or your voiceover, paste the lyrics or the script,
   one line per sung or spoken line. Press Prepare: it isolates the vocals, transcribes them
   for their boundaries, and writes the timing. Your text is used for the words — whisper
   mishears Hindi and Garhwali often enough that it is never trusted for them.
2. **Timing review** — fix the middle column of the review file, blank a line to drop it,
   Apply.
3. **Scenes** — one line per scene: a prompt for FLUX, or `@filename` for one of your own
   photos or clips. "Look" picks photoreal, cinematic film, or illustrated. Build generates
   what is missing, writes a depth map per still, and spreads the cuts across the song,
   snapped to nearby line starts.
4. **Render** — the video, the Short, and small preview copies, loudness-normalised to
   -14 LUFS (-16 for the Short).
5. **Merge clips** — no song at all: several of your own clips and photos cut into one video,
   in file-name order, with their own sound or under a music bed.

## From the command line

```bash
python3 tools/song2video.py prepare song.mp4 --title "..." --lyrics lyrics.txt
python3 tools/song2video.py fix <slug>
python3 tools/song2video.py scenetrack <slug> --prompts scenes.txt --media mydir --set v2
python3 tools/song2video.py cut  <slug> --media clips/ [--music bed.mp3] [--max 6]
python3 tools/song2video.py render <slug> --short --preview
python3 tools/depthmap.py public/img/<slug>_v2      # depth maps on their own
python tools/check_presets.py                       # one still per composition, blank check
```

## Needs

- Node 18+, Python 3.11+, ffmpeg
- [ComfyUI with FLUX.1-schnell](https://github.com/comfyanonymous/ComfyUI) for the generated
  scenes — the code expects it at `~/AI-Studio`, started on port 8188. On 16 GB it gets
  OOM-killed now and then; the generator restarts it and carries on.
- Ollama for drafting the scene list (any instruct model)
- `python tools/make_stingers.py` writes the intro/outro sounds, which are not in the repo.

Songs, generated scenes and rendered videos are not committed.
