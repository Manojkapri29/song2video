#!/usr/bin/env bash
# Animate every still in the given scene folders, unattended, overnight.
#
# Wan needs ~8 GB. A Remotion render holds several GB in chrome-headless-shell, and
# starting ComfyUI alongside one just gets it OOM-killed on a 16 GB Mac -- which is
# exactly how tonight's first attempt died. So this waits for the machine to be free
# instead of fighting it, and never touches anyone else's render.
#
#   tools/animate_overnight.sh public/img/neem_v1 public/img/pahadi_v2
#
# Safe to kill and re-run: animate_scenes.py skips a still that already has its clip.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

LOG="${LOG:-out/animate-overnight.log}"
FREE_GB_MIN="${FREE_GB_MIN:-4}"
STEPS="${STEPS:-8}"
FRAMES="${FRAMES:-49}"
SIZE="${SIZE:-832x480}"
mkdir -p out

say() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*" | tee -a "$LOG"; }

# "Pages free" alone is useless on macOS: it sat at 0.3 GB with 4.3 GB of inactive pages
# ready to be reclaimed, so a gate on free would have waited out its 8 h and aborted.
free_gb() {
  vm_stat | awk '/Pages free/{f=$3} /Pages speculative/{s=$3}
    /Pages inactive/{i=$3} /Pages purgeable/{p=$3}
    END{gsub(/\./,"",f); gsub(/\./,"",s); gsub(/\./,"",i); gsub(/\./,"",p);
        printf "%.1f", (f+s+i+p)*16384/1073741824}'
}

renders_running() { pgrep -f "chrome-headless-shell" | wc -l | tr -d ' '; }

say "waiting for the machine: need ${FREE_GB_MIN} GB available and no Remotion render"
# 8 h ceiling so a stuck render cannot leave this spinning into the working day
for _ in $(seq 1 480); do
  n=$(renders_running); g=$(free_gb)
  [ "$n" = "0" ] && [ "$(echo "$g >= $FREE_GB_MIN" | bc)" = "1" ] && break
  say "  busy: ${n} render procs, ${g} GB available"
  sleep 60
done

n=$(renders_running); g=$(free_gb)
if [ "$n" != "0" ] || [ "$(echo "$g >= $FREE_GB_MIN" | bc)" != "1" ]; then
  say "ABORT: still busy after 8 h (${n} render procs, ${g} GB free). Nothing was started."
  exit 1
fi
say "machine free: ${g} GB. Starting ComfyUI."

if ! curl -sf --max-time 5 http://127.0.0.1:8188/system_stats >/dev/null; then
  # detached on purpose: started as a child, ComfyUI dies with this script, and a
  # half-finished clip plus a dead server is what that looked like the first time
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

rc=0
for dir in "$@"; do
  say "=== $dir ==="
  python3 tools/animate_scenes.py "$dir" \
    --steps "$STEPS" --frames "$FRAMES" --size "$SIZE" 2>&1 | tee -a "$LOG"
  [ "${PIPESTATUS[0]}" -eq 0 ] || rc=1
done

for dir in "$@"; do
  say "$dir: $(ls "$dir" | grep -cE '^[0-9][0-9]\.mp4$') clips / \
$(ls "$dir" | grep -cE '^[0-9][0-9]\.png$') stills"
done
say "done (rc=$rc). Re-run this same command to pick up anything that failed."
exit $rc
