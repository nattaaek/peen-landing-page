# QR browser pilot: phone test

Browser-only pilot of `https://peen.app/app/invite/ct-classics-2026#code=<secret>`. Native apps, app associations (AASA / assetlinks) and the printed 100-code package are out of scope.

This file is served publicly from the site root. Never add codes, code hashes, account details, row IDs, fingerprints or screenshots here.

## 1. Production state (read-only, 2026-10-08)

| Item | State |
|---|---|
| Supabase project | `agylfcrvetijpfavhndc` |
| Campaign | CT Classics `b2c3d4e5-0001-4000-8000-000000000001`, invitation-gated, 2026-05-01 to 2026-12-31 |
| Original codes | 100 codes, 0 redeemed, 0 enrollments |
| Migrations | `20261003031446`, `20261003031515` live. No migration, reset or API deploy needed |
| API (Fly) | Merged API #18 `7b30dc63dba49fe74126ebac32c8f20ab5257b45` deployed. API #19 is excluded |
| Web | `peen.app` returns `X-Vercel-ID`. `/app/invite/...` returns the SPA shell with no QR route and no privacy headers until this PR deploys |
| Native | Android 1.0.11 has no QR. iOS 1.0.42 capability not verified. Native PRs are open and non-QR. Not part of this test |

### Deployment behavior (verified from existing GitHub and Vercel records)

- GitHub `main` at `c710e00116861002878310cfa2baeb5c473ee0fd` has a successful Vercel status.
- That production deployment has two different identifiers. Do not mix them up.

