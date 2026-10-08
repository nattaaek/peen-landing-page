import test from 'node:test'
import assert from 'node:assert/strict'
import { INVITATION_TTL_MS, PendingInvitation, type InvitationJoinToken } from './pendingInvitation.ts'
import { CT_CLASSICS_CHALLENGE_ID, type InvitationLink } from './invitationLink.ts'

const NOW = 1_000_000
const A = 'account-a'
const B = 'account-b'
const UUID = '12345678-1234-4234-8234-123456789abc'
const SECRET = 'Synthetic-Secret+a%2Bb'
const invitation = (code = SECRET, challengeId = UUID): InvitationLink => ({ challengeId, code })
function prepared(accountId: string | null = A): PendingInvitation {
  const holder = new PendingInvitation()
  assert.equal(holder.replace(invitation(), accountId, NOW), true)
  return holder
}
function tokenFor(holder: PendingInvitation, now = NOW): InvitationJoinToken {
  const token = holder.beginJoin(A, now)
  assert.ok(token)
  return token
}

test('validates UUID and string code containers before preparation', () => {
  const invalid: unknown[] = [
    null, undefined, {}, { challengeId: UUID }, { code: SECRET },
    { challengeId: 'ct-classics-2026', code: SECRET },
    { challengeId: UUID + '/extra', code: SECRET },
    { challengeId: ' ' + UUID, code: SECRET },
    { challengeId: 'https://peen.app/app/invite/' + UUID, code: SECRET },
    { challengeId: 42, code: SECRET },
    { challengeId: new String(UUID), code: SECRET },
    { challengeId: UUID, code: 42 },
    { challengeId: UUID, code: new String(SECRET) },
    { challengeId: UUID, code: ['secret'] },
  ]
  for (const value of invalid) {
    const holder = new PendingInvitation()
    assert.equal(holder.replace(value as InvitationLink, null, NOW), false)
    assert.equal(holder.current(NOW), null)
  }
  const holder = new PendingInvitation()
  assert.equal(holder.replace(invitation(SECRET, CT_CLASSICS_CHALLENGE_ID), null, NOW), true)
  assert.deepEqual(holder.current(NOW), invitation(SECRET, CT_CLASSICS_CHALLENGE_ID))
})

test('trims boundaries, preserves case and escapes, and does not add typed prefixes', () => {
  for (const code of ['aBcD-EfGh-IjKl', 'PODA-aBcD-EfGh-IjKl', SECRET]) {
    const holder = new PendingInvitation()
    assert.equal(holder.replace(invitation(' \t' + code + '\n ', CT_CLASSICS_CHALLENGE_ID), null, NOW), true)
    assert.deepEqual(holder.current(NOW), invitation(code, CT_CLASSICS_CHALLENGE_ID))
  }
})

test('accepts 1–256 Unicode codepoints and rejects empty, long, C0 and DEL codes', () => {
  for (const code of ['x', '😀'.repeat(256)]) {
    const holder = new PendingInvitation()
    assert.equal(holder.replace(invitation(code), null, NOW), true)
    assert.equal(holder.current(NOW)?.code, code)
  }
  const invalid = ['', ' \t\n ', '😀'.repeat(257), 'x\u007fy']
  for (let value = 0; value <= 31; value++) invalid.push('x' + String.fromCharCode(value) + 'y')
  for (const code of invalid) {
    const holder = new PendingInvitation()
    assert.equal(holder.replace(invitation(code), null, NOW), false)
    assert.equal(holder.current(NOW), null)
  }
})

