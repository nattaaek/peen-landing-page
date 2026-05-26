# Web app — design & iOS parity

Reference design: `Peen Design System-10/peen-web/` (designer prototype).  
Production app: `peen-landing-page/web-app/` at [peen.app/app/](https://peen.app/app/).  
Mobile reference: `peen-ios/peen/`.

## Honest status (May 2026)

**Shell + layout** are close to the designer `peen-web` prototype. **Feed content** depends on real API data (photos, handles, route metadata); empty or sparse fields will still look simpler than mock data. **Filter chips** on Feed are visual-only until wired. **Partner names** in the right rail need richer `community.fetchPartners` payloads (today often shows crag only).

## Current state (~45–50% of iOS)

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
- [x] Sidebar: `nav-item`, pinned crags, challenge shortcuts, `crag-snapshot` + topo
- [x] Right rail: weather, partners preview, seasonal progress, notifications preview
- [x] `page-head` / `page-title` / `segmented` on all main views
- [x] Guest states: `LoginRequired` topo card + blurred feed teaser + crew challenge hero
- [ ] Profile: activity heatmap, richer pyramid layout

### Phase B — Core loop (match iOS P1)

- [x] Feed: Following tab (filter via `loadFollowing` + public feed)
- [x] Feed: comments sheet, send-it
- [x] Global log: route picker then composer
- [x] Route detail: public sends, rating, steepness (API exists)
- [x] Crags: map pin ↔ list selection; area/gym filters
- [x] Profile: edit profile, log edit/delete (settings prefs → Phase C)
- [x] Notifications: mark read + deep links (route entity)

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
