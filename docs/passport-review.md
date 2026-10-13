# Passport visual correction and CT Classics intro (review only)

Branch `codex/passport-visual-20261013` on main `5870aa8`, for review as a draft PR. It is on review hold and release hold. Do not merge, release or deploy it until both holds are lifted.

The Bangkok event work lives on its own branch, `codex/challenge-bangkok-20261013`, and is not part of this change. Its UTC copy still needs integrating with this branch. The new belayer authorization, timing and bouldering rules are pending and not covered here.

## What a climber sees

Before, Crew showed a generic "The climbing passport / Good routes. A book of your own." entry, a brown topo card titled from the backend, and a challenge sheet with a dark "30 routes to send" panel and eligibility rules as flush gray paragraphs. None of it matched the cover or the approved film.

After, the CT Classics season (challenge id `b2c3d4e5-0001-4000-8000-000000000001`, the id the invitation code already uses) is presented as the cover presents it. "Poda |" sits over "Best routes *ever*" in teal editorial serif with the orange rule, on the cover's warm cream, labelled "Passport · Central Thailand edition". This applies to the passport entry, the Challenges spotlight card, the challenge sheet hero and the passport page title. The cover keeps its 720×1024 portrait aspect everywhere.

Any other season keeps its backend title, subtitle and existing hero. Nothing renames backend records. Counts, progress, days left and joined counts are the API's values. The film's seals and dots are artwork and are never presented as progress.

The eligibility rules in every challenge sheet are now an inset, readable list instead of flush gray paragraphs.

## The intro film

When a climber opens the current CT Classics season from the Crew Challenges spotlight card, the approved six-second film plays full screen over the challenge, which loads underneath. It holds on the open-book frame with "Open challenge". That button fades the film out over 0.65 s into the real challenge.

`web-app/public/passport/intro.mp4` (1,327,338 bytes, SHA-256 `85ca092a…adaec1`) and `intro-poster.jpg` (481,109 bytes, SHA-256 `b56e4bf9…eeff`) are the coordinator-verified copies, unmodified.

The film autoplays only when all of these hold. They live in `shouldAutoplayIntro` in `web-app/src/lib/challengeIntro.ts`.

- The challenge is CT Classics and the loaded spotlight says it is the current season. An unknown season, a failed spotlight, past-season rows and invitation flows open directly.
- `prefers-reduced-motion` is not `reduce` and `navigator.connection.saveData` is not set.
- It has not been granted yet in this SPA launch.

The grant is claimed when the climber taps the spotlight card, inside the tap handler, before the sheet mounts and before any film byte is requested. From that moment the launch's one autoplay is spent, whatever happens next. The film may play to the end, fail, stall, be skipped, or be abandoned on an account change. A tap that fails a condition spends nothing, so a later tap in the same launch can still autoplay once the conditions hold. The played set is keyed by challenge, not by account, so a second account in the same launch does not get its own autoplay. A reload starts a new launch.

Reduced motion and Save-Data only stop autoplay. "Play intro film" in the CT hero is a deliberate request, so it bypasses both preferences on purpose. It plays and downloads the film even under `reduce` or Save-Data. It neither checks nor spends the launch grant. Turning reduced motion on while any film is showing, replay included, still skips to the challenge, and the fade is instant under reduced motion.

Each intro belongs to the account and challenge it started for. The first render where either differs ends that intro for good, in any phase. Returning to the original account or challenge does not bring it back and does not request the film again. Only "Play intro film" brings it back.

The web cannot detect screen readers, so it does not try. Every path stays keyboard and screen-reader usable instead. Skip is focused when the film starts, Open challenge when it holds, Tab cycles only the film's controls, and Escape skips. The challenge underneath is `inert` and `aria-hidden` until the film finishes. Focus then moves into the challenge, or back to "Play intro film" after a manual replay, and returns to the spotlight card when the sheet closes.

