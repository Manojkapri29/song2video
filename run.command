#!/bin/bash
# Double-click this to start the app. Pass --lan to also open it to the local network, so a
# phone or another laptop on the same Wi-Fi can use it at http://<this-mac-ip>:8512
cd "$(dirname "$0")"
[ -x .venv/bin/streamlit ] || { echo "run ./setup.sh first"; read -r; exit 1; }
ARGS=(run tools/app.py --server.port 8512)
if [ "$1" = "--lan" ]; then
  ARGS+=(--server.address 0.0.0.0)
  echo "on this network: http://$(ipconfig getifaddr en0 2>/dev/null || echo '<your-ip>'):8512"
fi
exec .venv/bin/streamlit "${ARGS[@]}"
