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

In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**:

- **Site URL:** `https://peen.app`
- **Redirect URLs** (add each):
  - `https://peen.app/auth/callback`
  - `http://localhost:5173/auth/callback` (Vite dev OAuth)

Enable **Google** under **Authentication** → **Providers**. In Google Cloud Console, the OAuth client’s **Authorized redirect URI** must be Supabase’s callback (shown on the Google provider page), e.g. `https://agylfcrvetijpfavhndc.supabase.co/auth/v1/callback`.

The web app uses **PKCE**: sign-in starts on `/app/`, Google redirects to `/auth/callback?code=…`, and the callback page exchanges that code (same browser tab/storage as the sign-in click).

### Google sign-in still fails?

1. Confirm redirect URLs above are saved in Supabase (not only in local `supabase/config.toml`).
2. After deploying a callback fix, hard-refresh and try again in one tab (PKCE verifier lives in `localStorage` until callback runs).
3. If the callback page shows an error message, use that text — common cases are redirect URL not allowlisted or Google provider disabled.
