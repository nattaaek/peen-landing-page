import test from 'node:test'
import assert from 'node:assert/strict'
import { CT_CLASSICS_CHALLENGE_ID } from './invitationLink.ts'
import { INVITATION_TTL_MS } from './pendingInvitation.ts'
// Handoff-defined future exports: this slice intentionally starts at missing-module RED.
import { InvitationSession, INVITATION_SESSION_KEY, type RouteLease } from './invitationSession.ts'

const secret = 'Synthetic-AbCd-1234'
const otherId = '12345678-1234-4000-8000-123456789abc'
const link = (code = secret, target = 'ct-classics-2026') =>
  `https://peen.app/app/invite/${target}#code=${encodeURIComponent(code)}`
const invitation = { challengeId: CT_CLASSICS_CHALLENGE_ID, code: secret }
function fixture() {
  let time = 1_000_000
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
  const now = () => time
  return { values, storage, now, at: (value: number) => { time = value },
    session: () => new InvitationSession(storage, now) }
}
const record = (accountId: string | null = null) => ({
  version: 1, ...invitation, createdAt: 1_000_000, accountId,
})

test('authoritative account observations publish synchronously even without context', () => {
  const session = fixture().session()
  const snapshots: unknown[] = []
  assert.equal(session.accountId(), undefined)
  assert.equal(session.revision(), 0)
  const unsubscribe = session.subscribe((...args: unknown[]) => {
    assert.deepEqual(args, [])
    snapshots.push([session.revision(), session.accountId(), session.current()])
  })
  for (const account of [null, 'A', 'B', 'A']) session.observeAccount(account)
  assert.deepEqual(snapshots, [[1, null, null], [2, 'A', null], [3, 'B', null], [4, 'A', null]])
  session.observeAccount('A')
  assert.equal(session.revision(), 4)
  unsubscribe()
  session.observeAccount(null)
  assert.equal(session.revision(), 5)
  assert.equal(snapshots.length, 4)
})

test('capture replacements publish but rescans and first login preserve the lifetime', () => {
  const f = fixture()
  const session = f.session()
  let calls = 0
  session.subscribe(() => { calls++ })
  session.capture(link(), null)
  assert.equal(session.accountId(), undefined)
  assert.equal(session.revision(), 1)
  f.at(1_000_100)
  session.capture(link(), null)
  assert.equal(session.revision(), 1)
  session.observeAccount(null)
  session.observeAccount('A')
  assert.deepEqual(session.current(), invitation)
  assert.deepEqual(JSON.parse(f.values.get(INVITATION_SESSION_KEY)!), record('A'))
  session.capture(link(), 'A')
  assert.equal(session.revision(), 3)
  session.capture(link('replacement'), 'A')
  assert.equal(session.revision(), 4)
  assert.equal(calls, 4)
  assert.equal(JSON.parse(f.values.get(INVITATION_SESSION_KEY)!).createdAt, 1_000_100)
  session.observeAccount('B')
  assert.equal(session.current(), null)
  assert.equal(session.revision(), 5)
  session.observeAccount('A')
  assert.equal(session.current(), null)
  assert.equal(session.revision(), 6)
})

test('clear, expiry and successful join publish removals exactly once', () => {
  for (const action of ['clear', 'expiry', 'success']) {
    const f = fixture()
    const session = f.session()
    session.capture(link(), null)
    session.observeAccount('A')
    const before = session.revision()
    const token = session.beginJoin('A')!
    assert.ok(token)
    assert.equal(session.revision(), before)
    assert.equal(session.finishJoin(token, 'A', false), true)
    assert.equal(session.revision(), before)
    const retry = session.beginJoin('A')!
    let calls = 0
    const unsubscribe = session.subscribe(() => {
      calls++
      assert.equal(session.peek(), null)
      assert.equal(session.current(), null)
    })
    if (action === 'clear') session.clear()
    else if (action === 'expiry') {
      f.at(1_899_999)
      assert.deepEqual(session.peek(), invitation)
      assert.deepEqual(session.current(), invitation)
      f.at(1_900_000)
      assert.deepEqual(session.peek(), invitation)
      assert.equal(session.current(), null)
    }
    else assert.equal(session.finishJoin(retry, 'A', true), true)
    assert.equal(session.revision(), before + 1)
    assert.equal(calls, 1)
    unsubscribe()
    assert.equal(session.peek(), null)
    session.clear()
    assert.equal(session.peek(), null)
    assert.equal(session.current(), null)
    assert.equal(session.revision(), before + 1)
    assert.equal(session.accepts(retry, 'A'), false)
    assert.equal(f.session().current(), null)
  }
})

