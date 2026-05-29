# Web app — design & iOS parity

Reference design: `Peen Design System-11/peen-web/` (designer prototype).  
Production app: `peen-landing-page/web-app/` at [peen.app/app/](https://peen.app/app/).  
Mobile reference: `peen-ios/peen/`.

## Status (May 2026)

The web app is **largely aligned** with the designer prototype for shell, feed, crags, profile, and crew. Remaining gaps are mostly **partner messaging/requests** (no web compose yet), **server-synced comment likes**, and **challenge route checklists** (detail lives on iOS).

## Coverage (~80% of design + core iOS community)

| Area | Status |
|------|--------|
| Shell | Wishlist sidebar, ⌘K search (full catalog scan), challenge shortcuts, pinned crags → map |
| Feed | Filters, inline comments with reply (@mention) + local likes, follow, wishlist, deep links |
| Crags | Map overlay, zoom, preview card, wishlist filter |
| Profile | 4-stat grid, heatmap, crew rank, privacy toggle, public peek |
| Crew | Tabs; weekly + year leaderboard, shared projects, beta spray, partners filters, challenge list |
| Notifications | Drawer, mark read, route links |

## Implemented in web

- Sidebar wishlist (`fetchRoutesByIds`)
- Global search: climbers API + paginated catalog route search
- Public profile slide-over (`/v1/profiles/{id}`, public sends, follow)
- Activity heatmap (12-week grid, streak)
- Crew rank from `community_fetch_weekly_leaderboard`
- Crew tab: `community_fetch_shared_projects`, `community_fetch_beta_spray`, invites count
- Challenges: `fetchChallenges` in sidebar + Challenges tab
- Comment reply (prefill @handle) and like (browser-local until API exists)

## Still open / intentional limits

- **Comment likes** — UI + `localStorage`; no `peen-api` table yet (design was mock; iOS has no likes either)
- **Comment threading** — replies are flat comments with @mentions, not `parent_id`
- **Partner Message / Request** — buttons present; full flow is iOS-first
- **Crew invite / manage** — view invites count; send/manage on iOS
- **Challenge route checklist** — seasonal hero only on web
- **Post partner availability** — web links to profile / iOS

Track progress in PRs labeled `web-parity`.
