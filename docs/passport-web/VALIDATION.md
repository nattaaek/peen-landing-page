# Validation — final web implementation

All browser evidence uses the actual React application in Chrome, served from a separate local screen-smoke host. The host uses synthetic accounts, synthetic progress, and synthetic invitation replies; it rejects external requests. No production invitation was redeemed and no backend data was written. Review routes and account progress are labeled fictional in the browser. The real contract mapping was checked against the canonical iOS-owned seasonal migrations (`6A/+` through `7C/+`); there are no schema changes here.

## Passed checks

- TypeScript `tsc -b` and production `npm run build` (SPA plus auth callback).
- 13 unit tests: existing invitation contract trimming/safe errors/account form keys, existing app navigation/share tests, and new real-band grouping/page-state tests. Missing rows stay missing; no synthetic completion is inserted.
- Targeted ESLint: every new passport module, invitation form, changed challenge detail, passport helper/tests, and review fixture host.
- GLB validation: version 2/container length, budget below 6 MiB, eight joints, 26 skinned meshes with joint/weight attributes, animated cover and eight bone rotations, six grade nodes, selected-artwork material, removed fictional index labels. Actual Chrome renders cover, open/turned spreads and pockets; the review clip contains the authored motion.
- Actual browser: load, Open passport, forward/back Turn page by Enter, rendered pocket click selects the corresponding grade, DOM grade selection, 3D/static toggle retains selected grade/spread/challenge, Back to Feed and prominent re-entry, secondary Crew/detail entry.
- Account isolation: synthetic account B has one completed route; switching A→B→A shows 0/5→1/5→0/5. Changing accounts destroys any open private invitation form; reopened code is empty and masked.
- Invitation: empty validation focuses input; invalid and expired both show the service's combined message; used, closed, throttled and network failure map safely. Loading disables submission. A throttle retry stays local during the existing 15-minute retry window. Closing/reopening clears codes. Show/Hide works; Enter submits. Synthetic success removes the input, clears the code and refreshes confirmed enrollment. No page open/toggle enrolls automatically.
- Keyboard: visible focus ring, error input refocus, dialog focus starts on Close, Shift+Tab wraps within the dialog, Escape closes, focus returns to the invoking control.
- Responsive: 320×740, 390×844, 768×1024, 1440×900 tested; document width never exceeds viewport. Mobile tab links now have the same spacing/hit targets as the Log control; hidden topbar search wrapper no longer widens the grid.
- Asset failure: DEV-only controlled missing GLB produces an explicit error and preserves six DOM pockets; Static collection remains usable. Progress failure shows retry/error rather than pretending no challenge exists.
- Reduced motion: local DEV-only review flag exercises the same renderer policy that the browser's `prefers-reduced-motion` query uses; the requested spread settles immediately. OS-wide accessibility preferences were not changed. CSS also removes transitions under the actual media query.

## Existing limitations, separately measured

Full `npm run lint` fails on **35 errors and 21 warnings**, exactly matching a clean archive of main `627879d`; there are **zero new rule/file/severity violations**. Existing errors include set-state-in-effect, refresh-only exports and unused locals across existing app modules. No rules are suppressed for production code. The established screen-smoke-only refresh exception now includes its nested test host. CI runs targeted feature lint in addition to tests, GLB budget verification and build.

Dependency audit reports nine existing advisories (2 moderate, 6 high, 1 critical), in pre-existing maplibre/react-router/vite/transitive packages. The lockfile additions for MIT Three.js `0.170.0` and its types introduce no reported advisory. Broad dependency upgrades are outside this feature. Production build retains pre-existing font-resolution and large main-chunk warnings; the new renderer is a lazy chunk (~145 KB gzip).

Earned-history/reward issuance, photorealistic lighting/shadows, arbitrary campaign grade layouts, continuous recording at native screen frame rate, and production-account redemption validation are outside this bounded draft. The video is an explicitly sampled **48-frame, 5 fps, 9.6-second** sequence of actual browser screenshots, encoded as H.264; it is not generated mockup footage. It is below 20 MB.
