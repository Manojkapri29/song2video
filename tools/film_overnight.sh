#!/usr/bin/env bash
# Turn a deck plan into a finished film, unattended, after the GPU is free.
#
# FLUX and Wan both want ~8 GB and the clip run already holds it, so this waits for that run
# to end rather than fighting it for memory -- starting a second model alongside one is how
# ComfyUI gets OOM-killed on a 16 GB Mac.
#
#   tools/film_overnight.sh tools/kailash.plan.txt
#
# Safe to kill and re-run: every step skips what already exists.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

PLAN="${1:?usage: film_overnight.sh tools/<slug>.plan.txt}"
SLUG="$(sed -n 's/^#[[:space:]]*slug:[[:space:]]*//p' "$PLAN" | head -1)"
[ -n "$SLUG" ] || { echo "plan has no '# slug:' line"; exit 1; }

SIZE="${SIZE:-1024x576}"
LOG="${LOG:-out/$SLUG-film.log}"
mkdir -p out

say() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*" | tee -a "$LOG"; }

# The clip run is the only thing this has to yield to; a 12 h ceiling so a wedged run cannot
# leave this spinning for a second night.
say "waiting for animate_scenes to finish before touching the GPU"
for _ in $(seq 1 720); do
  pgrep -f animate_scenes >/dev/null || break
  sleep 60
done
if pgrep -f animate_scenes >/dev/null; then
  say "ABORT: the clip run is still going after 12 h. Nothing was started."
  exit 1
fi
say "GPU free"

# Give ComfyUI a clean start: the clip run leaves Wan resident, and FLUX on top of it is the
# OOM this whole script exists to avoid.
"$HOME/AI-Studio/launcher/stop-comfy.sh" >/dev/null 2>&1
sleep 10
if ! curl -sf --max-time 5 http://127.0.0.1:8188/system_stats >/dev/null; then
  # detached on purpose: as a child it would die with this script
  nohup "$HOME/AI-Studio/launcher/start-comfy.sh" >>"$LOG" 2>&1 </dev/null &
  disown 2>/dev/null || true
  for _ in $(seq 1 30); do
    curl -sf --max-time 5 http://127.0.0.1:8188/system_stats >/dev/null && break
    sleep 10
  done
fi
curl -sf --max-time 5 http://127.0.0.1:8188/system_stats >/dev/null \
  || { say "ABORT: ComfyUI did not come up on 8188"; exit 1; }
say "ComfyUI up"

say "=== stills + depth maps ==="
python3 tools/song2video.py scenetrack "$SLUG" --prompts "tools/$SLUG.prompts.txt" \
  --size "$SIZE" 2>&1 | tee -a "$LOG"
[ "${PIPESTATUS[0]}" -eq 0 ] || { say "ABORT: scene generation failed"; exit 1; }

# scenetrack spaces the cuts evenly on its own clock. These cuts are timed to the narration,
# so the plan has the last word and is applied after it.
say "=== restoring narration timing ==="
python3 tools/deck2film.py "$PLAN" 2>&1 | tee -a "$LOG"

say "=== render ==="
python3 tools/song2video.py render "$SLUG" 2>&1 | tee -a "$LOG"
rc=${PIPESTATUS[0]}
say "done (rc=$rc): out/$SLUG.mp4"
exit $rc
