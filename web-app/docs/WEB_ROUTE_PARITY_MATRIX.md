# Web Crags + Route Detail Parity Matrix (Prototype vs Mobile vs Current Web)

Reference designer prototype:
- `~/Downloads/Peen Design System-10/peen-web/views.jsx` (Crags)
- `~/Downloads/Peen Design System-10/peen-web/detail.jsx` (Route detail)

Production web app:
- `peen-landing-page/web-app/src/features/crags/CragsView.tsx`
- `peen-landing-page/web-app/src/features/crags/CragsMap.tsx`
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
| Primary list in Crags screen | **Crag/gyms rows** with thumbnails + meta | Routes list (map + list of routes) | Routes list (map + list of routes) | **Routes list** (route rows) + map |
| “Active crag” behavior | Selecting a crag changes map focus and shows **ActiveCragPreview** card with sample routes | Selects area/gym pin and filters routes | Selects area/gym pin and filters routes | Selecting map pin sets `selectedPlace` and filters routes; no preview card |
| Wishlist filter placement | Wishlist is a filter for the route list within the crag context | Wishlist chip in Crags route list | Wishlist chip in Crags route list | Wishlist chip exists, but it filters the routes list without crag-centric preview |

**File mapping (where to update web)**
- Prototype crags implementation: `~/Downloads/Peen Design System-10/peen-web/views.jsx` (CragsView + ActiveCragPreview)
- Web crags current list: `[web-app/src/features/crags/CragsView.tsx](web-app/src/features/crags/CragsView.tsx)`
- Web crags map: `[web-app/src/features/crags/CragsMap.tsx](web-app/src/features/crags/CragsMap.tsx)`
- Web layout CSS primitives: `web-app/src/styles/app.css` (e.g. `.crags-split`, `.crag-row`, `.rail-card`, `.crag-list-head`)

### 2) Styling hooks mismatch (high-signal)

| CSS primitive | Prototype expects | Current web uses | Likely impact |
|---|---|---|---|
| Map container class | `.crags-map` | `crags-map-wrap` (wrapper) | Pin/card positioning + background styling can drift |
| Crag row class | `.crag-row` for list rows | `.crag-row` used for **route** rows | Visual spacing may match, but semantics differ (preview card and thumb/meta rows are missing) |
| Active crag preview | Absolute positioned card in map area | Not present | Missing “premium” prototype feel |

---

## Route detail slide-over

### 1) Header + actions

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Slide-over shell | `.slideover`, `.slideover-head`, fixed width, right drawer | Uses slide-over style + toolbars | Uses scaffold + hero/action row layout | Uses `.slideover` + `.slideover-head` (shell matches) |
| Header actions | Close, share, more | Menu + multiple actions (edit/upload/hazards/topo) | Action row + sheets (edit/topo/hazards/steepness) | Close + area label + **wishlist button only** |
| Log send button | Primary “Log a send” | Present | Present | Present in “overview” tab |
| Wishlist control | Present | Present (route list + detail) | Present | Present (wishlist button in header; wishlist state fetched via `useWishlistRouteIds`) |

**Key mismatch:** current web route detail is mostly “text + vote UI”, while mobile includes hero topo + cards + hazard/approach tiles and rich action affordances.

### 2) Hero topo (images + topo lines overlay)

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Hero topo gallery | Yes (hero area + topo overlay) | Yes (`loadTopoLines`, topo editor & manage) | Yes (`TopoImageWithLines`, `topoLines` passed to hero) | **Placeholder only** (`route-hero-placeholder`); no topo overlay |
| Read-only topo lines | Shown in hero | Shown in hero + interactive draw/manage | Shown in hero | Not implemented |

**File mapping (where to add topo hooks/rendering)**
- iOS markers: `RouteDetailView.swift` (look for `loadTopoLines()`, `topoImageGalleryGroups`, `TopoImageView`)
- Android markers: `RouteDetailScreen.kt` (look for `TopoImageWithLines`, `topoLines` usage)
- Web topo current: none in `RouteDetail.tsx`

### 3) Conditions / weather card

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| “Conditions” rail card | Present | Present (`cragWeather`, `heroRatingRow`, approach tile etc) | Present (`weather` + hero tiles) | Not shown |

### 4) Recent sends + consensus visualization

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Recent sends preview | Present in overview | Present in UI (public sends list) | Present with counts and sends list | Present only as a separate tab (“Sends”) |
| Steepness consensus visualization | Chart/tiles | Present (steepness mascot tile, consensus tiles) | Present | Only text + voting chips |

### 5) Hazards + approach

| Capability | Designer prototype | iOS | Android | Current web |
|---|---|---|---|---|
| Hazards section | Not shown in the prototype excerpt, but present in mobile | Present (`Hazards Section`, `ReportHazardSheet`, `HazardListView`) | Present (hazard count tile, submit/resolve) | Not shown |
| Approach section | Present in mobile | Present (approach stat tile + sheet) | Present | Not shown |

**Web hook requirement:** `useMigration.ts` needs new hooks for hazard/approach/topo ops and `RouteDetail.tsx` needs sections wired to them.

---

## Summary of highest-impact web gaps (Crags + RouteDetail)

1. Replace web Crags list semantics with **crag/gyms rows + ActiveCragPreview** (prototype parity).
2. Implement web RouteDetail hero topo gallery and **topo-lines overlay** (read-only first).
3. Add missing RouteDetail sections: **conditions/weather**, **hazards**, **approach**.
4. Move “Recent sends” into overview (with a tab still allowed) and upgrade steepness from “text” to **consensus visualization**.
5. Port design/layout hooks from the designer CSS classnames so the drawer and rail cards look identical.