test('throwing and reentrant observers see committed private snapshots with bounded delivery', () => {
  const f = fixture()
  const session = f.session()
  session.capture(link(), 'A')
  session.observeAccount('A')
  let calls = 0
  const throwingSnapshots: unknown[] = []
  session.subscribe(() => {
    throwingSnapshots.push(session.peek())
    throw new Error('observer failure')
  })
  session.subscribe(() => {
    calls++
    assert.equal(session.accountId(), 'B')
    assert.equal(session.peek(), null)
    assert.equal(session.current(), null)
    assert.equal(f.values.has(INVITATION_SESSION_KEY), false)
    session.observeAccount('A')
    assert.equal(session.peek(), null)
    session.capture(link(), 'A')
    assert.deepEqual(session.peek(), invitation)
    const copy = session.peek()!
    ;(copy as { code: string }).code = 'changed'
    assert.deepEqual(session.peek(), invitation)
    session.clear()
    assert.equal(session.peek(), null)
  })
  const snapshots: unknown[] = []
  session.subscribe((...args: unknown[]) => {
    assert.deepEqual(args, [])
    snapshots.push([session.revision(), session.accountId(), session.current()])
  })
  session.observeAccount('B')
  assert.equal(calls, 1)
  assert.deepEqual(snapshots, [[6, 'A', null]])
  assert.deepEqual(throwingSnapshots, [null])
  assert.equal(session.peek(), null)
  assert.deepEqual(Object.keys(session), [])
  assert.deepEqual(Object.getOwnPropertyNames(session), [])
  assert.deepEqual(Object.getOwnPropertySymbols(session), [])
  assert.equal(JSON.stringify(session), '{}')
})

