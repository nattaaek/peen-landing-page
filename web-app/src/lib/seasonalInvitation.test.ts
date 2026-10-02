import test from 'node:test'
import assert from 'node:assert/strict'
import { invitationErrorMessage, invitationFormKey, submitSeasonalInvitation } from './seasonalInvitation.ts'

test('closed campaign has an actionable safe message; errors never echo codes', () => {
  assert.equal(invitationErrorMessage(new Error('challenge_closed')), 'Registration is closed for this season.')
  for (const code of ['invitation_required', 'invitation_invalid', 'invitation_used', 'invitation_rate_limited']) {
    assert.notEqual(invitationErrorMessage(new Error(code)), 'Could not join. Try again.')
  }
  assert.equal(invitationErrorMessage(new Error('private-secret')), 'Could not join. Try again.')
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