test('copies input and snapshots and keeps holder and token serialization secret-free', () => {
  const input = { challengeId: UUID, code: SECRET }
  const holder = new PendingInvitation()
  assert.equal(holder.replace(input, A, NOW), true)
  input.code = 'changed'
  input.challengeId = CT_CLASSICS_CHALLENGE_ID
  const snapshot = holder.current(NOW)
  assert.ok(snapshot)
  assert.notEqual(snapshot, input)
  try { Object.assign(snapshot, { code: 'changed', challengeId: CT_CLASSICS_CHALLENGE_ID }) } catch (error) {
    assert.ok(error instanceof TypeError)
  }
  assert.deepEqual(holder.current(NOW), invitation())
  const token = tokenFor(holder)
  assert.deepEqual(Object.keys(token).sort(), ['accountId', 'challengeId', 'generation'])
  assert.equal(token.accountId, A)
  assert.equal(token.challengeId, UUID)
  assert.ok(Number.isInteger(token.generation))
  assert.deepEqual(Reflect.ownKeys(holder), [])
  for (const value of [holder, token]) {
    assert.equal(String(value).includes(SECRET), false)
    assert.equal(JSON.stringify(value).includes(SECRET), false)
  }
})

test('guest observations and first login preserve context without automatically joining', () => {
  const holder = prepared(null)
  holder.observeAccount(null, NOW + 1)
  assert.equal(holder.beginJoin(null, NOW + 2), null)
  holder.observeAccount(A, NOW + 3)
  assert.deepEqual(holder.current(NOW + 3), invitation())
  const token = tokenFor(holder, NOW + 4)
  assert.equal(holder.accepts(token, A, NOW + 4), true)
})

test('expires exactly at fifteen minutes and cannot be revived by login', () => {
  assert.equal(INVITATION_TTL_MS, 900_000)
  const holder = prepared(null)
  assert.deepEqual(holder.current(NOW + INVITATION_TTL_MS - 1), invitation())
  assert.equal(holder.current(NOW + INVITATION_TTL_MS), null)
  holder.observeAccount(A, NOW + INVITATION_TTL_MS + 1)
  assert.equal(holder.current(NOW + INVITATION_TTL_MS + 1), null)
  assert.equal(holder.beginJoin(A, NOW + INVITATION_TTL_MS + 1), null)
})

test('identical rescan preserves generation and the original deadline', () => {
  const holder = prepared()
  const first = tokenFor(holder)
  assert.equal(holder.finishJoin(first, A, NOW + 1, false), true)
  assert.equal(holder.replace(invitation(), A, NOW + 100), true)
  const second = tokenFor(holder, NOW + 101)
  assert.equal(second.generation, first.generation)
  assert.equal(holder.accepts(first, A, NOW + 101), false)
  assert.equal(holder.accepts(second, A, NOW + INVITATION_TTL_MS - 1), true)
  assert.equal(holder.accepts(second, A, NOW + INVITATION_TTL_MS), false)
  assert.equal(holder.current(NOW + INVITATION_TTL_MS), null)
})

test('backwards and nonfinite clocks invalidate through every clocked operation', () => {
  for (const bad of [NOW - 1, NaN, Infinity, -Infinity]) {
    for (const operation of ['replace', 'current', 'observe', 'begin', 'accepts', 'finish']) {
      const holder = prepared()
      const token = tokenFor(holder)
      if (operation === 'replace') assert.equal(holder.replace(invitation(), A, bad), false)
      if (operation === 'current') assert.equal(holder.current(bad), null)
      if (operation === 'observe') holder.observeAccount(A, bad)
      if (operation === 'begin') assert.equal(holder.beginJoin(A, bad), null)
      if (operation === 'accepts') assert.equal(holder.accepts(token, A, bad), false)
      if (operation === 'finish') assert.equal(holder.finishJoin(token, A, bad, true), false)
      assert.equal(holder.current(NOW + 1), null)
      assert.equal(holder.accepts(token, A, NOW + 1), false)
    }
    const empty = new PendingInvitation()
    const finite = Number.isFinite(bad)
    assert.equal(empty.replace(invitation(), A, bad), finite)
    assert.deepEqual(empty.current(NOW), finite ? invitation() : null)
  }
})

