import test from 'node:test'
import assert from 'node:assert/strict'
import { SeasonalJoinController, type SeasonalJoinAuthority, type SeasonalJoinSession } from './seasonalJoinController.ts'
import { CT_CLASSICS_CHALLENGE_ID, normalizeInvitationCode } from './invitationLink.ts'
const generic = 'Could not join. Try again.'
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return {promise, resolve, reject}
}
function fixture(
  resolveSession: () => Promise<SeasonalJoinSession | null> = async () => ({userId: 'alice', accessToken: 'private-token'}),
  backend: (code: string) => Promise<unknown> = async () => ({}),
) {
  let authority: SeasonalJoinAuthority = {accountId: 'alice', revision: 1}
  const calls: {challenge_id: string; invitation_code: string; token: string}[] = []
  const controller = new SeasonalJoinController(() => authority, resolveSession, async (params, token) => {
    calls.push({...params, token})
    return backend(params.invitation_code)
  })
  return {controller, calls, origin: () => ({...authority}), change: (next: SeasonalJoinAuthority) => { authority = next }}
}
test('stale origins and guests reject before lazy code access', async () => {
  const f = fixture()
  let reads = 0
  for (const origin of [{accountId: 'bob', revision: 1}, {accountId: 'alice', revision: 0}]) {
    await assert.rejects(f.controller.submit('campaign', () => { reads++; return 'secret' }, origin), {message: generic})
  }
  f.change({accountId: null, revision: 2})
  await assert.rejects(f.controller.submit('campaign', () => { reads++; return 'secret' }, f.origin()))
  assert.equal(reads, 0)
  assert.equal(f.calls.length, 0)
})
test('input side effects and delayed session changes reject without POST', async () => {
  const gate = deferred<SeasonalJoinSession | null>()
  const f = fixture(() => gate.promise)
  await assert.rejects(f.controller.submit('campaign', () => {
    f.change({accountId: 'bob', revision: 2}); return 'secret'
  }, f.origin()))
  f.change({accountId: 'alice', revision: 3})
  const pending = f.controller.submit('campaign', () => 'secret', f.origin())
  const rejected = assert.rejects(pending, {message: generic})
  assert.equal(f.calls.length, 0)
  f.change({accountId: 'bob', revision: 4})
  gate.resolve({userId: 'alice', accessToken: 'private-token'})
  await rejected
  assert.equal(f.calls.length, 0)
})
test('SDK user/token pair mismatch, missing credentials and A-B-A revisions reject', async () => {
  for (const session of [null, {userId: 'bob', accessToken: 'bob-token'}, {userId: 'alice', accessToken: ''}]) {
    const f = fixture(async () => session)
    await assert.rejects(f.controller.submit('campaign', () => 'secret', f.origin()))
    assert.equal(f.calls.length, 0)
  }
  const gate = deferred<SeasonalJoinSession | null>()
  const f = fixture(() => gate.promise)
  const pending = f.controller.submit('campaign', () => 'secret', f.origin())
  const rejected = assert.rejects(pending)
  f.change({accountId: 'bob', revision: 2})
  f.change({accountId: 'alice', revision: 3})
  gate.resolve({userId: 'alice', accessToken: 'private-token'})
  await rejected
  assert.equal(f.calls.length, 0)
})
test('duplicates are blocked synchronously and explicit submission posts once', async () => {
  const gate = deferred<SeasonalJoinSession | null>()
  const f = fixture(() => gate.promise)
  const pending = f.controller.submit('campaign', () => 'secret', f.origin())
  let duplicateReads = 0
  await assert.rejects(f.controller.submit('campaign', () => { duplicateReads++; return 'other' }, f.origin()))
  assert.equal(duplicateReads, 0)
  assert.equal(f.calls.length, 0)
  gate.resolve({userId: 'alice', accessToken: 'private-token'})
  assert.equal((await pending).isCurrent(), true)
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].token, 'private-token')
})
test('cancel invalidates old response and old finally cannot release newer busy operation', async () => {
  const old = deferred<unknown>(), next = deferred<unknown>()
  const f = fixture(undefined, code => code === 'old' ? old.promise : next.promise)
  const first = f.controller.submit('campaign', () => 'old', f.origin())
  const rejected = assert.rejects(first)
  await Promise.resolve()
  assert.equal(f.calls.length, 1)
  f.controller.cancel()
  const second = f.controller.submit('campaign', () => 'next', f.origin())
  await Promise.resolve()
  old.resolve({private: 'raw-response'})
  await rejected
  await assert.rejects(f.controller.submit('campaign', () => 'duplicate', f.origin()))
  assert.equal(f.calls.length, 2)
  next.resolve({})
  assert.equal((await second).isCurrent(), true)
})
test('receipts are code-free and invalidate before later cache writes', async () => {
  const f = fixture()
  const receipt = await f.controller.submit('campaign', () => 'private-code', f.origin())
  assert.deepEqual(Object.keys(receipt), ['isCurrent'])
  assert.deepEqual(Object.keys(f.controller), [])
  assert.equal(JSON.stringify(receipt), '{}')
  assert.equal(Object.isFrozen(receipt), true)
  assert.equal(receipt.isCurrent(), true)
  f.change({accountId: 'bob', revision: 2})
  assert.equal(receipt.isCurrent(), false)
  f.change({accountId: 'alice', revision: 3})
  assert.equal(receipt.isCurrent(), false)
  const second = await f.controller.submit('campaign', () => 'corrected', f.origin())
  f.controller.cancel()
  assert.equal(second.isCurrent(), false)
  const third = await f.controller.submit('campaign', () => 'corrected', f.origin())
  await f.controller.submit('campaign', () => 'later', f.origin())
  assert.equal(third.isCurrent(), false)
})
test('normalization preserves full codes, suffix case, idempotence and other campaigns', async () => {
  const f = fixture()
  for (const [raw, expected] of [
    [' ABCD-EFGH-IJKL ', 'PODA-ABCD-EFGH-IJKL'],
    [' aBcD-eFgH-iJkL ', 'PODA-aBcD-eFgH-iJkL'],
    [' abcd-efgh-ijkl ', 'PODA-abcd-efgh-ijkl'],
    [' PODA-ABCD-EFGH-IJKL ', 'PODA-ABCD-EFGH-IJKL'],
    [' poda-abcd-efgh-ijkl ', 'poda-abcd-efgh-ijkl'],
  ]) {
    await f.controller.submit(CT_CLASSICS_CHALLENGE_ID, () => raw, f.origin())
    assert.equal(f.calls.at(-1)?.invitation_code, expected)
    assert.equal(normalizeInvitationCode(CT_CLASSICS_CHALLENGE_ID, expected), expected)
  }
  const prepared = normalizeInvitationCode(CT_CLASSICS_CHALLENGE_ID, ' aBcD-eFgH-iJkL ')
  await f.controller.submit(CT_CLASSICS_CHALLENGE_ID, () => normalizeInvitationCode(CT_CLASSICS_CHALLENGE_ID, prepared), f.origin())
  assert.equal(f.calls.at(-1)?.invitation_code, 'PODA-aBcD-eFgH-iJkL')
  await f.controller.submit('other', () => ' aBcD-eFgH-iJkL ', f.origin())
  assert.equal(f.calls.at(-1)?.invitation_code, 'aBcD-eFgH-iJkL')
  assert.equal(f.calls.at(-1)?.challenge_id, 'other')
})
test('Unicode scalar bounds reject invalid input while legacy whitespace remains empty', async () => {
  const f = fixture()
  for (const code of ['x'.repeat(257), '😀'.repeat(257), 'a\u0000b', 'a\u001fb', 'a\u007fb', '\ud800', '\udfff']) {
    await assert.rejects(f.controller.submit('campaign', () => code, f.origin()))
  }
  assert.equal(f.calls.length, 0)
  for (const code of ['', '\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff', '😀'.repeat(256)]) {
    await f.controller.submit('campaign', () => code, f.origin())
    assert.equal(f.calls.at(-1)?.invitation_code, code.trim())
  }
  assert.equal(f.calls.length, 3)
})
test('exact denials are sanitized, unknown errors stay generic and corrected retry is deliberate', async () => {
  const messages = [
    ['invitation_required', 'Enter an invitation code for this season.'],
    ['invitation_invalid', 'This code is invalid or expired.'],
    ['invitation_used', 'This code has already been used.'],
    ['invitation_rate_limited', 'Too many attempts. Try again in 15 minutes.'],
    ['challenge_closed', 'Registration is closed for this season.'],
    ['invitation_invalid private-code private-token', generic],
    ['private-code private-token', generic],
  ]
  for (const [category, message] of messages) {
    const raw = Object.assign(new Error(category), {body: 'private-code private-token'})
    const f = fixture(undefined, async code => { if (code !== 'corrected') throw raw; return {} })
    await assert.rejects(f.controller.submit('campaign', () => 'private-code', f.origin()), error => {
      assert.ok(error instanceof Error)
      assert.notEqual(error, raw)
      assert.equal(error.message, message)
      assert.equal('cause' in error, false)
      assert.equal('body' in error, false)
      assert.equal(JSON.stringify(error), '{}')
      return true
    })
    assert.equal(f.calls.length, 1)
    assert.equal((await f.controller.submit('campaign', () => 'corrected', f.origin())).isCurrent(), true)
    assert.equal(f.calls.length, 2)
  }
  const f = fixture(undefined, async () => { throw {message: 'invitation_invalid', token: 'private-token'} })
  await assert.rejects(f.controller.submit('campaign', () => 'secret', f.origin()), {message: generic})
})
