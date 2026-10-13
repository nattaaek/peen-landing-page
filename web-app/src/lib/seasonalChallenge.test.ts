import test from 'node:test'
import assert from 'node:assert/strict'
import { challengeEligibilityRules } from './seasonalChallenge.ts'

test('rules name the configured event dates in UTC for climb and first submission', () => {
  assert.deepEqual(challengeEligibilityRules('2026-05-01', '2026-12-31'), [
    'A climb counts only if you climbed it from May 1, 2026 through Dec 31, 2026 (UTC) and your log first reaches Peen by the end of Dec 31, 2026 UTC.',
    'Logs saved offline or sent after the event closes do not count, even when the climb date is inside the event. There is no grace period.',
    'Those logs still save to your climbing history as usual.',
  ])
})

test('rules follow whatever window the server configures, including across a year boundary', () => {
  assert.equal(challengeEligibilityRules('2026-12-01', '2027-04-30')?.[0],
    'A climb counts only if you climbed it from Dec 1, 2026 through Apr 30, 2027 (UTC) and your log first reaches Peen by the end of Apr 30, 2027 UTC.')
})

test('missing, malformed, impossible, or reversed dates produce no rule copy', () => {
  for (const [start, end] of [['', '2026-12-31'], ['2026-05-01', ''], ['May 1', '2026-12-31'],
    ['2026-02-30', '2026-12-31'], ['2026-12-31', '2026-05-01']]) {
    assert.equal(challengeEligibilityRules(start, end), null, `${start} → ${end}`)
  }
})
