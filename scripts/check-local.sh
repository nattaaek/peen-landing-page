#!/usr/bin/env bash
# Smoke-test URLs after starting serve-local.sh (default port 8080).
set -euo pipefail
PORT="${1:-8080}"
BASE="http://127.0.0.1:${PORT}"
echo "Checking ${BASE} ..."
for p in /index.html /tokens.css /app.jsx /sections.jsx /primitives.jsx /hero-3d.jsx /phone-screens.jsx /tweaks-panel.jsx /assets/app-icon.jpg /assets/login-bg.jpg /fonts/GoogleSans-Regular.ttf /fonts/GoogleSans-Italic.ttf /fonts/GoogleSans-Medium.ttf /fonts/GoogleSans-SemiBold.ttf /fonts/GoogleSans-Bold.ttf; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE}${p}" || echo "err")
  echo "  ${code}  ${p}"
done
cdn_three=$(curl -sS -o /dev/null -w "%{http_code}" "https://unpkg.com/three@0.160.0/build/three.min.js" || echo "err")
echo "  ${cdn_three}  https://unpkg.com/three@0.160.0/... (landing page CDN dep)"
