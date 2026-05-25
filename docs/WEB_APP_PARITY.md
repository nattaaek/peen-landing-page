# Web app — design & iOS parity

Reference design: `Peen Design System-10/peen-web/` (designer prototype).  
Production app: `peen-landing-page/web-app/` at [peen.app/app/](https://peen.app/app/).  
Mobile reference: `peen-ios/peen/`.

## Current state (~35–40% of iOS)

| Area | Design match | Feature parity |
|------|--------------|----------------|
| Shell (sidebar, topbar, rail, mobile tabs) | Partial — CSS ported; structure simplified | Nav OK |
| Feed | Guest gate only; no blur teaser | Public feed + like; no Following filter, comments, profiles |
| Crags | Split layout | Catalog + map; map not linked to list; thin route detail |
| Crew | Single scroll page | Leaderboard + partners; no Crew/Partners/Challenges tabs |
| Profile | Basic pyramid | Own profile only; no edit, heatmap, settings |
| Log | Route-only composer | Header “Log climb” broken without route |
| Notifications | Drawer list | No actions / mark-read |

## Phased plan

### Phase A — Design system fidelity (prototype → React)

- [x] Tokens + `app.css` from `colors_and_type.css` / `styles.css`
- [ ] Sidebar: `nav-item`, pinned crags, challenge shortcuts, `crag-snapshot` + topo
- [ ] Right rail: weather, partners preview, seasonal progress, notifications preview
- [ ] `page-head` / `page-title` / `segmented` on all main views
- [ ] Guest states: `LoginRequired` topo card + blurred feed teaser + crew challenge hero
- [ ] Profile: activity heatmap, richer pyramid layout

### Phase B — Core loop (match iOS P1)

- [ ] Feed: Following tab (filter via `loadFollowing` + public feed)
- [ ] Feed: comments sheet, send-it
- [ ] Global log: route picker then composer
- [ ] Route detail: public sends, rating, steepness (API exists)
- [ ] Crags: map pin ↔ list selection; area/gym filters
- [ ] Profile: edit profile, settings, log edit/delete
- [ ] Notifications: mark read + deep links

### Phase C — Crew & community (iOS P2)

- [ ] Crew / Partners / Challenges tabs with full sections
- [ ] Crew invites, shared projects, beta spray
- [ ] Partner post + climb requests + chat
- [ ] Seasonal challenge detail + leaderboard + join

### Phase D — Power features (iOS P3)

- [ ] Topo viewer, hazards, approach, route create/edit
- [ ] Public climber profiles + follow graph
- [ ] Onboarding, search, Instagram reels strip

Track progress in PRs labeled `web-parity`.