test('versioned guest recovery, first login and same-owner reload preserve creation time', () => {
  assert.equal(INVITATION_SESSION_KEY, 'peen.pending-invitation.v1')
  assert.equal(INVITATION_TTL_MS, 900_000)
  const f = fixture()
  const first = f.session()
  assert.equal(first.capture(link(), null), true)
  assert.deepEqual(JSON.parse(f.values.get(INVITATION_SESSION_KEY)!), record())
  f.at(1_000_100)
  const recovered = f.session()
  assert.deepEqual(recovered.peek(), invitation)
  assert.deepEqual(recovered.current(), invitation)
  recovered.observeAccount('owner')
  assert.deepEqual(recovered.peek(), invitation)
  assert.deepEqual(JSON.parse(f.values.get(INVITATION_SESSION_KEY)!), record('owner'))
  f.at(1_000_200)
  assert.equal(recovered.capture(link(), 'owner'), true)
  const owned = f.session()
  owned.observeAccount('owner')
  assert.deepEqual(owned.current(), invitation)
  assert.deepEqual(JSON.parse(f.values.get(INVITATION_SESSION_KEY)!), record('owner'))
  assert.deepEqual(owned.peek(), invitation)
  let clockReads = 0
  let storageCalls = 0
  const pure = new InvitationSession({
    getItem: key => { storageCalls++; return f.storage.getItem(key) },
    setItem: (key, value) => { storageCalls++; f.storage.setItem(key, value) },
    removeItem: key => { storageCalls++; f.storage.removeItem(key) },
  }, () => { clockReads++; return f.now() })
  let publications = 0
  const unsubscribe = pure.subscribe(() => { publications++ })
  const beforeReads = [clockReads, storageCalls, pure.revision()]
  const persisted = f.values.get(INVITATION_SESSION_KEY)
  const copy = pure.peek()!
  ;(copy as { code: string }).code = 'changed'
  for (let i = 0; i < 5; i++) {
    assert.deepEqual(pure.peek(), invitation)
    assert.notEqual(pure.peek(), pure.peek())
  }
  assert.deepEqual([clockReads, storageCalls, pure.revision()], beforeReads)
  assert.equal(publications, 0)
  assert.equal(f.values.get(INVITATION_SESSION_KEY), persisted)
  assert.equal(JSON.stringify(pure), '{}')
  unsubscribe()
  assert.deepEqual(pure.peek(), invitation)
  const snapshot = owned.current()!
  try { (snapshot as { code: string }).code = 'changed' } catch (error) {
    assert.ok(error instanceof TypeError)
  }
  assert.deepEqual(owned.current(), invitation)
  const token = owned.beginJoin('owner')!
  assert.ok(token)
  assert.equal(JSON.stringify(owned).includes(secret), false)
  assert.equal(JSON.stringify(token).includes(secret), false)
  assert.deepEqual(Object.keys(token).sort(), ['accountId', 'challengeId', 'generation'])
  f.at(1_899_999)
  assert.deepEqual(owned.current(), invitation)
  f.at(1_900_000)
  assert.deepEqual(pure.peek(), invitation)
  assert.deepEqual([clockReads, storageCalls, pure.revision()], beforeReads)
  assert.equal(owned.current(), null)
  assert.equal(owned.peek(), null)
  assert.equal(pure.current(), null)
  assert.equal(pure.peek(), null)
  assert.equal(f.values.has(INVITATION_SESSION_KEY), false)
  assert.equal(owned.accepts(token, 'owner'), false)
  assert.equal(f.session().current(), null)
})

test('invalid persisted recovery records are discarded safely', () => {
  const invalid = [
    '{', 'null', '[]', JSON.stringify({}),
    ...[
      { version: 2 }, { version: '1' }, { challengeId: 7 },
      { challengeId: 'not-a-uuid' }, { code: 7 }, { code: '' },
      { code: 'x\n' }, { code: 'x'.repeat(257) },
      { accountId: 7 }, { accountId: {} }, { accountId: '' },
      { createdAt: '1000000' }, { createdAt: null },
      { createdAt: 1_000_001 }, { createdAt: 100_000 },
    ].map(change => JSON.stringify({ ...record(), ...change })),
    JSON.stringify(record()).replace('1000000', '1e400'),
  ]
  for (const raw of invalid) {
    const f = fixture()
    f.values.set(INVITATION_SESSION_KEY, raw)
    const session = f.session()
    assert.equal(session.current(), null, raw)
    assert.equal(f.values.has(INVITATION_SESSION_KEY), false, raw)
    assert.equal(session.returnPath(), '/app/')
  }
})

test('storage failures and unavailable storage leave usable bounded memory', () => {
  for (const failure of ['getItem', 'setItem', 'removeItem', 'all', 'null']) {
    const f = fixture()
    const storage = failure === 'null' ? null : {
      getItem: (key: string) => {
        if (failure === 'getItem' || failure === 'all') throw new Error('read failed')
        return f.storage.getItem(key)
      },
      setItem: (key: string, value: string) => {
        if (failure === 'setItem' || failure === 'all') throw new Error('write failed')
        f.storage.setItem(key, value)
      },
      removeItem: (key: string) => {
        if (failure === 'removeItem' || failure === 'all') throw new Error('remove failed')
        f.storage.removeItem(key)
      },
    }
    const session = new InvitationSession(storage, f.now)
    assert.equal(session.capture(link(), null), true)
    session.observeAccount('owner')
    assert.deepEqual(session.current(), invitation)
    const token = session.beginJoin('owner')!
    assert.ok(token)
    assert.equal(session.finishJoin(token, 'owner', false), true)
    f.at(1_900_000)
    assert.equal(session.current(), null)
    assert.equal(new InvitationSession(storage, f.now).current(), null)
    assert.equal(session.capture(link('replacement'), 'owner'), true)
    session.clear()
    assert.equal(session.current(), null)
    assert.equal(new InvitationSession(storage, f.now).current(), null)
  }
})