| Event | Result |
| --- | --- |
| Film reaches its end | Holds the open book with "Open challenge" until the climber chooses. |
| Open challenge | 0.65 s fade, instant under reduced motion. The overlay still absorbs clicks during the fade. |
| Skip intro or Escape, early or on the held frame | The challenge at once. |
| Sound button, top left | Toggles sound. The film always starts muted so browsers allow autoplay. The choice lasts for the launch. |
| Missing or corrupt file, playback error, autoplay refused | The challenge at once. |
| No playback progress for 8 s | The challenge at once. |
| Page hidden | Film pauses and the stall timer stops. It resumes when visible. |
| Reduced motion turned on mid-film | The challenge at once. |
| Account changes while the film is loading, playing, holding or fading | The intro ends for good and the video is released. The sheet stays, interactive, with the new account's data. Switching back to the first account leaves the intro gone with no new film request. Signing out removes the sheet. |
| Challenge destination changes under an open sheet | Same as an account change. The old intro never returns over the new or the original challenge. |
| Sheet closes or Crew unmounts | Video paused, its source removed and the element released. |
| "Play intro film" in the CT hero | Deliberate replay. Bypasses reduced motion and Save-Data, ignores the launch grant, plays the film from the start. The browser may serve it from its media cache. |

On a phone-shaped viewport (aspect 2:5 to 1:2) the film fills the screen with at most a few percent cropped. Elsewhere it is letterboxed whole at 9:20 on near-black. Controls are 48 px or larger and sit inside the film frame.

Playback never enrolls, redeems, reads or changes invitation state, auth, origin fences or callbacks. There is no analytics or third-party media.

## Files

- `web-app/src/lib/challengeIntro.ts` and `challengeIntro.test.ts`. CT edition lookup, autoplay policy, per-launch session, and the intro phase machine (`loading → playing → holding → fading → done`). The `abandon` event takes every live phase to `done`, and only `replay` leaves `done`.
- `web-app/src/features/passport/ChallengeIntro.tsx`. The video overlay, its lifecycle and keyboard handling.
- `web-app/src/features/passport/introEnvironment.ts`. Reads reduced motion and Save-Data.
- `web-app/src/features/passport/EditionName.tsx`. The cover lockup shared by the four surfaces.
- `web-app/src/features/passport/PassportEntry.tsx`, `PassportView.tsx`. Edition branding.
- `web-app/src/features/crew/SeasonalSpotlightCard.tsx`. Edition card for CT only.
- `web-app/src/features/crew/SeasonalChallengeDetailOverlay.tsx`. Owns the intro phase and its owner (account and challenge), the CT hero, inert underlay, focus return, rules list.
- `web-app/src/features/crew/CrewView.tsx`. The spotlight card asks the policy; other entries pass no intro.
- `web-app/src/styles/passport.css`. All new styles, scoped to edition and intro classes. The serif stack is local fonts only.
The synthetic review host and checks are not in the repository. They live in `/Users/nattaaek/Documents/Codex/2026-10-08/task-2/peen-passport-visual/qa`, outside every served path and build. The earlier in-repo `tools/passport-visual-review/` no longer exists and is not shipped.

Not touched: `seasonalChallenge.ts` and its tests, invitation, scanner, auth, services, env, dependencies, global config, migrations, manifests, release files, the GLB, the cover, provenance, and `/tmp/challenge-review`.

## Review host and checks

The host runs the real `App` with the real dev-bypass `AuthProvider`, wrapped so a check can switch to a second account or a guest. A local fixture answers `/v1/migration/*` with synthetic seasons and refuses every other origin. The Vite middleware injects film faults from a same-origin cookie and logs media requests. Scenario parameters are `season=ct|other|none|fail`, `film=ok|missing|stall|corrupt|slow`, `saveData=1`, `autoplay=blocked` and `completed=0..30`.

The host needs `PEEN_WEB_APP` set to the absolute path of the `web-app` to review. Its fallback, `../../web-app` relative to the QA folder, does not point at this repository. The host loads `@vitejs/plugin-react`, `public/` and its Vite cache from that `web-app`, so run `npm ci` there first.

