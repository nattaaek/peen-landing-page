import test from 'node:test'
import assert from 'node:assert/strict'
import { challengeEligibilityRules, daysLeftUntilEnd } from './seasonalChallenge.ts'

const DEVICE_ZONES = ['UTC', 'America/Los_Angeles', 'Asia/Bangkok', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']

function inEachDeviceZone(check: (zone: string) => void) {
  const original = process.env.TZ
  try {
    for (const zone of DEVICE_ZONES) {
      process.env.TZ = zone
      check(zone)
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
}

test('device zone loop really changes the zone the runtime uses', () => {
  const instant = new Date('2026-12-31T17:00:00Z')
  const seen: Record<string, [string, number]> = {}
  inEachDeviceZone((zone) => {
    seen[zone] = [Intl.DateTimeFormat().resolvedOptions().timeZone, instant.getTimezoneOffset()]
  })
  assert.deepEqual(seen, {
    UTC: ['UTC', 0],
    'America/Los_Angeles': ['America/Los_Angeles', 480],
    'Asia/Bangkok': ['Asia/Bangkok', -420],
    'Pacific/Kiritimati': ['Pacific/Kiritimati', -840],
    'Pacific/Pago_Pago': ['Pacific/Pago_Pago', 660],
  })
})

test('rules require both climb day and first receipt within the Bangkok event dates, with an exclusive close', () => {
  assert.deepEqual(challengeEligibilityRules('2026-05-01', '2026-12-31'), [
    'A climb counts only if both the day you climbed it and the first time Peen receives your log are within the event dates, May 1, 2026 through Dec 31, 2026, Bangkok time (UTC+7). Peen must first receive the log at or after 12:00 AM on May 1, 2026 and before 12:00 AM on Jan 1, 2027, Bangkok time (UTC+7), when the event closes.',
    'Logs saved offline or sent after the event closes do not count, even when the climb date is inside the event. There is no grace period.',
    'Choose another signed-in climber as your belayer or, for bouldering, your witness. You cannot verify your own send.',
    'For challenge credit, they must confirm the send in Peen before 12:00 AM on Jan 1, 2027, Bangkok time (UTC+7). Confirmation at or after the event closes does not count.',
    'Unconfirmed logs still save to your climbing history; they do not earn challenge credit.',
    'Those logs still save to your climbing history as usual.',
  ])
})

test('rules follow whatever window the server configures, including across a year boundary', () => {
  assert.equal(challengeEligibilityRules('2026-12-01', '2027-04-30')?.[0],
    'A climb counts only if both the day you climbed it and the first time Peen receives your log are within the event dates, Dec 1, 2026 through Apr 30, 2027, Bangkok time (UTC+7). Peen must first receive the log at or after 12:00 AM on Dec 1, 2026 and before 12:00 AM on May 1, 2027, Bangkok time (UTC+7), when the event closes.')
})

test('rule date labels do not shift with the device time zone', () => {
  inEachDeviceZone((zone) => {
    assert.match(challengeEligibilityRules('2026-05-01', '2026-12-31')?.[0] ?? '',
      /event dates, May 1, 2026 through Dec 31, 2026, .* at or after 12:00 AM on May 1, 2026 and before 12:00 AM on Jan 1, 2027,/, zone)
  })
})

test('missing, malformed, impossible, or reversed dates produce no rule copy', () => {
  for (const [start, end] of [['', '2026-12-31'], ['2026-05-01', ''], ['May 1', '2026-12-31'],
    ['2026-02-30', '2026-12-31'], ['2026-12-31', '2026-05-01']]) {
    assert.equal(challengeEligibilityRules(start, end), null, `${start} → ${end}`)
  }
})

test('days left counts Bangkok calendar days across the year boundary in every device zone', () => {
  inEachDeviceZone((zone) => {
    assert.equal(daysLeftUntilEnd('2026-12-31', new Date('2026-12-30T16:59:59Z')), 1, `${zone} Dec 30 23:59:59 BKK`)
    assert.equal(daysLeftUntilEnd('2026-12-31', new Date('2026-12-30T17:00:00Z')), 0, `${zone} Dec 31 00:00 BKK`)
    assert.equal(daysLeftUntilEnd('2026-12-31', new Date('2026-12-31T16:59:59Z')), 0, `${zone} Dec 31 23:59:59 BKK`)
    assert.equal(daysLeftUntilEnd('2026-12-31', new Date('2026-12-31T17:00:00Z')), -1, `${zone} Jan 1 00:00 BKK`)
    assert.equal(daysLeftUntilEnd('2026-12-31', new Date('2026-12-31T17:30:00Z')), -1, `${zone} Jan 1 00:30 BKK`)
  })
})

test('days left counts from the Bangkok opening day', () => {
  assert.equal(daysLeftUntilEnd('2026-12-31', new Date('2026-04-30T16:59:59Z')), 245)
  assert.equal(daysLeftUntilEnd('2026-12-31', new Date('2026-04-30T17:00:00Z')), 244)
})

test('days left stays null for missing or unparseable end dates', () => {
  assert.equal(daysLeftUntilEnd(undefined), null)
  assert.equal(daysLeftUntilEnd(''), null)
  assert.equal(daysLeftUntilEnd('not-a-date'), null)
})

test('challenge credit needs another signed-in climber confirmation strictly before Bangkok close', () => {
  const rules = challengeEligibilityRules('2026-05-01', '2026-12-31')
  assert.ok(rules)
  assert.ok(rules.some(rule => rule.includes('another signed-in climber') && rule.includes('bouldering')))
  assert.ok(rules.some(rule => rule.includes('confirm') && rule.includes('before 12:00 AM on Jan 1, 2027') && rule.includes('Bangkok time (UTC+7)')))
})
