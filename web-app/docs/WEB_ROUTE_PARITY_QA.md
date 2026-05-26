# QA Checklist: Web Crags + Route Detail Parity (Prototype vs iOS/Android)

## Scope
Compare the updated web UI with:
1. Designer prototype: `~/Downloads/Peen Design System-10/peen-web/views.jsx` and `detail.jsx`
2. Current production web: `web-app/src/features/crags/CragsView.tsx`, `CragsMap.tsx`, `web-app/src/features/route/RouteDetail.tsx`
3. Mobile references:
   - iOS: `peen-ios/peen/Views/Routes/RouteDetailView.swift`
   - Android: `peen-android/app/src/main/kotlin/com/harvestidea/peen/ui/routes/RouteDetailScreen.kt`

## How to run the comparison
1. Open the web app locally (whatever your standard dev flow is).
2. Navigate to:
   - `Crags` screen
   - open a route detail slide-over (select a route from the active-crag preview)
3. In parallel, keep the prototype HTML/JS open (or screenshots) for `views.jsx` (Crags) and `detail.jsx` (Route detail).

## Visual comparison (Crags)
1. Left list
   - “Crags & gyms” title appears with a sticky list header style (`crag-list-head` look)
   - Crag/gyms rows have:
     - thumbnail
     - name + meta
     - active row highlight when selected
   - Row density and spacing roughly match the prototype list feel.
2. Map area
   - Selecting a crag/gyms row highlights it on the map pins
   - Active-crag preview card sits on the map at the bottom and updates when selection changes
3. Wishlist chip behavior
   - Clicking “Wishlist” triggers sign-in for guests
   - When signed in, the preview’s route list reflects the wishlist filter.

## Visual comparison (Route detail slide-over)
1. Shell
   - Drawer width/position and header layout match the prototype slide-over structure:
     - close icon on the left
     - title/label in the header
     - share + more actions present
2. Hero section + topo gallery behavior
   - The hero shows the first route photo (or a fallback placeholder)
   - Topo line overlay renders on top of the active photo (read-only)
   - When selecting different hero thumbnails:
     - the displayed topo overlay changes to match the selected photo
3. Action row
   - Primary “Log a send” button appears (or sign-in gating for guests)
   - Wishlist control matches the intended icon state
   - “Topo” action opens the topo placeholder modal with loaded-line counts
4. Conditions
   - Conditions rail card exists and spacing matches the prototype section rhythm
5. Recent sends (guest gating)
   - Signed-in: “Recent sends” preview renders with correct send badges
   - Guest: “Sign in to see recent sends…” messaging appears
6. Steepness section
   - “Steepness consensus” chart/card + vote chips appear when signed in
   - Guest sees the sign-in prompt instead of the voting UI
7. Hazards section
   - Signed-in:
     - active hazard list renders (severity badge + title + resolve action)
     - “Report hazard” opens the report modal
     - resolving a hazard removes it from the list after invalidation
   - Guest:
     - “Sign in to view and resolve…” messaging appears
8. Approach section
   - Shows approach minutes from carpark + walk-in angle when available on the route
   - Signed-in: “Latest GPX” metadata shows (or `—` if none)

## Functional spot-checks (must-pass)
1. Guest behavior
   - Wishlist click -> opens sign-in flow
   - Hazards click -> does not allow resolve/report without sign-in
   - Topo overlay: images render, overlay may be empty if topo fetch requires auth (verify expected behavior)
2. Topo rendering correctness
   - Overlay lines are aligned with the photo content (no obvious scaling offset)
   - Overlay changes when switching hero thumbnails
3. Data correctness
   - Hazards list ordering roughly matches mobile (severity desc / recent desc is expected)
   - Resolve updates UI without a full page refresh.

## Known areas to keep an eye on (likely parity gaps)
- Conditions/weather still uses a placeholder on web (prototype has richer content).
- Steepness consensus visualization is an approximation based on available `top_angle + votes`.
- Upload/draw topo flows are not part of this parity QA pass (read-only overlay only).

