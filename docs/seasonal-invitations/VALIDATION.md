# Validation

Final branch verification is recorded in the draft PR description. Earlier reviewed evidence: Library libfile_468f5de728948191bffa45b333b51429 version 3. Actual synthetic iOS/Android/web screens passed entry, invalid denial, corrected retry, account switching and navigation clearing. iOS delayed old-account success/error cannot overwrite new progress. Authenticated HTTP verifies JWT rejection, account spoof isolation, durable denials, retry/idempotence, actual 429 and no raw-code logging.

Synthetic screen mocks prove rendering/state behavior; they are not production release proof. Physical device performance/accessibility extremes and production code issuance were not tested. Full unmodified iOS tests retain the unrelated telemetry actor-conformance compilation problem on Xcode 27; focused commands exclude those two files only. CI results are reported separately.

PASS: final npm production build, TypeScript build, 11 Node tests (3 invitation-specific), scoped UI/helper lint. Actual browser synthetic screen flow previously passed with account isolation and navigation clearing.
