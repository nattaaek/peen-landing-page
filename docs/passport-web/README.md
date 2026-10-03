# 3D Passport + Collection web review

A bounded first web port of PassportCraftV5. Feed has a prominent passport entry; Crew and the challenge detail have secondary entries. `/app/passport` stays inside the current sidebar/topbar/mobile navigation. The selected photographic On the Wall cover, thick binding, physical pockets and eight-joint page deformation come from the editable Blender source, exported as GLB. Accessible DOM controls and real API route progress sit alongside it. Switching 3D/static retains the challenge, spread and selected grade. Static collection works when WebGL or the asset fails. Reduced motion skips interpolation, and the renderer stops drawing at rest.

The same PR polishes the existing invitation form using Peen's Google Sans, semantic surfaces, spacing/radius tokens and shared field/button patterns. Enter submits, Show/Hide reveals privately, empty codes validate locally, the dialog traps focus/accepts Escape/restores focus, and errors refocus the field. Loading prevents duplicate submissions. Confirmed joining clears the code and refreshes progress. Closing, changing accounts or changing challenges remounts the private form. Existing server gates remain authoritative; opening a passport never enrolls anyone.

## Scope and dependencies

- Source: [iOS PR #59](https://github.com/nattaaek/peen-ios/pull/59), editable Library item `libfile_d14c77da792481918a2c5bc4a64ae0c1`; source video `libfile_09f3d3fec68081919b9ad1d4d180a61e` inspected locally.
- Built on web main `627879d`, including merged [#7](https://github.com/nattaaek/peen-landing-page/pull/7). [#8](https://github.com/nattaaek/peen-landing-page/pull/8) remains a separate open draft for seasonal discovery/loading errors and spotlight cache scoping. No duplicate implementation of #8 is included.
- Reads the existing `seasonal_challenge_spotlight` and `seasonal_challenge_progress` through `useMigration`; the existing explicit `joinChallenge` mutation is unchanged. Backend ownership stays in peen-api; schema/security RPC ownership stays in peen-ios. No DB files changed.
- Grade grouping respects the canonical API's uppercase `6A/+`…`7C/+` labels and never fills in missing routes. The current six-grade campaign provides five routes per independent band. The book is decorative preview geometry; DOM earned stamps come only from `completed` in the progress contract.
- Rewards and earned passport history have no completed web contract; those controls are disabled and labeled coming later. The source's fictional history printing is removed from the exported geometry. No fictional earned state is shown in live progress.
- `?demo=true` is a **DEV-only** design preview with fictional, uncompleted routes; it has no enrollment or award behavior. The separate screen-smoke host uses synthetic accounts/API responses and blocks every external request. It is not shipped as a production auth bypass.
- API invitation errors supported today: required, invalid (includes expired), used, rate limited, closed, plus safe fallback for network/unknown failures. The service does not distinguish expired from invalid, so the UI does not invent that distinction.

## Assets, license and bounded cost

`web-app/public/passport/provenance.json` records the source and export. `scripts/passport/export_web.py` reproduces the conversion with the installed official Blender glTF exporter; no purchased or third-party addons. GLB: **5,380,204 bytes**, one eight-joint skin, 26 skinned meshes, authored cover/page/patch animation channels, 16 materials, four embedded images. Cover texture capped at 1024px; the independent static cover is also capped at 1024px. The GLB budget is 6 MiB and verified in CI. Three.js uses the repository's existing version `0.170.0`, MIT license; its license is retained by the package. Renderer JS is lazy-loaded (about 145 KB gzip); canvas pixel ratio is capped at 1.75 and resources are disposed on unmount. This repository had no separate tracked asset-size policy.

The artwork is user-supplied for this Peen/Poda project; this change does not establish rights for redistribution outside that context. Blender source remains in the original Library source, with the reproducible web exporter committed here. USDZ is not served to or loaded by the browser.

## Validation and review evidence

See [VALIDATION.md](VALIDATION.md). [Browser test clip](review/browser-test-clip.mp4) is a 9.6-second, 5 fps sequence of actual browser captures (cover/open/turn/static and invitation error), encoded with AVFoundation. It is **not** a mockup animation and is under 20 MB. Screenshots and video contain synthetic review labels and no real account PII, tokens or invitation codes.

| Desktop | Mobile |
|---|---|
| [Cover](review/01-desktop-cover.jpg), [open book](review/02-desktop-open.jpg), [turned page](review/03-desktop-turned.jpg) | [Passport](review/08-mobile-passport.jpg), [reduced motion](review/09-mobile-reduced-motion.jpg), [failed asset](review/10-mobile-asset-fallback.jpg) |
| [Static selected grade](review/04-static-selected.jpg) | [Normal invitation](review/11-mobile-invitation-normal.jpg) |
| [Normal invitation](review/06-desktop-invitation-normal.jpg), [invalid/expired](review/05-desktop-invitation-error.jpg) | [Invalid/expired](review/07-mobile-invitation-error.jpg) |

No merge, production deployment, production redemption, code issuance/reset, migration or security-RPC change is part of this review.
