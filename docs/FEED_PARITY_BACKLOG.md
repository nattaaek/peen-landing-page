# Feed parity backlog (peen-web)

Production: `peen-landing-page/web-app/` · Mobile reference: `peen-ios/peen/`, `peen-android/…/ui/feed/`  
Parent doc: [WEB_APP_PARITY.md](./WEB_APP_PARITY.md)

Last updated: June 2026

## Summary

Core feed social actions (like, send-it, follow, wishlist, comments, scope tabs, infinite scroll, client filters) are **done on web**. Gaps are mostly **navigation**, **ascent-centric UI**, **notification deep links**, and **native-only polish** (reels, Instagram share, achievements on cards).

Priorities below use **P0** (broken parity / high user pain) through **P3** (nice-to-have or blocked on API).

---

## P0 — Fix broken parity ✅ (Jun 2026)

| # | Item | Status |
|---|------|--------|
| P0-1 | Notification tap → climb | Done — `AscentDetailOverlay` + `?climb=` |
| P0-2 | Ascent / send detail screen | Done — route row opens ascent; route from overlay |
| P0-3 | `fetchPublicClimb` fallback | Done — `usePublicClimb` / `fetchPublicClimbHydrated` |

**Dependencies:** P0-1 depends on P0-2 or `?climb=` path; implement P0-3 with P0-1 for reliable notification UX.

---

## P1 — High-value parity

| # | Item | Status |
|---|------|--------|
| P1-1 | Rich share for own sends | Open — web uses copy link on share tap |
| P1-2 | Community reels carousel | Done — `GET /v1/social/instagram/reels` |
| P1-3 | Featured achievement on feed cards | Done — batch `featured-achievement-ids` on hydrate |
| P1-4 | Achievements on public profile peek | Done — `AchievementsStrip` + `fetchAchievements` |

**P1 exit criteria:** Own-send share feels as useful as mobile (at least link + caption + system share); feed header shows reels when API returns data; cards and profile peek show featured achievement.

---

## P2 — UX polish & shell routing

| # | Item | Status |
|---|------|--------|
| P2-1 | Refresh feed | Done — refresh button invalidates feed + reels |
| P2-2 | Feed loading skeletons | Done — `FeedCardSkeleton` ×3 |
| P2-3 | Notification → crew invite / belay | Partial — crew → `/crew`; belay → profile + toast (respond on native) |
| P2-4 | **Following tab: server-side scope (optional)** | Today both platforms filter client-side on loaded window; web copy warns “in loaded feed” | iOS `filterEntries` after `loadPublicFeed` | **API change:** `loadPublicFeed` param `scope=following` + cursor. Reduces confusion vs infinite scroll. Coordinate with `peen-api` / migration handler. |

**P2 exit criteria:** Refresh reloads feed without full page reload; loading state matches native feel; all notification entity types navigate somewhere sensible.

---

## P3 — API-dependent or lower priority

| # | Item | Why P3 | Notes |
|---|------|--------|-------|
| P3-1 | **Server-synced comment likes** | No backend table yet; iOS also lacks comment likes | Design in `WEB_APP_PARITY.md`; web has `localStorage` prototype in `commentLikes.ts` |
| P3-2 | **Comment threading (`parent_id`)** | Flat + @mention is current contract on web | Needs schema + mobile agreement |
| P3-3 | **Mute / report (real)** | Web menu shows toasts only; native feed has no mute/report | Product + moderation API before implementation |
| P3-4 | **“Send to crew” / “Send in message” from share** | Stub on web; partner messaging iOS-first | Blocked on [partner messaging parity](./WEB_APP_PARITY.md) |
| P3-5 | **Feed-specific notifications bell** | Web uses global shell bell — acceptable | Only revisit if feed becomes standalone layout |

---

## Web strengths (do not regress)

Keep these when shipping P0–P2:

- **Client filters** (style, grade, crag, when, sort) — native has scope tabs only
- **Inline comments + @reply** — native uses modal sheet
- **Infinite scroll** with cursor — iOS single page (~50)
- **Guest feed teaser** + sign-in gates
- **Double-tap photo like** + photo lightbox on cards

---

## Suggested implementation order

```mermaid
flowchart LR
  P0_1[P0-1 Notification → climb]
  P0_2[P0-2 Ascent detail overlay]
  P0_3[P0-3 fetchPublicClimb fallback]
  P1_1[P1-1 Share composer]
  P1_2[P1-2 Reels carousel]
  P1_3[P1-3 Achievement badge]
  P2_1[P2-1 Pull refresh]

  P0_2 --> P0_1
  P0_3 --> P0_1
  P0_2 --> P1_1
  P0_1 --> P2_1
```

1. **P0-2** + **P0-3** (ascent overlay + single-climb fetch)  
2. **P0-1** (wire notifications)  
3. **P1-1**, **P1-3** (share + badge — small surface area)  
4. **P1-2**, **P1-4** (reels + profile achievements)  
5. **P2-*** as capacity allows  
6. **P3-*** when API/product ready  

---

## PR checklist (label `web-parity`)

- [ ] Migration op tested: `fetchPublicClimb`, `loadPublicFeed` cursor unchanged  
- [ ] `?climb=` still works after ascent overlay refactor  
- [ ] Notification samples: `climb`, `route`, `crew_invite` (if implemented)  
- [ ] Own-send vs other-send share behavior verified  
- [ ] No regression on `FeedFilterBar` / inline comments  

---

## Out of scope for this backlog

- Partner post compose / climb requests (see main parity doc)  
- Challenge route checklist on web  
- Push notifications in browser (web uses in-app drawer only)  

Track PRs with label **`web-parity`**; close items here when merged.
