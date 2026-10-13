# Gym visit info (web)

The web app follows the shared `Gym.visit_info` contract, schema_version 1. The contract lives in peen-ios at `docs/gym-visit-info/CONTRACT.md`, and the API rules live in peen-api at `docs/gym-visit-info/README.md`. This page covers only what the web client does.

## Reading

`GET /v1/catalog/gyms` rows pass through `normalizeApiGyms` (`web-app/src/lib/gymVisitInfo.ts`).

- A row without a usable `id` or `name` is dropped. Every other row is kept.
- `visit_info` that is missing, `null`, not an object, or not `schema_version` 1 becomes `null`, which the UI shows as unknown. It never fails the catalog.
- Invalid rows inside a list are dropped and valid rows are kept. An invalid `color_hex` becomes `null` and the colour name stays. A `verified_at` that is not a real calendar date becomes `null`. A provenance source other than `posted_sign` reads as unknown.
- Optional text (`note` on hours, `conditions` on prices, `note` on provenance) is missing, `null` or a string. Missing reads as `null`. Any other type makes the enclosing object invalid, matching iOS and Android: the hours or price row is dropped, and provenance reads as unknown while every valid list row stays.
- Money stays in integer minor units. Display uses the currency's ISO digits, so THB `38000` shows as `THB 380`.

## Display

Selecting a gym in Crags shows `GymVisitSection` before the recorded route list.

- "Posted information — confirm with the gym", then the source and the verification date ("date unknown" when absent).
- Hours are posted wall-clock text. There is no open-now, holiday or timezone claim.
- Every grade colour is named in text. The swatch is decorative.
- Address shows only when present. There is no phone, owner or inventory field.
- Coordinates come from the gym row. "Directions" is a normal link to Google Maps with the coordinate as destination. "Copy coordinates" falls back to a visible message with the text when the clipboard is unavailable.
- Gyms stay listed with zero recorded routes. Crags still need one route once the route catalog has loaded. The empty state says "No routes recorded in Peen yet."

## Writing

All writes go to `POST /v1/migration/routes` through `httpGymWriter` (`web-app/src/lib/peen-api/gyms.ts`).

| Situation | Op | Params |
| --- | --- | --- |
| Add gym, no visit info entered | `createGym` | `name, latitude, longitude, address` |
| Add gym, any visit info entered | `createGymWithVisitInfo` | `name, latitude, longitude, address, visit_info` |
| Edit posted info | `updateGymVisitInfo` | `id, visit_info` |
| Remove posted info | `updateGymVisitInfo` | `id, visit_info: null` |

- "Add gym" sits in the Crags list header and does not need a route.
- Latitude and longitude must be typed explicitly, be finite decimals, and be in range. `0, 0` is rejected. There is no default coordinate.
- The client validates against the API bounds before sending. The server still validates every write.
- `createGym` and `createGymWithVisitInfo` both send `address`, and the API stores it on both paths.
- A failed `createGymWithVisitInfo` shows the server error, keeps the form open with every input, and is never retried through `createGym`. An HTTP error or a client validation error stays an ordinary failure, so the user can fix the input and save again.
- Save is single-flight. A second tap while saving does nothing.
- An HTTP success whose body does not decode to a gym row is an acknowledged write (`GymWriteUnreadableError`). The server may have stored the row. The sheet keeps every input, turns saving off for that account and sheet, and offers "Check gym list". That action only refetches the public catalog. It never posts. When the body or the edit carried a gym id and the refreshed catalog has that id, the sheet finishes as a normal save. Without an id the sheet does not guess by name. It refreshes the list and tells the user to find the gym in Crags before adding it again. Closing the sheet drops the lock with the draft.
- A successful save refetches the public gym catalog, and the panel shows that refetched row. Nothing is shown optimistically.
- Closing the sheet, unmounting it, or switching account cancels the write session. A late result then changes no state and runs no callback.

## Who sees "Edit posted info"

The server decides. The client only hides the button from people the server would reject.

- The signed-in user is the gym's `created_by`, or
- `fetchPlaceCrewSummary` on `POST /v1/migration/place-crew` (`place_kind: "gym"`) returns `my_role` `owner` or `moderator`. Catalog owners always get `owner` from that op.

The summary query key includes the gym id and the user id. If the summary fails, or answers for another place, the panel shows "Couldn't check edit access" with Retry, and no edit button. Guests never see edit controls.

For a catalog owner, the API's `fetchPlaceCrewSummary` creates the place crew if it does not exist yet. That is existing server behaviour.

## Tests

`npm test` runs `web-app/src/lib/*.test.ts`.

- `gymVisitInfo.test.ts` covers the synthetic fixture (byte parity with the peen-ios and peen-api copies when those repos sit next to this one), tolerant decode including wrong-typed optional text, money, coordinate rules, op choice and address on every create path, and the zero-route listing rule.
- `gymWriteController.test.ts` covers one-op-no-fallback writes, single flight, retry after failure, cancel and account-switch staleness, the acknowledged-but-unreadable lock and its read-only recovery, crew summary parsing and the edit rule.

`web-app/fixtures/gym-visit-info/chillout.synthetic.fixture.json` is a verbatim copy of the iOS fixture. It is synthetic and local only. Never seed it.

## Synthetic browser harness

`web-app/screen-smoke/gym` renders the real `ActiveCragPanel`, `GymVisitSection`, `CreateGymSheet` and `EditGymSheet` with synthetic accounts, an in-memory writer seeded from the fixture, and a fetch stub that answers only the synthetic crew summary. It does not render the app root, real auth, Supabase or the map. It is labelled "Synthetic local harness, not live Peen".

```sh
cd web-app
npx vite --config screen-smoke/gym/vite.config.ts
# open http://127.0.0.1:18089/
```

"Synthetic write result" picks the writer outcome. `unreadable` stores the row and answers `{ id, name: null }`, so "Check gym list" finds it. `unreadable-no-id` stores the row and answers an HTML body, so the sheet stays locked and points at the list.

The harness proves UI behaviour only. It does not prove database persistence or how the real API answers. The peen-api tests are the persistence evidence.