test('strict capture rejects unsafe destinations and derives only secret-free paths', () => {
  const session = fixture().session()
  assert.equal(session.returnPath(), '/app/')
  assert.equal(session.capture(link(), null), true)
  assert.equal(session.returnPath(), '/app/invite/ct-classics-2026')
  const unsafe = [
    link().replace('https:', 'http:'), link().replace('peen.app', 'evil.example'),
    link().replace('peen.app', 'peen.app.evil.example'),
    link().replace('peen.app', 'user@peen.app'), link() + '&next=https://evil.example',
    link().replace('#', '?next=https://evil.example#'), link() + '#extra',
    link().replace(secret, '%ZZ'), link().replace(secret, '%00'),
    'https://peen.app/app/invite/not-a-uuid#code=x', '/app/invite/ct-classics-2026#code=x',
  ]
  for (const raw of unsafe) {
    assert.equal(session.capture(raw, null), false, raw)
    assert.deepEqual(session.current(), invitation)
    assert.equal(session.returnPath(), '/app/invite/ct-classics-2026')
  }
  assert.equal(session.capture(link('Case%+Kept', otherId.toUpperCase()), null), true)
  assert.deepEqual(session.current(), { challengeId: otherId, code: 'Case%+Kept' })
  assert.equal(session.returnPath(), `/app/invite/${otherId}`)
})

test('explicit authenticated join gates duplicates, permits retry and clears success', () => {
  const f = fixture()
  const session = f.session()
  assert.equal(session.beginJoin('owner'), null)
  session.capture(link(), null)
  assert.equal(session.beginJoin(null), null)
  session.observeAccount('owner')
  const token = session.beginJoin('owner')!
  assert.ok(token)
  assert.equal(session.beginJoin('owner'), null)
  assert.equal(session.capture(link('replacement'), 'owner'), false)
  assert.equal(session.accepts({ ...token }, 'owner'), false)
  assert.equal(session.finishJoin({ ...token }, 'owner', true), false)
  assert.deepEqual(session.current(), invitation)
  assert.equal(session.finishJoin(token, 'owner', false), true)
  assert.equal(session.accepts(token, 'owner'), false)
  const retry = session.beginJoin('owner')!
  assert.ok(retry)
  assert.equal(session.finishJoin(retry, 'owner', true), true)
  assert.equal(session.current(), null)
  assert.equal(session.returnPath(), '/app/')
  assert.equal(f.values.has(INVITATION_SESSION_KEY), false)
})

test('clear, logout and switching accounts invalidate tokens and isolate replacements', () => {
  for (const action of ['clear', 'logout', 'switch', 'other-account']) {
    const f = fixture()
    const session = f.session()
    session.capture(link(), 'owner')
    session.observeAccount('owner')
    assert.deepEqual(session.peek(), invitation)
    const old = session.beginJoin('owner')!
    const projections: unknown[] = []
    const unsubscribe = session.subscribe(() => { projections.push(session.peek()) })
    if (action === 'clear') session.clear()
    else if (action === 'other-account') assert.equal(session.accepts(old, 'other'), false)
    else session.observeAccount(action === 'logout' ? null : 'other')
    assert.equal(session.peek(), null)
    assert.deepEqual(projections, [null])
    session.observeAccount('owner')
    assert.equal(session.peek(), null)
    assert.equal(session.accepts(old, 'owner'), false)
    unsubscribe()
    assert.equal(session.current(), null)
    assert.equal(f.values.has(INVITATION_SESSION_KEY), false)
    session.capture(link('replacement'), 'owner')
    assert.equal(session.finishJoin(old, 'owner', true), false)
    assert.deepEqual(session.current(), { ...invitation, code: 'replacement' })
    const copy = session.peek()!
    ;(copy as { code: string }).code = 'changed'
    assert.deepEqual(session.peek(), { ...invitation, code: 'replacement' })
    session.observeAccount('other')
    assert.equal(session.peek(), null)
    session.observeAccount('owner')
    assert.equal(session.peek(), null)
    assert.equal(session.finishJoin(old, 'owner', true), false)
    assert.equal(session.peek(), null)
  }
})

