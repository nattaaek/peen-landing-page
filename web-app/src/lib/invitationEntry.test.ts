import test from 'node:test'
import assert from 'node:assert/strict'
import { invitationChallengeId, captureInvitationEntry, watchInvitationEntries } from './invitationEntry.ts'
import { CT_CLASSICS_CHALLENGE_ID } from './invitationLink.ts'
import { InvitationSession, INVITATION_SESSION_KEY } from './invitationSession.ts'
import { INVITATION_TTL_MS } from './pendingInvitation.ts'

const path = '/app/invite/ct-classics-2026'
const otherId = '12345678-abcd-4000-8000-123456789abc'
const code = 'AbCd-EfGh-IjKl'
const raw = `https://peen.app${path}#code=${code}`
function location(href: string) {
  const url = new URL(href)
  return { href, pathname: url.pathname, search: url.search, hash: url.hash }
}
function fixture() {
  let time = 10_000
  const data = new Map<string, string>()
  const events: string[] = []
  const captures: Array<[string, string | null]> = []
  const replacements: string[] = []
  const storage = {
    getItem(key: string) { events.push('get'); return data.get(key) ?? null },
    setItem(key: string, value: string) { events.push('set'); data.set(key, value) },
    removeItem(key: string) { events.push('remove'); data.delete(key) },
  }
  function instrument(session: InvitationSession) {
    const capture = session.capture.bind(session)
    session.capture = (value, account) => {
      events.push('capture'); captures.push([value, account])
      return capture(value, account)
    }
    const beginJoin = session.beginJoin.bind(session)
    session.beginJoin = account => { events.push('join'); return beginJoin(account) }
    return session
  }
  let session = instrument(new InvitationSession(storage, () => time))
  return {
    data, events, captures, replacements,
    get session() { return session },
    setTime(value: number) { time = value },
    reload() { session = instrument(new InvitationSession(storage, () => time)) },
    reset() { events.length = 0; captures.length = 0; replacements.length = 0 },
    enter(value: ReturnType<typeof location>) {
      return captureInvitationEntry(session, value, clean => {
        events.push('replace'); replacements.push(clean)
      })
    },
    record() { return JSON.parse(data.get(INVITATION_SESSION_KEY)!) },
  }
}
function browser(f: ReturnType<typeof fixture>, href: string) {
  const events = new EventTarget()
  let current = location(href)
  const unsubscribe = watchInvitationEntries(f.session, events, () => current, clean => {
    f.events.push('replace'); f.replacements.push(clean)
    current = location(`https://peen.app${clean}`)
  })
  return {
    unsubscribe,
    get location() { return current },
    navigate(next: string, ...types: string[]) {
      current = location(next)
      for (const type of types) events.dispatchEvent(new Event(type))
    },
  }
}
function offline(run: () => void) {
  const originalFetch = globalThis.fetch
  const requests: unknown[][] = []
  globalThis.fetch = async (...args) => {
    requests.push(args)
    throw new Error('Invitation bookkeeping must not request the network')
  }
  try { run() } finally { globalThis.fetch = originalFetch }
  assert.deepEqual(requests, [])
}
const cleanHref = `https://peen.app${path}`
const invitation = { challengeId: CT_CLASSICS_CHALLENGE_ID, code }