test('clear, logout, switch and A-B-A invalidate context and active tokens', () => {
  for (const action of ['clear', 'logout', 'switch', 'roundtrip']) {
    const holder = prepared()
    const token = tokenFor(holder)
    if (action === 'clear') holder.clear()
    else holder.observeAccount(action === 'logout' ? null : B, NOW + 1)
    if (action === 'roundtrip') holder.observeAccount(A, NOW + 2)
    assert.equal(holder.current(NOW + 3), null)
    assert.equal(holder.accepts(token, A, NOW + 3), false)
    assert.equal(holder.finishJoin(token, A, NOW + 3, true), false)
    assert.equal(holder.beginJoin(A, NOW + 3), null)
  }
})

test('only explicit authenticated begin creates a token and blocks duplicate joins and replacement', () => {
  const holder = prepared()
  const token = tokenFor(holder)
  assert.equal(holder.beginJoin(A, NOW), null)
  assert.equal(holder.replace(invitation('replacement'), A, NOW), false)
  assert.deepEqual(holder.current(NOW), invitation())
  assert.equal(holder.accepts(token, A, NOW), true)
  assert.equal(holder.accepts({ ...token }, A, NOW), false)
  assert.equal(holder.accepts({ ...token, generation: token.generation + 1 }, A, NOW), false)
  assert.equal(holder.accepts({ ...token, accountId: B }, A, NOW), false)
  assert.equal(holder.finishJoin({ ...token }, A, NOW, true), false)
  assert.equal(holder.accepts(token, A, NOW), true)
  for (const account of [null, B]) {
    const other = prepared()
    const active = tokenFor(other)
    assert.equal(other.accepts(active, account, NOW), false)
    assert.equal(other.finishJoin(active, account, NOW, true), false)
    assert.equal(prepared().beginJoin(account, NOW), null)
  }
})

test('denial permits deliberate retry; replacement rejects old tokens; success clears context', () => {
  const holder = prepared()
  const denied = tokenFor(holder)
  assert.equal(holder.finishJoin(denied, A, NOW + 1, false), true)
  assert.deepEqual(holder.current(NOW + 1), invitation())
  assert.equal(holder.accepts(denied, A, NOW + 1), false)
  const retry = tokenFor(holder, NOW + 2)
  assert.notEqual(retry, denied)
  assert.equal(holder.finishJoin(denied, A, NOW + 2, true), false)
  assert.equal(holder.accepts(retry, A, NOW + 2), true)
  assert.equal(holder.finishJoin(retry, A, NOW + 3, false), true)
  assert.equal(holder.replace(invitation('replacement'), A, NOW + 4), true)
  const replacement = tokenFor(holder, NOW + 5)
  assert.notEqual(replacement.generation, retry.generation)
  assert.equal(holder.finishJoin(retry, A, NOW + 5, true), false)
  assert.equal(holder.finishJoin(replacement, A, NOW + 6, true), true)
  assert.equal(holder.current(NOW + 6), null)
  assert.equal(holder.accepts(replacement, A, NOW + 6), false)
  assert.equal(holder.beginJoin(A, NOW + 6), null)
  const expired = prepared()
  assert.equal(expired.finishJoin(tokenFor(expired), A, NOW + INVITATION_TTL_MS, false), false)
  assert.equal(expired.current(NOW + INVITATION_TTL_MS), null)
})

test('preparation, authentication and join bookkeeping perform zero fetch calls', () => {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = (() => {
    calls++
    throw new Error('Unexpected network request')
  }) as typeof globalThis.fetch
  try {
    const holder = prepared(null)
    holder.current(NOW)
    holder.observeAccount(null, NOW)
    holder.observeAccount(A, NOW)
    const denied = tokenFor(holder)
    holder.accepts(denied, A, NOW)
    holder.finishJoin(denied, A, NOW, false)
    holder.finishJoin(tokenFor(holder), A, NOW, true)
    holder.clear()
    assert.equal(calls, 0)
  } finally {
    globalThis.fetch = original
  }
})