| Identifier | Value |
|---|---|
| Vercel dashboard deployment ID | `oQVgfBFKxsGNDvSVFhPkiFVHoyBt` ([dashboard](https://vercel.com/nattaaeks-projects/peen-landing-page/oQVgfBFKxsGNDvSVFhPkiFVHoyBt)) |
| GitHub deployment ID (Vercel bot) | `6823460660`, environment `Production`, success at 2026-10-03T04:54:43Z |
| Deployment hostname | `peen-landing-page-jr1eccln1-nattaaeks-projects.vercel.app` |
| Source commit | `c710e00116861002878310cfa2baeb5c473ee0fd` |

- **Merging to `main` deploys production automatically.** Existing PR heads had preview deployments, so **every push to a PR branch creates a preview automatically.** Repo CI only lints, tests and builds. The Vercel Git integration does the deploying.
- Reading branch protection for `main` returned `Branch not protected` (404). Nothing enforces checks before merge. The person merging must wait for all checks to pass. Do not change any GitHub or Vercel settings for this pilot.
- These facts come from existing records. No new deploy was made and no Vercel settings were changed to gather them.

**Never open a real code on a preview URL.** The parser accepts only `https://peen.app`, so previews cannot test real QR entry.

## 2. Authorization gates

- **The user merges this PR. An agent must not merge it.** Merging deploys production.
- Approval to open the PR is not approval to create production codes, accounts or redemptions. Each needs its own explicit approval.
- The pilot needs one more explicit approval for a scoped mutation. It creates **one new** account-bound code for **one** designated, unjoined pilot account, with a **proposed** 24-hour expiry capped at the campaign end. Nothing in section 3 may run until that proposal is explicitly approved.
- Creating a new account needs its own separate approval. Use an existing account if possible.
- The tester chooses the account, provider and phone, and enters their own credentials and consent.

## 3. Pilot code setup (authorized operator, after explicit approval)

1. Generate 32 random bytes from a CSPRNG and encode them as base64url without padding. The result is 43 characters, and the parser accepts it.
2. Store only the SHA-256 hash, with `bound_user_id`, `challenge_id = b2c3d4e5-0001-4000-8000-000000000001` and an explicit `expires_at` set to 24 hours after creation and no later than the campaign end.
3. Do not reuse, change, print or export any of the original 100 codes.
4. Before creating the pilot code, the authorized operator records a fixed private baseline of the original 100 invitation row IDs. Only that operator keeps the list. Compute a server-side fingerprint over **only** those rows, selected by the baseline IDs and sorted by ID. Cover ID, code hash, challenge, binding, expiry and redemption state. Expect count 100 and redeemed 0, and expect the fingerprint to stay unchanged after the test. Compute it again after the test.
   - Do **not** include campaign-wide enrollment counts in this fingerprint. The pilot legitimately changes CT Classics enrollments from 0 to 1. Track that separately against the designated pilot account.
   - The campaign's total code count goes from 100 to 101 only after the authorized pilot code is created. The original 100 subset stays at 100.
   - Store the baseline IDs, both fingerprints and the pilot row IDs in a protected private record only. Never export code hashes, row IDs, fingerprints or secrets to this document or any public place.
5. Show the pilot code to the tester privately, as an on-screen QR of `https://peen.app/app/invite/ct-classics-2026#code=<pilot-secret>`. Never put the secret in prompts, reports, logs, tickets, chats or public uploads.

## 4. Before merge and post-merge readiness

Before the user merges:

- [ ] Open the Vercel dashboard and confirm the **latest** production deployment right before merging. If it is still `oQVgfBFKxsGNDvSVFhPkiFVHoyBt` (source `c710e001...`, hostname `peen-landing-page-jr1eccln1-...`), that is the rollback target. If a newer production deployment exists, record that one instead: dashboard ID, source SHA and hostname.
- [ ] Record the reviewed QR commit SHA.
- [ ] All PR checks have passed. Branch protection will not enforce this.

After the merge deploys:

- [ ] Record the new production deployment's dashboard ID and source SHA, and confirm the SHA is the merged commit.
- [ ] `https://peen.app/app/invite/ct-classics-2026` (no fragment) shows the invitation screen, not the feed.
- [ ] On a **desktop** browser, use DevTools to check a GET of that bare URL with no secret. It returns `Referrer-Policy: no-referrer`, `Cache-Control: private,no-store` and `X-Robots-Tag: noindex,nofollow`. `/auth/callback` returns the same. This header check is separate from the phone test. The phone test does not need DevTools or USB.
- [ ] The campaign was not archived, reset or re-gated, and the original 100 fingerprint still matches the private baseline.
- [ ] Google or Apple sign-in on `peen.app` returns to `https://peen.app/auth/callback` in the browser and lands back on `peen.app`.

## 5. Phone test

Use the ordinary phone camera, which opens the browser. No USB pairing or phone DevTools is needed. Prefer a phone without Peen installed. If an installed old app intercepts the link, **stop**. Do not change redirects or security settings to work around it.

The raw `#code=` fragment is expected **only** in the URL the camera opens first. The app removes it as it starts. Never screenshot, copy or record that first URL.

Run these steps in order with the single pilot code. Join stays available until the successful join in step 8, so every step before it is reversible.

| # | Action | Pass |
|---|---|---|
| 1 | Scan the pilot QR while signed out | CT Classics screen. Once the page has loaded, the address bar shows `/app/invite/ct-classics-2026` with no `#code`. No join happens |
| 2 | Tap Sign in and finish the provider flow | Returns in the same tab within 15 minutes, signed in to the pilot account. Still no `#code` in the address bar. Code field is masked and prefilled. No join |
| 3 | Tap Cancel and return to Crew. Open the bare invite path again | Pending invitation cleared. The bare path does not prefill a code. No join |
| 4 | Rescan. Before joining, type `https://peen.app/app/profile` into the address bar (no fragment). Sign out with the existing control, which is the avatar menu at the top right, then Sign out. Type the bare invite URL `https://peen.app/app/invite/ct-classics-2026`, before any fresh scan | Signed out. The bare invite shows no prefilled code. No join. The invite screen has no Sign out button, so this step tests leaving the route and signing out together, not sign-out alone |
| 5 | Rescan. Sign in again with the **same** pilot account | Same tab, same account, masked prefilled code. No join |
| 6 | Optional. Wait 16 minutes, return to the tab, then rescan | After the wait the code is no longer prefilled. The rescan prepares it again. No join |
| 7 | Turn on airplane mode. Tap Join once | Safe error shown. Code kept. This client attempt cannot reach the server |
| 8 | Turn the network back on. Tap Join once to retry. While it shows "Checking access…", deliberately double-tap Join and rescan the QR | One server request. The extra taps and rescan do nothing. Success message and the code field clears. If the rescan opens a new tab, do not tap Join there. Close it |
| 9 | Verify privately on the server | Exactly 1 pilot redemption row and 1 enrollment row for the pilot account. CT Classics enrollments went from 0 to 1, and only for the designated account. The original 100 fingerprint is unchanged (100 rows, 0 redeemed). Total campaign codes are 101 only because of the authorized pilot code |
| 10 | Rescan after success, same account | Shows enrolled / view progress. No Join button and no further request |

### Requests versus rows

- Success with a single tap means exactly 1 join request.
- The offline variant (steps 7 and 8) makes 2 client attempts, but the server receives only 1 request.
- If a response is lost, the client may retry. That can mean 2 server requests, yet still only 1 enrollment, because the server join is idempotent.
- Requests and rows are different measurements. The database shows rows, not requests. You cannot count requests from SQL alone. Count requests only from sanitized request metadata or correlation IDs if those exist. Otherwise report the request count as **unmeasured**. Never claim "one POST" just because there is one DB row.

### Typed code flow

After step 8 the pilot account is enrolled. Crew then shows the challenge as joined, with no code form, which is expected. Regression testing of the ordinary typed flow stays deferred to the local synthetic fixture. The only exception is if another approved, unjoined account and code are separately approved. Never consume or ask for an original code to test it.

Rules while testing:

- Cancel **after** the Join request cannot undo a committed server action.
- A lost response may already have committed. Retry is idempotent. Never force a reissue or ask for a new code.
- Switch only between existing, approved accounts. Never create a second account automatically. Switching accounts must clear the pending code.
- "Used by another account" cases need extra accounts and codes, with separate approval. Never consume an original code to test them.
- A signed-in desktop browser does not prove phone camera or native behavior.

## 6. Stop immediately if

Wrong campaign or account, a `#code` fragment that remains after the first page load or reappears after sign-in, a raw code visible in logs or UI, any automatic join, a duplicate enrollment, a provider or app intercept, missing privacy headers, any change to the original 100, or any unrelated side effect. Do not try random production codes and do not probe throttling.

## 7. Safe evidence

Keep: OS and browser version, time, deployed commit, sanitized screenshots (code hidden, account PII redacted), response status or error category, and correlation ID.

Never share: raw HAR files (they include `Authorization` headers, codes and tokens), the first camera URL, full URLs or fragments, QR screenshots, or secrets. Keep counters, query baselines, aggregate fingerprints and used row IDs private.

## 8. Rollback

1. Before merging, confirm the rollback target in the Vercel dashboard (section 4). As of 2026-10-08 it is dashboard deployment `oQVgfBFKxsGNDvSVFhPkiFVHoyBt`, source `c710e00116861002878310cfa2baeb5c473ee0fd`, hostname `peen-landing-page-jr1eccln1-nattaaeks-projects.vercel.app`. Its GitHub deployment ID is `6823460660`, which is not the ID to promote. Also record the reviewed QR commit SHA.
2. Fast rollback: an authorized operator promotes that exact prior Vercel deployment from the dashboard.
3. Durable rollback: revert the focused QR commit through a reviewed PR. The user merges it, and merging the revert also deploys production automatically.
4. Do **not** redeploy the API, replay migrations or run any reset.
5. Expiring the pilot code needs separate mutation approval, and expiry does not undo an enrollment.
6. A redeemed pilot code may be cleaned up only in a narrow, approved transaction that checks identity and confirms no awards, claims or new activity. Preserve the audit trail and the original 100. Otherwise leave the audit record and report it. Never delete accounts.

## 9. Not covered here

Real OAuth and optical camera scans happen only in the steps above. Automated tests and the local fixture under `web-app/screen-smoke/invitation` use synthetic auth and mocked transport. Passing automated tests does not prove production, phone or native behavior. Native app handoff, app associations and printed QR readiness need separate work and approval.
