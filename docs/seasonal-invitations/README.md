# Seasonal invitations — draft review

Masked seasonal invitation input, safe errors and account-scoped progress caching. No 3D passport port is included.

Requires coordinated API support and the canonical iOS-owned preparation migration (all gates initially false). Activation/reset is a separate reviewed manual transaction. No production migration/deployment/reset, code issuance or store release was performed while preparing this PR. The user approved closing the target with zero codes; production rollout is blocked by the trusted-main CI release requirement until the release path is resolved.

Acceptance specification: acceptance.feature. Local validation details: VALIDATION.md. Client changes must be available before reopening with issued codes. Older clients have no code-entry capability and receive a denial when the gate is active. No changes to leaderboard qualification or normal climb logging are included.
