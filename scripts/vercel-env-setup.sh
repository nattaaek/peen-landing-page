#!/usr/bin/env bash
# Sync Peen web-app env to Vercel (production + development).
# Values match iOS SupabaseConfig (public anon key) and production API.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v npx >/dev/null; then
  echo "npx required" >&2
  exit 1
fi

VERCEL="npx vercel@latest"
SUPABASE_URL="${VITE_SUPABASE_URL:-https://agylfcrvetijpfavhndc.supabase.co}"
SUPABASE_ANON="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWxmY3J2ZXRpanBmYXZobmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTgyNjMsImV4cCI6MjA3NTE3NDI2M30.ROEaFYzuGisWEatQjVMKpZSl0VkpTRAkXOJghIJsmsM}"
PEEN_API="${VITE_PEEN_API_URL:-https://api.peen.app}"

$VERCEL link --yes --project peen-landing-page >/dev/null 2>&1 || true

add() {
  local name="$1"
  local env="$2"
  local value="$3"
  $VERCEL env add "$name" "$env" --value "$value" --yes --non-interactive 2>&1 | grep -E 'Added|already exists' || true
}

for env in production development; do
  add VITE_SUPABASE_URL "$env" "$SUPABASE_URL"
  add VITE_SUPABASE_ANON_KEY "$env" "$SUPABASE_ANON"
  add VITE_PEEN_API_URL "$env" "$PEEN_API"
done

echo ""
$VERCEL env ls
echo ""
echo "Preview PR deploys: add the same three vars in Vercel → Settings → Environment Variables → Preview (all branches)."
echo "Then redeploy: npx vercel --prod"