```sh
export PEEN_WEB_APP=/Users/nattaaek/Documents/Codex/2026-10-08/task-2/chillout-visit-first/peen-landing-page/web-app
export PEEN_QA=/Users/nattaaek/Documents/Codex/2026-10-08/task-2/peen-passport-visual/qa

cd "$PEEN_WEB_APP"
npm test
node node_modules/typescript/bin/tsc -b
node node_modules/eslint/bin/eslint.js src/lib/challengeIntro.ts src/lib/challengeIntro.test.ts src/features/passport src/features/crew/SeasonalSpotlightCard.tsx src/features/crew/SeasonalChallengeDetailOverlay.tsx src/features/crew/CrewView.tsx
npm run build
shasum -a 256 public/passport/intro.mp4 public/passport/intro-poster.jpg

node "$PEEN_WEB_APP/node_modules/vite/bin/vite.js" --config "$PEEN_QA/vite.config.mjs"
# second shell, Node 22+ and Google Chrome:
node "$PEEN_QA/check.mjs" after
```

For the before views, start the host with `PEEN_WEB_APP` set to the absolute path of a `5870aa8` worktree's `web-app`, with its own `npm ci`, and run `node "$PEEN_QA/check.mjs" before`. Intro checks fail there by design. The layout screenshots are the comparison.

`check.mjs` writes screenshots and `results.json` to `$PEEN_QA/out/<label>/`. It emulates a desktop 1440×900 CSS viewport at DPR 1 and a phone 390×844 CSS viewport at DPR 2 in headless Chrome. Neither is a physical device. It covers both layouts, film frames at 0.6, 2.5 and 4.5 s, the held frame, mid-fade and after handoff. It also covers focus and Tab containment, Escape, manual replay and focus return, sound toggle, no replay in the same launch, reduced motion, Save-Data, an unknown season, a past CT row, missing, corrupt and stalled film, blocked autoplay, an account change and sign-out with stream cleanup, hidden-page pause and resume, and no external requests.

Two regressions switch account A to B and back to A, once while the film is playing and once while it holds the open book. Each asserts that the intro and its video stay absent, that the sheet is the CT challenge and is neither `inert` nor `aria-hidden`, and that the replay button receives pointer hits. It also asserts that the media log shows no new `intro.mp4` request. Pressing "Play intro film" must then bring the intro back and actually play the film. The check requires the intro in `playing`, the video source `/app/passport/intro.mp4`, and `currentTime` advancing by more than 0.3 s while the video is neither paused nor ended. A new HTTP request is not required, because the browser may legitimately serve the replay from its media cache.

The runner owns exactly two things. One is the Chrome it spawns, which leads its own process group. The other is the temporary profile directory it creates. A `finally` block and SIGINT and SIGTERM handlers stop that process group, with SIGTERM first and SIGKILL after 3 s, and then delete that profile. This happens even when Chrome fails to start, a check throws, or the DevTools connection drops. Nothing else is killed or deleted. The QA folder's paths are relative to itself, plus `PEEN_WEB_APP`.

## Verification

The coordinator ran these against this branch.

- `npm test` passed all 124 Node tests.
- The type check and `npm run build` passed.
- `check.mjs after` passed 82 of 82 synthetic headless browser checks (`$PEEN_QA/out/after/results.json`, 2026-10-13T09:39:19Z, 0 failed). That run includes the A→B→A regressions in both the playing and holding phases. In both, the deliberate replay played from the media cache. The film request count stayed the same (9 to 9, 10 to 10), and `currentTime` advanced from about 0.04 s to 0.35 s with the video playing.
- Focused lint reports only issues that already exist in `CrewView.tsx`, one `set-state-in-effect` error and one `exhaustive-deps` warning. The same effect is in the `HEAD` baseline source. The new modules report no lint errors.

A before and after review page is saved in the Preview Library as `libfile_5cbf4045aff88191924226bceb257949`, with a local copy named `Peen-Passport-Before-After-Review.html`.

## Limits

- Phone and desktop results come from emulated CSS viewports in headless Chrome, not physical devices.
- No audio was heard. Headless runs are muted (`--mute-audio`).
- Nothing was tested in real Safari or with a real assistive technology device such as VoiceOver or TalkBack.
- The hidden-page check simulates `visibilitychange`. Headless Chrome cannot background a tab.
- The guest Crew teaser still says "Central Thailand Classics" in the old brown style. It is outside the signed-in surfaces in the reported screenshots.
