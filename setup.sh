#!/bin/bash
# One-time setup on a new machine: node deps, a python venv, and a check of what must be
# installed separately. Safe to re-run.
set -e
cd "$(dirname "$0")"

echo "==> node"
command -v npm >/dev/null || { echo "install Node 18+ first: https://nodejs.org"; exit 1; }
npm install

echo "==> python venv (.venv)"
python3 -m venv .venv
./.venv/bin/pip install -q --upgrade pip
./.venv/bin/pip install -q -r requirements.txt

echo "==> checking the things this cannot install for you"
miss=0
command -v ffmpeg >/dev/null || { echo "  MISSING ffmpeg      -> brew install ffmpeg"; miss=1; }
curl -s --max-time 3 http://127.0.0.1:11434/api/tags >/dev/null \
  || echo "  not running: Ollama  -> https://ollama.com (only needed to draft scene prompts)"
[ -x "$HOME/AI-Studio/launcher/start-comfy.sh" ] \
  || echo "  not found: ComfyUI at ~/AI-Studio (only needed to generate scenes with FLUX)"

echo
[ "$miss" = 0 ] && echo "ready. start it with:  ./run.command   (or: .venv/bin/streamlit run tools/app.py)"
