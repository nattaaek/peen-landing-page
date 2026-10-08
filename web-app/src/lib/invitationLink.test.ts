import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CT_CLASSICS_CHALLENGE_ID,
  parseInvitationLink,
  normalizeInvitationCode,
} from './invitationLink.ts'

const targetId = 'b2c3d4e5-0001-4000-8000-000000000001'
const otherId = 'a1b2c3d4-1234-abcd-9876-0123456789ab'
const targetUrl = 'https://peen.app/app/invite/ct-classics-2026'
const link = (value: string) => `${targetUrl}#code=${value}`

test('canonical target and UUID invitation routes select exact campaigns', () => {
  assert.equal(CT_CLASSICS_CHALLENGE_ID, targetId)
  for (const [route, challengeId] of [
    ['ct-classics-2026', targetId],
    [targetId, targetId],
    [otherId, otherId],
    [otherId.toUpperCase(), otherId],
  ]) {
    assert.deepEqual(
      parseInvitationLink(`https://peen.app/app/invite/${route}#code=MiXeD-secret`),
      { challengeId, code: 'MiXeD-secret' },
    )
  }
})

test('invitation links reject unsafe and ambiguous route boundaries', () => {
  const unsafe = [
    'http://peen.app/app/invite/ct-classics-2026#code=x',
    '//peen.app/app/invite/ct-classics-2026#code=x',
    '/app/invite/ct-classics-2026#code=x',
    'https://PEEN.app/app/invite/ct-classics-2026#code=x',
    'https://peen.app./app/invite/ct-classics-2026#code=x',
    'https://other.example/app/invite/ct-classics-2026#code=x',
    'https://peen.app.other.example/app/invite/ct-classics-2026#code=x',
    'https://user@peen.app/app/invite/ct-classics-2026#code=x',
    'https://user:password@peen.app/app/invite/ct-classics-2026#code=x',
    'https://peen.app:443/app/invite/ct-classics-2026#code=x',
    'https://peen.app:8443/app/invite/ct-classics-2026#code=x',
    'https://peen.app\\app/invite/ct-classics-2026#code=x',
    'https://peen.app/app/./invite/ct-classics-2026#code=x',
    'https://peen.app/app/extra/../invite/ct-classics-2026#code=x',
    'https://peen.app/app/%2e/invite/ct-classics-2026#code=x',
    'https://peen.app/app/extra/%2E%2E/invite/ct-classics-2026#code=x',
    'https://peen.app//app/invite/ct-classics-2026#code=x',
    'https://peen.app/app/invite//ct-classics-2026#code=x',
    'https://peen.app/app%2Finvite/ct-classics-2026#code=x',
    'https://peen.app/app/invite%2fct-classics-2026#code=x',
    'https://peen.app/app/invite%5Cct-classics-2026#code=x',
    `${targetUrl}/#code=x`,
    `${targetUrl}/extra#code=x`,
    `${targetUrl}%2F#code=x`,
    `${targetUrl}?#code=x`,
    `${targetUrl}?next=elsewhere#code=x`,
    'https://peen.app/app/invite/unknown#code=x',
    'https://peen.app/app/invite/CT-CLASSICS-2026#code=x',
    'https://peen.app/app/invite/ct-classics-2027#code=x',
    'https://peen.app/app/invite/a1b2c3d4-1234-abcd-9876-0123456789ag#code=x',
    'https://peen.app/app/invite/a1b2c3d4-1234-abcd-9876-0123456789a#code=x',
    'https://peen.app/app/invite/a1b2c3d41234abcd98760123456789ab#code=x',
    'https://peen.app/app/invite/%63t-classics-2026#code=x',
  ]
  for (const raw of unsafe) assert.equal(parseInvitationLink(raw), null)
})

test('fragment rejects missing, ambiguous and malformed values', () => {
  for (const fragment of [
    '', '#', '#code=', '#code=%20%09%0A', '#other=x', '#Code=x',
    '#code=x&code=y', '#code=x&other=y', '#code=x&', '#other=y&code=x',
    '#code=x#code=y', '#code=%', '#code=%2', '#code=%GG',
    '#code=x?y', '#code=x\\y', '#code=?', '#code=\\',
    '#code=%C3%28', '#code=%FF', '#code=%E0%80%80', '#code=%ED%A0%80',
  ]) {
    assert.equal(parseInvitationLink(`${targetUrl}${fragment}`), null)
  }
})

