#!/bin/bash
# Double-click this to start the app.
cd "$(dirname "$0")"
[ -x .venv/bin/streamlit ] || { echo "run ./setup.sh first"; read -r; exit 1; }
exec .venv/bin/streamlit run tools/app.py --server.port 8512