test('browser invitation entry scrubs before capture and preserves bounded recovery', () => {
  const originalFetch = globalThis.fetch
  const requests: unknown[][] = []
  globalThis.fetch = async (...args) => {
    requests.push(args)
    throw new Error('Invitation bookkeeping must not request the network')
  }
  const fixtures: ReturnType<typeof fixture>[] = []
  const make = () => { const f = fixture(); fixtures.push(f); return f }
  try {
    assert.equal(invitationChallengeId(path), CT_CLASSICS_CHALLENGE_ID)
    assert.equal(invitationChallengeId(`/app/invite/${otherId.toUpperCase()}`), otherId)
    for (const suffix of ['/', '/extra', '?code=x', '#code=x', '\n']) {
      assert.equal(invitationChallengeId(path + suffix), null)
    }
    for (const invalid of [
      '/app/invite', '/app/invite/', '/app/invite/unknown',
      '/app/invite/%63t-classics-2026', '/app/invite/./ct-classics-2026',
      '/app/invite/x/../ct-classics-2026', '/app/invite\\ct-classics-2026',
      `/app/invite/${otherId.slice(0, -1)}`, `/app/invite/${otherId}0`,
    ]) assert.equal(invitationChallengeId(invalid), null)

    const valid = make()
    valid.reset()
    assert.equal(valid.enter(location(raw)), true)
    assert.deepEqual(valid.replacements, [path])
    assert.deepEqual(valid.captures, [[raw, null]])
    assert.deepEqual(valid.events, ['replace', 'capture', 'set'])
    assert.deepEqual(valid.session.current(), { challengeId: CT_CLASSICS_CHALLENGE_ID, code })

    const invalidLinks = [
      `https://peen.app${path}?code=secret#code=${code}`,
      `https://peen.app${path}#code=`, `https://peen.app${path}#`,
      `https://peen.app${path}#code=%`, `https://peen.app${path}#code=x&extra=y`,
      `http://peen.app${path}#code=x`, `https://PEEN.APP${path}#code=x`,
      `https://peen.app:443${path}#code=x`, `https://user@peen.app${path}#code=x`,
      `https://peen.app.evil.test${path}#code=x`,
      'https://peen.app/app/invite#code=x', 'https://peen.app/app/invite/#code=x',
      'https://peen.app/app/invite/unknown#code=x',
      `https://peen.app/app/invite/./ct-classics-2026#code=x`,
      `https://peen.app/app/invite/x/../ct-classics-2026#code=x`,
      'https://peen.app/app/invite/%63t-classics-2026#code=x',
      'https://peen.app/app/invite\\ct-classics-2026#code=x',
    ].map(location)
    invalidLinks.push({ ...location(raw), pathname: `/app/invite/${otherId}` })
    invalidLinks.push({ ...location(raw), search: '?secret=x' })
    invalidLinks.push({ ...location(raw), hash: '' })
    for (const entry of invalidLinks) {
      const f = make()
      assert.equal(f.session.capture(raw, null), true)
      f.reset()
      assert.equal(f.enter(entry), false, entry.href)
      assert.equal(f.events[0], 'replace', entry.href)
      assert.equal(f.replacements.length, 1)
      const clean = f.replacements[0]
      assert.ok(clean === '/app/invite/invalid' || invitationChallengeId(clean) !== null)
      assert.ok(!/[?#\\]/.test(clean))
      assert.deepEqual(f.captures, [])
      assert.equal(f.session.current(), null)
      assert.equal(f.data.has(INVITATION_SESSION_KEY), false)
    }

    const ordinary = make()
    ordinary.session.capture(raw, 'account-a')
    const before = ordinary.data.get(INVITATION_SESSION_KEY)
    ordinary.reset()
    assert.equal(ordinary.enter(location('https://peen.app/auth/callback?code=oauth-code')), false)
    assert.deepEqual(ordinary.events, [])
    assert.equal(ordinary.data.get(INVITATION_SESSION_KEY), before)

    for (const owner of [null, 'account-a']) {
      const f = make()
      f.session.capture(raw, owner)
      f.setTime(10_000 + INVITATION_TTL_MS - 1)
      f.reload(); f.reset()
      assert.equal(f.enter(location(`https://peen.app/app/invite/${CT_CLASSICS_CHALLENGE_ID.toUpperCase()}`)), true)
      assert.deepEqual(f.captures, [])
      assert.equal(f.record().createdAt, 10_000)
      assert.equal(f.record().accountId, owner)
      assert.equal(f.session.current()?.code, code)
      f.setTime(10_000 + INVITATION_TTL_MS)
      f.reload(); f.reset()
      assert.equal(f.enter(location(`https://peen.app${path}`)), false)
      assert.equal(f.session.current(), null)
      assert.equal(f.data.has(INVITATION_SESSION_KEY), false)
    }
    for (const mode of ['absent', 'mismatch', 'backward']) {
      const f = make()
      if (mode !== 'absent') f.session.capture(raw, null)
      if (mode === 'backward') f.setTime(9_999)
      f.reset()
      const target = mode === 'mismatch' ? `/app/invite/${otherId}` : path
      assert.equal(f.enter(location(`https://peen.app${target}`)), false)
      assert.deepEqual(f.captures, [])
      assert.equal(f.session.current(), null)
      assert.equal(f.data.has(INVITATION_SESSION_KEY), false)
    }
    assert.deepEqual(requests, [])
    for (const f of fixtures) assert.ok(!f.events.includes('join'))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('same-tab scan scrubs before capture and stays idempotent across popstate and hashchange', () => {
  offline(() => {
    const f = fixture()
    const page = browser(f, cleanHref)
    f.reset()
    const before = f.session.revision()
    page.navigate(raw, 'popstate', 'hashchange')
    assert.deepEqual(f.events.slice(0, 2), ['replace', 'capture'])
    assert.deepEqual(f.captures, [[raw, null]])
    assert.equal(page.location.hash, '')
    assert.equal(page.location.href, cleanHref)
    assert.deepEqual(f.session.current(), invitation)
    assert.equal(f.session.revision(), before + 1)
    page.unsubscribe()
    const replacements = f.replacements.length
    page.navigate(`https://peen.app${path}#code=Other-Code-0000`, 'hashchange')
    assert.equal(page.location.hash, '#code=Other-Code-0000')
    assert.equal(f.replacements.length, replacements)
    assert.deepEqual(f.captures, [[raw, null]])
    assert.deepEqual(f.session.current(), invitation)
    assert.equal(f.session.revision(), before + 1)
    assert.ok(!f.events.includes('join'))
  })
})

test('entry while signed in binds the invitation to that account', () => {
  offline(() => {
    const f = fixture()
    f.session.observeAccount('A')
    f.reset()
    assert.equal(f.enter(location(raw)), true)
    assert.equal(f.record().accountId, 'A')
    assert.deepEqual(f.captures, [[raw, 'A']])
    f.session.observeAccount('B')
    assert.equal(f.session.current(), null)
    assert.equal(f.data.has(INVITATION_SESSION_KEY), false)
    assert.ok(!f.events.includes('join'))
  })
})

test('same-code rescans after sign-in preserve the original expiry', () => {
  offline(() => {
    const f = fixture()
    assert.equal(f.enter(location(raw)), true)
    f.session.observeAccount('A')
    const revision = f.session.revision()
    f.setTime(10_100)
    assert.equal(f.enter(location(raw)), true)
    assert.equal(f.record().createdAt, 10_000)
    assert.equal(f.record().accountId, 'A')
    assert.equal(f.session.revision(), revision)
    const page = browser(f, cleanHref)
    f.setTime(10_200)
    page.navigate(raw, 'hashchange')
    assert.equal(page.location.href, cleanHref)
    assert.equal(f.record().createdAt, 10_000)
    assert.equal(f.session.revision(), revision)
    f.setTime(10_000 + INVITATION_TTL_MS - 1)
    assert.deepEqual(f.session.current(), invitation)
    f.setTime(10_000 + INVITATION_TTL_MS)
    assert.equal(f.session.current(), null)
    page.unsubscribe()
    assert.ok(!f.events.includes('join'))
  })
})

test('scans during an in-flight join cannot replace or start a join', () => {
  offline(() => {
    const f = fixture()
    f.session.observeAccount('A')
    assert.equal(f.enter(location(raw)), true)
    const page = browser(f, cleanHref)
    f.reset()
    const token = f.session.beginJoin('A')!
    assert.ok(token)
    page.navigate(raw, 'popstate', 'hashchange')
    page.navigate(`https://peen.app${path}#code=Other-Code-0000`, 'popstate', 'hashchange')
    assert.equal(page.location.href, cleanHref)
    assert.equal(f.session.accepts(token, 'A'), true)
    assert.deepEqual(f.session.current(), invitation)
    assert.equal(f.session.finishJoin(token, 'A', true), true)
    assert.equal(f.session.current(), null)
    assert.deepEqual(f.events.filter(event => event === 'join'), ['join'])
    page.unsubscribe()
  })
})

test('navigating back to the invite path after cancel does not revive the invitation', () => {
  offline(() => {
    const f = fixture()
    const page = browser(f, cleanHref)
    page.navigate(raw, 'popstate', 'hashchange')
    const lease = f.session.claimRoute()
    assert.equal(f.session.releaseRoute(lease), true)
    assert.equal(f.session.current(), null)
    f.reset()
    page.navigate('https://peen.app/app/crew', 'popstate')
    page.navigate(cleanHref, 'popstate')
    assert.deepEqual(f.captures, [])
    assert.equal(f.session.current(), null)
    assert.equal(f.data.has(INVITATION_SESSION_KEY), false)
    page.unsubscribe()
    assert.ok(!f.events.includes('join'))
  })
})