test('fragment decodes once and preserves plus and nested escapes', () => {
  for (const [raw, code] of [
    ['Ab+cD', 'Ab+cD'],
    ['Ab%2BcD', 'Ab+cD'],
    ['%252F', '%2F'],
    ['%252B', '%2B'],
    ['a%3Fb%5Cc', 'a?b\\c'],
    ['%253F%255C', '%3F%5C'],
    ['%F0%9F%98%80+%C3%A9', '😀+é'],
    ['%25F0%259F%2598%2580', '%F0%9F%98%80'],
    ['%25GG', '%GG'],
    ['%20%09MiXeD%0A%20', 'MiXeD'],
    ['a%26other%3Db%23c%2Fd', 'a&other=b#c/d'],
    ['two%20words', 'two words'],
    ['%E0%B9%84%E0%B8%97%E0%B8%A2', 'ไทย'],
    ['e%CC%81', 'e\u0301'],
  ]) {
    assert.deepEqual(parseInvitationLink(link(raw)), { challengeId: targetId, code })
  }
})

test('invitation code container permits Unicode and enforces exact boundaries', () => {
  for (const code of ['x', 'a'.repeat(256), '😀'.repeat(256), 'a b', 'a—b']) {
    assert.deepEqual(parseInvitationLink(link(encodeURIComponent(code))), {
      challengeId: targetId, code,
    })
  }
  for (const code of ['a'.repeat(257), '😀'.repeat(257)]) {
    assert.equal(parseInvitationLink(link(encodeURIComponent(code))), null)
  }
  for (let control = 0; control <= 31; control++) {
    assert.equal(parseInvitationLink(link(encodeURIComponent(`a${String.fromCharCode(control)}b`))), null)
  }
  assert.equal(parseInvitationLink(link('a%7Fb')), null)
  for (const code of ['\uD800', '\uDBFF', '\uDC00', '\uDFFF', 'a\uD800b', 'a\uDC00b', '\uDC00\uD800']) {
    assert.equal(parseInvitationLink(link(code)), null)
  }
  for (const code of ['\uD800\uDC00', '\uDBFF\uDFFF', '😀'.repeat(256), 'é+ไทย']) {
    assert.deepEqual(parseInvitationLink(link(code)), { challengeId: targetId, code })
  }
  assert.equal(parseInvitationLink(link('😀'.repeat(257))), null)
})

test('target suffix normalization preserves case and is idempotent', () => {
  const cases = [
    ['  aB12-Cd34-eF56  ', 'PODA-aB12-Cd34-eF56'],
    ['0000-1111-2222', 'PODA-0000-1111-2222'],
    [' PODA-aB12-Cd34-eF56 ', 'PODA-aB12-Cd34-eF56'],
    [' poda-aB12-Cd34-eF56 ', 'poda-aB12-Cd34-eF56'],
    ['PoDa-aB12-Cd34-eF56', 'PoDa-aB12-Cd34-eF56'],
    ['abc-defg-hijk', 'abc-defg-hijk'],
    ['abcde-fghi-jklm', 'abcde-fghi-jklm'],
    ['abcd-efgh-ijkl-extra', 'abcd-efgh-ijkl-extra'],
    ['abcd_efgh_ijkl', 'abcd_efgh_ijkl'],
    ['ábcd-efgh-ijkl', 'ábcd-efgh-ijkl'],
    ['abcd-ef h-ijkl', 'abcd-ef h-ijkl'],
    [' ordinary Secret ', 'ordinary Secret'],
    ['   ', ''],
  ]
  for (const [raw, expected] of cases) {
    const normalized = normalizeInvitationCode(targetId, raw)
    assert.equal(normalized, expected)
    assert.equal(normalizeInvitationCode(targetId, normalized), expected)
  }
})

test('43-character URL-safe pilot secret round-trips without PODA normalization', () => {
  const secret = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO-_'
  assert.equal(secret.length, 43)
  assert.deepEqual(parseInvitationLink(link(secret)), { challengeId: targetId, code: secret })
  assert.equal(normalizeInvitationCode(targetId, secret), secret)
})

test('UUID invitation keeps its exact campaign and non-PODA code', () => {
  const code = 'aB12-Cd34-eF56'
  assert.deepEqual(parseInvitationLink(`https://peen.app/app/invite/${otherId}#code=${code}`), {
    challengeId: otherId, code,
  })
  for (const raw of [code, ' PODA-MiXeD ', ' ordinary Secret ']) {
    const normalized = normalizeInvitationCode(otherId, raw)
    assert.equal(normalized, raw.trim())
    assert.equal(normalizeInvitationCode(otherId, normalized), normalized)
  }
})
