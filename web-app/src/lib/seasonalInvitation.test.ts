import test from 'node:test'
import assert from 'node:assert/strict'
import { invitationErrorMessage, invitationFormKey, submitSeasonalInvitation } from './seasonalInvitation.ts'
import { CT_CLASSICS_CHALLENGE_ID, normalizeInvitationCode } from './invitationLink.ts'

test('actual target submission normalizes grouped suffixes and preserves full codes and case', async () => {
  const calls: {challenge_id: string; invitation_code: string}[] = []
  const invoke = async (params: {challenge_id: string; invitation_code: string}) => {
    calls.push(params)
    return 'accepted'
  }
  for (const [raw, expected] of [
    [' ABCD-EFGH-IJKL ', 'PODA-ABCD-EFGH-IJKL'],
    [' PODA-ABCD-EFGH-IJKL ', 'PODA-ABCD-EFGH-IJKL'],
    [' aBcD-eFgH-iJkL ', 'PODA-aBcD-eFgH-iJkL'],
    [' abcd-efgh-ijkl ', 'PODA-abcd-efgh-ijkl'],
    [' poda-abcd-efgh-ijkl ', 'poda-abcd-efgh-ijkl'],
  ]) {
    assert.equal(await submitSeasonalInvitation(invoke, CT_CLASSICS_CHALLENGE_ID, raw), 'accepted')
    assert.deepEqual(calls.at(-1), {challenge_id: CT_CLASSICS_CHALLENGE_ID, invitation_code: expected})
  }
  assert.equal(calls.length, 5)
})

test('actual submission after repeated preparation adds no duplicate prefix', async () => {
  const calls: unknown[] = []
  const invoke = async (params: {challenge_id: string; invitation_code: string}) => {
    calls.push(params)
    return {}
  }
  const prepared = normalizeInvitationCode(CT_CLASSICS_CHALLENGE_ID, ' aBcD-eFgH-iJkL ')
  const repeated = normalizeInvitationCode(CT_CLASSICS_CHALLENGE_ID, prepared)
  await submitSeasonalInvitation(invoke, CT_CLASSICS_CHALLENGE_ID, repeated)
  assert.deepEqual(calls, [{challenge_id: CT_CLASSICS_CHALLENGE_ID, invitation_code: 'PODA-aBcD-eFgH-iJkL'}])
})

test('actual other-campaign submission leaves grouped suffix unchanged', async () => {
  const calls: unknown[] = []
  const invoke = async (params: {challenge_id: string; invitation_code: string}) => {
    calls.push(params)
    return {}
  }
  await submitSeasonalInvitation(invoke, 'other-campaign', ' aBcD-eFgH-iJkL ')
  assert.deepEqual(calls, [{challenge_id: 'other-campaign', invitation_code: 'aBcD-eFgH-iJkL'}])
})

test('closed campaign has an actionable safe message; errors never echo codes', () => {
  const fallback = 'Could not join. Try again.'
  const cases = [
    ['invitation_required', 'Enter an invitation code for this season.'],
    ['invitation_invalid', 'This code is invalid or expired.'],
    ['invitation_used', 'This code has already been used.'],
    ['invitation_rate_limited', 'Too many attempts. Try again in 15 minutes.'],
    ['challenge_closed', 'Registration is closed for this season.'],
  ]
  for (const [category, display] of cases) {
    for (const message of [category, display]) {
      assert.equal(invitationErrorMessage(new Error(message)), display)
      for (const privateText of [`private-secret ${message}`, `${message} private-secret`, ` ${message} `]) {
        assert.equal(invitationErrorMessage(new Error(privateText)), fallback)
      }
      assert.equal(invitationErrorMessage(message), fallback)
      assert.equal(invitationErrorMessage({ message }), fallback)
    }
  }
  for (const message of ['invitation_expired', 'private-secret', 'unknown_error', '']) {
    assert.equal(invitationErrorMessage(new Error(message)), fallback)
  }
  for (const input of [null, undefined, 42, false, {}, []]) {
    assert.equal(invitationErrorMessage(input), fallback)
  }
})

test('actual submission helper trims code, propagates denial and permits corrected retry', async () => {
  const calls: unknown[] = []
  const invoke = async (params: {challenge_id: string; invitation_code: string}) => {
    calls.push(params)
    if (params.invitation_code !== 'valid') throw new Error('invitation_invalid')
    return {}
  }
  await assert.rejects(submitSeasonalInvitation(invoke, 'campaign', ' wrong '), /invitation_invalid/)
  assert.deepEqual(await submitSeasonalInvitation(invoke, 'campaign', ' valid '), {})
  assert.deepEqual(calls, [
    {challenge_id: 'campaign', invitation_code: 'wrong'},
    {challenge_id: 'campaign', invitation_code: 'valid'},
  ])
})

test('account, campaign and successful enrollment changes remount invitation form', () => {
  const key = invitationFormKey('campaign', 'alice', false)
  assert.notEqual(key, invitationFormKey('campaign', 'bob', false))
  assert.notEqual(key, invitationFormKey('other', 'alice', false))
  assert.notEqual(key, invitationFormKey('campaign', 'alice', true))
})