test('route replacement ignores stale releases and keeps the original expiry', () => {
  const f = fixture()
  const session = f.session()
  assert.equal(session.capture(link(), null), true)
  const first = session.claimRoute()
  const second = session.claimRoute()
  assert.equal(session.releaseRoute(first), false)
  assert.deepEqual(session.peek(), invitation)
  assert.equal(session.ownsRoute(first), false)
  assert.equal(session.ownsRoute(second), true)
  assert.deepEqual(JSON.parse(f.values.get(INVITATION_SESSION_KEY)!), record())
  f.at(1_000_000 + INVITATION_TTL_MS - 1)
  assert.deepEqual(session.current(), invitation)
  f.at(1_000_000 + INVITATION_TTL_MS)
  assert.equal(session.current(), null)
  assert.equal(session.capture(link('fresh'), null), true)
  assert.equal(session.releaseRoute(second), true)
  assert.equal(session.ownsRoute(second), false)
  assert.equal(session.peek(), null)
  assert.equal(f.values.has(INVITATION_SESSION_KEY), false)
  assert.equal(session.releaseRoute(second), false)
})

test('reentrant successors during route release keep their lease and context and deny navigation', () => {
  for (const replace of [true, false]) {
    const f = fixture()
    const session = f.session()
    session.capture(link(), null)
    const old = session.claimRoute()
    const leases: RouteLease[] = []
    const stale: boolean[] = []
    const navigations: string[] = []
    const cancel = (lease: RouteLease) => {
      if (session.releaseRoute(lease)) navigations.push('/crew')
    }
    const unsubscribe = session.subscribe(() => {
      if (leases.length > 0) return
      stale.push(session.releaseRoute(old))
      leases.push(session.claimRoute())
      if (replace) session.capture(link('replacement'), null)
    })
    cancel(old)
    unsubscribe()
    assert.deepEqual(navigations, [])
    assert.deepEqual(stale, [false])
    assert.equal(leases.length, 1)
    assert.equal(session.ownsRoute(leases[0]), true)
    assert.equal(session.ownsRoute(old), false)
    cancel(old)
    assert.deepEqual(navigations, [])
    assert.equal(session.ownsRoute(leases[0]), true)
    if (replace) {
      assert.deepEqual(session.peek(), { ...invitation, code: 'replacement' })
      assert.equal(JSON.parse(f.values.get(INVITATION_SESSION_KEY)!).code, 'replacement')
    } else {
      assert.equal(session.peek(), null)
    }
    cancel(leases[0])
    assert.deepEqual(navigations, ['/crew'])
    assert.equal(session.peek(), null)
    assert.equal(f.values.has(INVITATION_SESSION_KEY), false)
  }
})

test('a released route cannot be revived from storage', () => {
  const f = fixture()
  const session = f.session()
  const lease = session.claimRoute()
  session.capture(link(), null)
  assert.equal(session.releaseRoute(lease), true)
  assert.equal(session.current(), null)
  assert.equal(f.values.has(INVITATION_SESSION_KEY), false)
  assert.equal(f.session().current(), null)
})

test('capture, recovery, account and return-path bookkeeping send zero fetch requests', () => {
  const original = globalThis.fetch
  const requests: unknown[] = []
  globalThis.fetch = async (...args) => { requests.push(args); throw new Error('unexpected request') }
  try {
    const f = fixture()
    const session = f.session()
    const unsubscribe = session.subscribe(() => {
      session.revision()
      session.accountId()
      session.current()
    })
    session.capture(link(), null)
    session.current()
    session.observeAccount('owner')
    session.returnPath()
    f.session().current()
    session.clear()
    unsubscribe()
    assert.deepEqual(requests, [])
  } finally { globalThis.fetch = original }
})
