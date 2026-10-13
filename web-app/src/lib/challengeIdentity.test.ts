import test from 'node:test'
import assert from 'node:assert/strict'
import { challengeAccountLine, challengeJoiningName, challengeNickname } from './challengeIdentity.ts'

const ALICE = '00000000-0000-4000-8000-00000000a11c'
const BOB = '00000000-0000-4000-8000-000000000b0b'
const SYNTHETIC_EMAIL = 'synthetic-relay@example.invalid'

const labels = (accountId: string | null, profile: Parameters<typeof challengeNickname>[1]) => {
  const nickname = challengeNickname(accountId, profile)
  return { nickname, line: challengeAccountLine(nickname), joining: challengeJoiningName(nickname) }
}

test('present nickname is trimmed and shown', () => {
  assert.deepEqual(labels(ALICE, { user_id: ALICE, nickname: '  Maya  ' }),
    { nickname: 'Maya', line: 'Signed in as Maya', joining: 'Maya' })
})

test('blank nickname falls back to neutral labels', () => {
  for (const nickname of ['', '   ', '\n\t']) {
    assert.deepEqual(labels(ALICE, { user_id: ALICE, nickname }),
      { nickname: null, line: 'Signed in', joining: 'Climber' })
  }
})

test('unavailable profile or nickname falls back to neutral labels', () => {
  for (const profile of [undefined, null, { user_id: ALICE }, { user_id: ALICE, nickname: null }, { nickname: 'Maya' }]) {
    assert.deepEqual(labels(ALICE, profile), { nickname: null, line: 'Signed in', joining: 'Climber' })
  }
})

test('account change ignores the previous account profile', () => {
  const aliceProfile = { user_id: ALICE, nickname: 'Alice' }
  assert.equal(challengeNickname(ALICE, aliceProfile), 'Alice')
  assert.deepEqual(labels(BOB, aliceProfile), { nickname: null, line: 'Signed in', joining: 'Climber' })
  assert.equal(challengeNickname(BOB, { user_id: BOB, nickname: 'Bob' }), 'Bob')
})

test('signed-out viewer has no nickname even with a cached profile', () => {
  for (const accountId of [null, undefined, '']) {
    assert.equal(challengeNickname(accountId, { user_id: ALICE, nickname: 'Alice' }), null)
  }
})

test('nickname that is an email or UUID is never displayed', () => {
  for (const nickname of [SYNTHETIC_EMAIL, ` ${SYNTHETIC_EMAIL} `, `reach me ${SYNTHETIC_EMAIL}`, ALICE, ALICE.toUpperCase(), `id ${BOB}`]) {
    const { line, joining } = labels(ALICE, { user_id: ALICE, nickname })
    assert.equal(line, 'Signed in')
    assert.equal(joining, 'Climber')
  }
})

test('labels never contain the account UUID or an email in any state', () => {
  const profiles = [undefined, { user_id: ALICE, nickname: 'Alice' }, { user_id: BOB, nickname: 'Bob' },
    { user_id: ALICE, nickname: SYNTHETIC_EMAIL }, { user_id: ALICE, nickname: '' }]
  for (const accountId of [ALICE, BOB]) {
    for (const profile of profiles) {
      const { line, joining } = labels(accountId, profile)
      for (const text of [line, joining]) {
        assert.ok(!text.includes(ALICE) && !text.includes(BOB), 'no account UUID')
        assert.ok(!text.includes('@'), 'no email')
      }
    }
  }
})

test('nicknames containing a bare @ handle are still allowed', () => {
  assert.equal(challengeNickname(ALICE, { user_id: ALICE, nickname: '@maya' }), '@maya')
})
