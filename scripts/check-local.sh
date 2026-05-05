#!/usr/bin/env bash
# Smoke-test URLs after starting serve-local.sh (default port 8080).
set -euo pipefail
PORT="${1:-8080}"
BASE="http://127.0.0.1:${PORT}"
echo "Checking ${BASE} ..."
for p in /index.html /tokens.css /js/vendor-three.bundle.js /js/tweaks-panel.bundle.js /js/primitives.bundle.js /js/hero-3d.bundle.js /js/phone-screens.bundle.js /js/sections.bundle.js /js/app.bundle.js /assets/app-icon.jpg /assets/login-bg.jpg /fonts/GoogleSans-Regular.ttf /fonts/GoogleSans-Italic.ttf /fonts/GoogleSans-Medium.ttf /fonts/GoogleSans-SemiBold.ttf /fonts/GoogleSans-Bold.ttf; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE}${p}" || echo "err")
  echo "  ${code}  ${p}"
done
cdn_react=$(curl -sS -o /dev/null -w "%{http_code}" "https://unpkg.com/react@18.3.1/umd/react.production.min.js" || echo "err")
echo "  ${cdn_react}  https://unpkg.com/react@18.3.1/... (landing page CDN dep)"
cdn_react_dom=$(curl -sS -o /dev/null -w "%{http_code}" "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" || echo "err")
echo "  ${cdn_react_dom}  https://unpkg.com/react-dom@18.3.1/... (landing page CDN dep)"
