#!/usr/bin/env bash
# Serve the static site over HTTP (required to load the .glb; use npm start for port 8080).
# Usage: ./scripts/serve-local.sh [port]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8080}"
cd "$ROOT"
echo "Peen landing — open: http://127.0.0.1:${PORT}/"
echo "Stop: Ctrl+C"
exec python3 -m http.server "$PORT"
