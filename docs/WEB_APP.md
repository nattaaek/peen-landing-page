# Peen web app (`/app/`)

Desktop-first climbing app at [peen.app/app/](https://peen.app/app/), built with **Vite + React + TypeScript** in [`web-app/`](../web-app/).

## Data & auth

- **Product data:** [peen-api](https://api.peen.app) only (`/v1/migration/*`, `/v1/profiles/*`, `/v1/catalog/*` for guest crags).
- **Auth:** Supabase GoTrue in the browser (`@supabase/supabase-js`) — no direct Postgres/PostgREST from the web client.
- **OAuth callback:** `https://peen.app/auth/callback` (shared with iOS Universal Links).

## Local development

1. Copy env: `cp web-app/.env.example web-app/.env.local`
2. Fill `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PEEN_API_URL` (local API: `http://127.0.0.1:8080`)
3. Run peen-api locally on port 8080.
4. From `web-app/`: `npm run dev` → [http://localhost:5173/app/](http://localhost:5173/app/) (Vite dev server proxies `/v1` to the API).

## Production build

From repo root:

```bash
npm run build:web-app
```

Outputs:

- `app/` — SPA assets
- `auth/callback/` — OAuth handler

Vercel runs `npm run build` (landing JS + web app). Set the same `VITE_*` variables in the Vercel project settings.

## Supabase redirect URLs

Allow:

- `https://peen.app/auth/callback`
- `http://localhost:5173/auth/callback` (if testing OAuth against dev)
