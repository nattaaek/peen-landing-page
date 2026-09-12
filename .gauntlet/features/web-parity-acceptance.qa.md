# QA procedure

- Slug: web-parity-acceptance
- Feature: Hosted feed parity acceptance
- Surfaces: `/app/feed`, send detail overlay, public profile peek, global Inbox drawer, `/app/crew`, `/app/profile`

## Setup

- Locale / language (if the product is multilingual): English
- Data needed: A signed-in account with one public send, one followed climber, and access to a feed containing another climber's send; fixtures or seeded data for reels, featured achievements, and inbox notifications covering route, climb, crew invite, belay request/result, follow, like, send-it, comment, climb request, and one unsupported type. Do not record credentials or personal data in evidence.
- How to run the app locally: From `web-app/`, run `npm install` once if dependencies are absent, then `npm run dev`; open the printed local app URL. For hosted verification, open the deployed `/app/feed` URL in a supported desktop browser.

## Steps

1. Given I am signed in and the feed contains my public send, open `/app/feed` and use the send footer share action. When the browser offers a system share sheet, inspect the share text; otherwise inspect the clipboard after the fallback. Then verify `@getpeen`, `#PeenSend`, and `/app/feed?climb=<id>` are present and the deep link identifies the send.
2. Given the same send, open More and choose `Share…`. When the system share is unavailable, verify the clipboard contains the full caption plus link and the toast says `Caption + link copied`. Choose `Copy link` separately and verify the clipboard contains only the URL.
3. Given another climber's send, choose its footer share and More menu actions. Verify both actions copy only a URL and never expose the rich caption path.
4. Given my send is open in the send detail overlay, choose the header share control. Verify it uses the same rich caption and deep link rules. Cancel the system share sheet if it opens and verify the overlay remains usable without an error toast.
5. Given the reels service returns data, reload the feed and verify the `Community reels` header and returned tiles appear. Open one tile and verify Instagram opens in a separate tab or window. Repeat with an empty response and verify no empty carousel is shown.
6. Given a feed item has a featured achievement, verify its badge is visible on the card. Open the climber's public profile peek and verify the featured badge and achievements strip. Repeat with an empty or failed achievement response; verify the profile remains usable and does not show broken tiles.
7. Given the feed is loaded, activate refresh. Verify skeleton/loading feedback appears, the feed updates in place, the URL/screen stays on Feed, and `Feed refreshed` appears after success. Capture the three skeleton cards while the initial feed request is pending.
8. Given the Inbox contains each notification fixture, open the drawer and tap each row. Verify the app attempts the mark-read operation and the drawer closes. Use the fixture's `type` (kind) and `entity_type` separately: route→route detail, climb/like/send-it/comment→send detail, crew_invite→Crew, belay request/result with `entity_type=belay_verification`→Profile with guidance, follow with `entity_type=user`→sender profile, and climb_request→sender profile. Unsupported or stale targets must show a clear supported-app message.

## Edge cases

- Browser has no `navigator.share` and clipboard permission is denied or unavailable: record the observed user-facing behavior and whether the surface remains usable.
- The user cancels the operating system share sheet: no failure toast and no navigation away from the current surface.
- A send has no route name or location: rich share still includes the stable deep link and valid fallback caption.
- Reels response is empty or contains a missing thumbnail: record the observed rendering as exploratory evidence.
- Achievement response is empty, delayed, private, or fails: profile and feed remain readable.
- Refresh fails: record the observed loading/error behavior.
- Notification has no entity id, an unknown entity type, or stale target: verify the drawer closes and record whether a clear fallback message or safe destination is provided.
- Guest opens Feed or Inbox: sign-in gating remains intact.

## Pass / fail

- Pass if: every P1 exit is observable; refresh and skeleton behavior satisfy P2-1/P2-2; every notification fixture reaches the declared destination or presents explicit supported-app guidance; no regression appears in filters, inline comments, deep links, or guest gating.
- Fail if: an owner share is URL-only, another user's share exposes the rich path, canceling share throws an error, reels/achievements are absent when data exists, refresh reloads the page, skeletons are absent, or any notification tap silently does nothing.
