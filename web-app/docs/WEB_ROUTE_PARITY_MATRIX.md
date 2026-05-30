# Web Crags + Route Detail Parity Matrix (Prototype vs Mobile vs Current Web)

Reference designer prototype:
- `~/Downloads/Peen Design System-13/peen-web/views.jsx` (Crags)
- `~/Downloads/Peen Design System-13/peen-web/detail.jsx` (Route detail)

Production web app:
- `peen-landing-page/web-app/src/features/crags/` (`CragsView.tsx`, `CragsMap.tsx`, `ActiveCragPanel.tsx`, `CragsFilterSortSheet.tsx`, `AreaRoutesSheet.tsx`, `CreateRouteSheet.tsx`, `ApproachGuideDrawer.tsx`, `CragShared.tsx`)
- `peen-landing-page/web-app/src/lib/cragStats.ts`, `cragListFilters.ts`, `approachGpx.ts`
- `peen-landing-page/web-app/src/features/route/RouteDetail.tsx`
- `peen-landing-page/web-app/src/hooks/useMigration.ts`
- `peen-landing-page/web-app/src/styles/app.css` (layout primitives)

Mobile reference (iOS/Android):
- iOS route detail: `peen-ios/peen/Views/Routes/RouteDetailView.swift`
- iOS route list/map: `peen-ios/peen/Views/Routes/RoutesView.swift`
- Android route detail: `peen-android/app/src/main/kotlin/com/harvestidea/peen/ui/routes/RouteDetailScreen.kt`
- Android routes/crags: `peen-android/app/src/main/kotlin/com/harvestidea/peen/ui/routes/RoutesViewModel.kt`, `RoutesScreen.kt`

---

## Crags

### 1) Layout model (crags vs routes)

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Primary list in Crags screen | **Crag/gyms rows** with thumbnails + meta | Routes list (map + list of routes) | Routes list (map + list of routes) | **Crag/gyms rows** (region, grade sample, routes·walls, distance chip) + MapLibre map |
| “Active crag” behavior | Selecting a crag changes map focus and shows **ActiveCragPreview** card with sample routes | Selects area/gym pin and filters routes | Selects area/gym pin and filters routes | **`ActiveCragPanel`**: dismiss, approach, add route, route previews, “+ N more”, gym directions |
| Wishlist filter placement | Wishlist is a filter for the route list within the crag context | Wishlist chip in Crags route list | Wishlist chip in Crags route list | Not on Crags list (wishlist remains on route detail / route list elsewhere) |
| List filter / sort | Distance + region + route count filters; sort by distance/name/routes/walls | Rich route-list filters (grades, status, areas) | Similar to iOS route list | **`CragsFilterSortSheet`**: max distance, regions, min routes; sort distance/name/routes/walls |
| Full route list for crag | Sheet / navigation to all routes | Area routes sheet | Area routes | **`AreaRoutesSheet`** |
| Create route | Sheet from active crag | Create route flow | Create route | **`CreateRouteSheet`** + `useCreateRoute` |
| Approach + GPX | Approach drawer with track | GPX load/upload/versioning | Approach flows | **`ApproachGuideDrawer`**: load public GPX, map polyline, upload (auth), download/share, version record |
| Map controls | Stylized SVG map (prototype) | Center on user, refresh | Map controls | MapLibre pins + FABs (center user, refresh catalog); not stylized SVG Thailand map |

**File mapping (where to update web)**
- Prototype crags implementation: `~/Downloads/Peen Design System-10/peen-web/views.jsx` (CragsView + ActiveCragPreview)
- Web crags current list: `[web-app/src/features/crags/CragsView.tsx](web-app/src/features/crags/CragsView.tsx)`
- Web crags map: `[web-app/src/features/crags/CragsMap.tsx](web-app/src/features/crags/CragsMap.tsx)`
- Web layout CSS primitives: `web-app/src/styles/app.css` (e.g. `.crags-split`, `.crag-row`, `.rail-card`, `.crag-list-head`)

### 2) Styling / remaining gaps

| Item | Prototype v13 | Current web | Status |
|---|---|---|---|
| Split layout | `.crags-split` list + map | Same primitives in `app.css` | Aligned |
| Map background | Stylized SVG Thailand | MapLibre + muted filter + HTML pins | Functional; visual differs |
| Route list tab (iOS `RoutesListView`) | N/A on Crags page | Not on web Crags | **Open**: status chips, wall grouping live on iOS route list, not web Crags |
| Filter depth | Crag-appropriate filters | Crag filters only (not iOS grade/status chips) | Partial iOS parity |

---

## Route detail slide-over

**Web implementation:** `web-app/src/features/route/RouteDetail.tsx` plus `RouteDetailHero.tsx`, `RouteConditionsCard.tsx`, `RouteTopoModal.tsx`, `RouteDetailStatGrid.tsx`, `TopoImageWithLines.tsx`, `SteepnessConsensusChart.tsx`. Reuses `ApproachGuideDrawer` from Crags.

### 1) Header + actions

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Slide-over shell | `.slideover`, `.slideover-head` | Slide-over + toolbars | Scaffold + hero/actions | `.slideover` (matches) |
| Header actions | Close, share, more | Menu + edit/topo/hazards | Action row + sheets | Close, **share** (Web Share / copy), **more** → edit route |
| Log send | Primary CTA | Present | Present | Present |
| Wishlist | Heart/save | Present | Present | Bookmark in action row |

### 2) Hero topo (images + topo lines overlay)

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Hero gallery | 280px hero + photo index | Yes + topo overlay | `TopoImageWithLines` | **`RouteDetailHero`**: photos + `TopoImageWithLines` overlay |
| Topo viewer | Topo button | Editor + manage | Sheet | **`RouteTopoModal`**: gallery + line count per photo (read-only) |
| Draw/edit topo | — | Yes | Yes | **Open**: `useSaveTopoLine` hooks exist; no web editor UI yet |

### 3) Conditions / weather

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Conditions rail | Dry · temp + subtitle | `cragWeather` tiles | Weather hero | **`RouteConditionsCard`** via Open-Meteo (`useCragWeather`) |
| Stat tiles | — | 6-tile grid | Tiles | **`RouteDetailStatGrid`**: steepness, length, bring, now, approach, hazards |

### 4) Recent sends + consensus

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Recent sends | Overview list | Public sends | Sends list | Overview **Recent sends** (top 3) |
| Steepness chart | 4-bar chart | Consensus tiles | Chart | **`SteepnessConsensusChart`** + vote chips + `useMySteepnessVote` |

### 5) Hazards + approach

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Hazards | Mobile | Report/resolve/list | Tile + sheets | List, report modal, resolve; stat tile scroll |
| Approach | Mobile | Stat + sheet + GPX | Present | Rail card + **`ApproachGuideDrawer`** (map, GPX load/upload) |

---

## Summary of highest-impact web gaps (Crags + RouteDetail)

**Crags (mostly done):**
1. Optional: stylized map background (v13 SVG) vs MapLibre.
2. Optional: dedicated **route list** screen with iOS-style status chips and wall grouping (separate from Crags).

**Route detail (done):**
1. **Topo editor:** `TopoLineEditor` — tap points, colors, label, save/update/delete via migration ops.
2. **Vote distribution:** `fetchAngleVoteCounts` API + `SteepnessConsensusChart` with live percentages.
3. **Deep links:** `?route=<uuid>` synced in `App.tsx`; share uses `buildRouteShareUrl`.

