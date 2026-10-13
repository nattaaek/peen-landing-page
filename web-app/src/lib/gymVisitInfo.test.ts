import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildVisitInfo,
  decodeGymVisitInfo,
  draftFromVisitInfo,
  emptyGradeDraft,
  emptyHoursDraft,
  emptyPriceDraft,
  emptyVisitInfoDraft,
  formatMinorAmount,
  formatPrice,
  normalizeApiGyms,
  parseMajorAmount,
  planGymCreate,
  planGymVisitUpdate,
  type GymLocationDraft,
  type VisitInfoDraft,
} from './gymVisitInfo.ts'
import { isPlaceListed } from './cragStats.ts'

const fixtureUrl = new URL('../../fixtures/gym-visit-info/chillout.synthetic.fixture.json', import.meta.url)
const fixtureBytes = readFileSync(fixtureUrl)
const fixture = JSON.parse(fixtureBytes.toString('utf8'))
const chillout = fixture.chillout_gym

const canonicalCopies = [
  new URL('../../../../peen-ios/docs/gym-visit-info/chillout.synthetic.fixture.json', import.meta.url),
  new URL('../../../../peen-api/tests/fixtures/gym_visit_info/chillout.synthetic.fixture.json', import.meta.url),
]

for (const canonical of canonicalCopies) {
  test(`fixture is a byte-identical copy of ${canonical.pathname.split('/').slice(-5).join('/')}`, (t) => {
    if (!existsSync(canonical)) {
      t.skip('sibling repo not checked out next to peen-landing-page')
      return
    }
    assert.ok(fixtureBytes.equals(readFileSync(canonical)), 'web fixture differs from canonical bytes')
  })
}

test('fixture is the synthetic local-only Chillout gym', () => {
  assert.equal(fixture.fixture_kind, 'synthetic_local_only')
  assert.equal(chillout.id, '5e5e5e5e-0000-4000-8000-000000000001')
  assert.equal(chillout.address, null)
  assert.equal(chillout.created_by, null)
})

test('Chillout visit info decodes losslessly', () => {
  assert.deepEqual(decodeGymVisitInfo(chillout.visit_info), chillout.visit_info)
})

test('Chillout prices format to the exact expected major amounts', () => {
  const info = decodeGymVisitInfo(chillout.visit_info)!
  const actual = Object.fromEntries(
    [...info.admission, ...info.rentals].map((p) => [p.label, formatMinorAmount(p.amount_minor, p.currency)]),
  )
  assert.deepEqual(actual, fixture.expected_chillout_major_amounts)
  assert.equal(formatPrice({ amount_minor: 38000, currency: 'THB' }), 'THB 380')
  assert.equal(formatPrice({ amount_minor: 210000, currency: 'THB' }), 'THB 2,100')
  assert.equal(formatPrice({ amount_minor: 38050, currency: 'THB' }), 'THB 380.50')
  assert.equal(formatPrice({ amount_minor: 380, currency: 'JPY' }), 'JPY 380')
})

test('Chillout grade legend names V0 through V7 in text', () => {
  const info = decodeGymVisitInfo(chillout.visit_info)!
  assert.deepEqual(
    info.grade_legend.map((g) => `${g.grade} ${g.color_name}`),
    ['V0 White', 'V1 Green', 'V2 Pink', 'V3 Cyan / light blue', 'V4 Red', 'V5 Yellow', 'V6 Dark blue', 'V7 Orange'],
  )
})

for (const decodeCase of fixture.decode_cases) {
  test(`fixture decode case: ${decodeCase.name}`, () => {
    const [gym] = normalizeApiGyms([decodeCase.gym])
    assert.equal(gym.id, decodeCase.gym.id, 'the gym row itself is never dropped')
    const info = gym.visit_info
    assert.equal(info != null, decodeCase.expect.visit_info_present)
    if (!info) return
    assert.deepEqual(info.hours.map((h) => h.label), decodeCase.expect.hours_labels)
    assert.deepEqual(info.admission.map((p) => p.label), decodeCase.expect.admission_labels)
    assert.deepEqual(info.rentals.map((p) => p.label), decodeCase.expect.rentals_labels)
    assert.deepEqual(info.grade_legend, decodeCase.expect.grade_legend)
  })
}

test('unknown or malformed visit info never fails the catalog', () => {
  const gyms = normalizeApiGyms([
    { id: 'a', name: 'Array info', visit_info: [] },
    { id: 'b', name: 'String version', visit_info: { schema_version: '1', hours: [] } },
    { id: 'c', name: 'Null info', visit_info: null },
    { id: 'd', name: 'Lists not arrays', visit_info: { schema_version: 1, hours: 'x', admission: {}, provenance: 'posted_sign' } },
    { name: 'No id' },
    'not a row',
    null,
  ])
  assert.deepEqual(gyms.map((g) => g.id), ['a', 'b', 'c', 'd'])
  assert.deepEqual(gyms.map((g) => g.visit_info === null), [true, true, true, false])
  assert.deepEqual(gyms[3].visit_info, {
    schema_version: 1, hours: [], admission: [], rentals: [], grade_legend: [], provenance: null,
  })
  assert.deepEqual(normalizeApiGyms({ not: 'an array' }), [])
})

test('row-level tolerance: bad hex keeps the colour name, bad dates and sources read as unknown', () => {
  const info = decodeGymVisitInfo({
    schema_version: 1,
    grade_legend: [
      { grade: 'V2', color_name: 'Pink', color_hex: '#F28AB' },
      { grade: 'V3', color_name: 'Cyan', color_hex: 12 },
      { grade: ' ', color_name: 'Blank grade' },
    ],
    admission: [
      { label: 'Big', amount_minor: 1_000_000_001, currency: 'THB' },
      { label: 'String amount', amount_minor: '38000', currency: 'THB' },
      { label: 'Wrong-type conditions', amount_minor: 0, currency: 'THB', conditions: 5 },
      { label: 'Ok', amount_minor: 0, currency: 'THB' },
    ],
    hours: [{ label: 'Late', opens_at: '24:00', closes_at: '23:59' }],
    provenance: { source: 'posted_sign', verified_at: '2026-02-30', note: 'Photo of sign' },
  })!
  assert.deepEqual(info.grade_legend, [
    { grade: 'V2', color_name: 'Pink', color_hex: null },
    { grade: 'V3', color_name: 'Cyan', color_hex: null },
  ])
  assert.deepEqual(info.admission, [{ label: 'Ok', amount_minor: 0, currency: 'THB', conditions: null }])
  assert.deepEqual(info.hours, [])
  assert.deepEqual(info.provenance, { source: 'posted_sign', verified_at: null, note: 'Photo of sign' })
  assert.equal(decodeGymVisitInfo({ schema_version: 1, provenance: { source: 'website' } })!.provenance, null)
  assert.equal(
    decodeGymVisitInfo({ schema_version: 1, provenance: { source: 'posted_sign', verified_at: '2024-02-29' } })!
      .provenance!.verified_at,
    '2024-02-29',
  )
})

test('optional text is missing, null or a string; any other type drops the row like iOS and Android', () => {
  const hours = (note: unknown) => ({ label: 'Daily', opens_at: '10:00', closes_at: '22:00', note })
  const price = (conditions: unknown) => ({ label: 'Day pass', amount_minor: 38000, currency: 'THB', conditions })
  const hoursNoNote = { label: 'Daily', opens_at: '10:00', closes_at: '22:00' }
  const priceNoConditions = { label: 'Day pass', amount_minor: 38000, currency: 'THB' }
  const info = decodeGymVisitInfo({
    schema_version: 1,
    hours: [hoursNoNote, hours(null), hours('Last entry 21:30'), hours(7), hours(false), hours({ text: 'x' }), hours(['x'])],
    admission: [priceNoConditions, price(null), price('Weekdays'), price(5), price(true)],
    rentals: [price({}), price('Shoes')],
  })!
  assert.deepEqual(info.hours.map((h) => h.note), [null, null, 'Last entry 21:30'])
  assert.deepEqual(info.admission.map((p) => p.conditions), [null, null, 'Weekdays'])
  assert.deepEqual(info.rentals.map((p) => p.conditions), ['Shoes'])
})

test('a non-string provenance note makes provenance unknown and keeps every valid list row', () => {
  const lists = {
    hours: [{ label: 'Daily', opens_at: '10:00', closes_at: '22:00' }],
    admission: [{ label: 'Day pass', amount_minor: 38000, currency: 'THB' }],
    rentals: [{ label: 'Shoes', amount_minor: 10000, currency: 'THB', conditions: null }],
    grade_legend: [{ grade: 'V0', color_name: 'White' }],
  }
  for (const note of [7, true, {}, ['Photo']]) {
    const info = decodeGymVisitInfo({ schema_version: 1, ...lists, provenance: { source: 'posted_sign', verified_at: '2026-01-15', note } })!
    assert.equal(info.provenance, null, JSON.stringify(note))
    assert.deepEqual(info.hours, [{ label: 'Daily', opens_at: '10:00', closes_at: '22:00', note: null }])
    assert.deepEqual(info.admission, [{ label: 'Day pass', amount_minor: 38000, currency: 'THB', conditions: null }])
    assert.deepEqual(info.rentals, [{ label: 'Shoes', amount_minor: 10000, currency: 'THB', conditions: null }])
    assert.deepEqual(info.grade_legend, [{ grade: 'V0', color_name: 'White', color_hex: null }])
  }
  const provenance = (extra: Record<string, unknown>) =>
    decodeGymVisitInfo({ schema_version: 1, provenance: { source: 'posted_sign', verified_at: '2026-01-15', ...extra } })!.provenance
  assert.deepEqual(provenance({}), { source: 'posted_sign', verified_at: '2026-01-15', note: null })
  assert.deepEqual(provenance({ note: null }), { source: 'posted_sign', verified_at: '2026-01-15', note: null })
  assert.deepEqual(provenance({ note: 'Photo of sign' }), { source: 'posted_sign', verified_at: '2026-01-15', note: 'Photo of sign' })
  assert.deepEqual(provenance({ verified_at: 'soon', note: 'Photo of sign' }), { source: 'posted_sign', verified_at: null, note: 'Photo of sign' })
  assert.equal(provenance({ source: 'website', note: 'Photo of sign' }), null)
  assert.equal(normalizeApiGyms([{ id: 'g', name: 'Gym', visit_info: { schema_version: 1, provenance: { source: 'posted_sign', note: 7 } } }]).length, 1)
})

test('typed major amounts parse to exact integer minor units', () => {
  assert.equal(parseMajorAmount('380', 'THB'), 38000)
  assert.equal(parseMajorAmount(' 380.5 ', 'THB'), 38050)
  assert.equal(parseMajorAmount('0.07', 'THB'), 7)
  assert.equal(parseMajorAmount('380', 'JPY'), 380)
  for (const bad of ['', '380.505', '-1', '1e3', '2,100', 'Infinity', '0x10', '380.', '.5', '10000000.01']) {
    assert.equal(parseMajorAmount(bad, 'THB'), null, bad)
  }
  assert.equal(parseMajorAmount('1.5', 'JPY'), null)
})

const location = (over: Partial<GymLocationDraft> = {}): GymLocationDraft => ({
  name: 'Synthetic Gym', latitude: '13.149183747069928', longitude: '100.91708319565952', address: '', ...over,
})

function visitDraft(): VisitInfoDraft {
  const d = emptyVisitInfoDraft()
  d.admission = [{ ...emptyPriceDraft(), label: 'Day pass', amount: '380' }]
  return d
}

test('no visit info plans legacy createGym with address included', () => {
  const r = planGymCreate(location({ address: ' Soi 1 ' }), emptyVisitInfoDraft())
  assert.deepEqual(r, {
    ok: true,
    plan: { op: 'createGym', params: { name: 'Synthetic Gym', latitude: 13.149183747069928, longitude: 100.91708319565952, address: 'Soi 1' } },
  })
  const blankRows = emptyVisitInfoDraft()
  blankRows.hours = [emptyHoursDraft()]
  blankRows.rentals = [emptyPriceDraft()]
  const r2 = planGymCreate(location(), blankRows)
  assert.ok(r2.ok && r2.plan.op === 'createGym' && r2.plan.params.address === null)
})

test('entered visit info plans createGymWithVisitInfo with the exact payload', () => {
  const r = planGymCreate(location({ address: 'Synthetic road' }), visitDraft())
  assert.deepEqual(r, {
    ok: true,
    plan: {
      op: 'createGymWithVisitInfo',
      params: {
        name: 'Synthetic Gym', latitude: 13.149183747069928, longitude: 100.91708319565952, address: 'Synthetic road',
        visit_info: {
          schema_version: 1, hours: [], rentals: [], grade_legend: [],
          admission: [{ label: 'Day pass', amount_minor: 38000, currency: 'THB', conditions: null }],
          provenance: { source: 'posted_sign', verified_at: null, note: null },
        },
      },
    },
  })
})

test('coordinates must be explicit, finite and in range; 0,0 is rejected', () => {
  const cases: [Partial<GymLocationDraft>, string][] = [
    [{ latitude: '' }, 'gym:latitude'],
    [{ longitude: '  ' }, 'gym:longitude'],
    [{ latitude: 'abc' }, 'gym:latitude'],
    [{ latitude: '90.0001' }, 'gym:latitude'],
    [{ longitude: '-180.5' }, 'gym:longitude'],
    [{ latitude: 'NaN' }, 'gym:latitude'],
    [{ latitude: '1e1' }, 'gym:latitude'],
    [{ latitude: '0', longitude: '0' }, 'gym:latitude'],
    [{ name: '   ' }, 'gym:name'],
    [{ name: 'x'.repeat(121) }, 'gym:name'],
    [{ address: 'x'.repeat(301) }, 'gym:address'],
  ]
  for (const [over, field] of cases) {
    const r = planGymCreate(location(over), emptyVisitInfoDraft())
    assert.equal(r.ok, false, JSON.stringify(over))
    assert.ok(!r.ok && r.errors.some((e) => e.field === field), JSON.stringify(over))
  }
  const equator = planGymCreate(location({ latitude: '0', longitude: '100.5' }), emptyVisitInfoDraft())
  assert.ok(equator.ok && equator.plan.params.latitude === 0)
})

test('partial and invalid rows produce field-addressed errors', () => {
  const d = emptyVisitInfoDraft()
  const hours = { ...emptyHoursDraft(), label: 'Every day', opens_at: '10am' }
  const price = { ...emptyPriceDraft(), label: 'Day pass', amount: '380.505', currency: 'thb' }
  const grade = { ...emptyGradeDraft(), grade: 'V1', color_hex: 'green' }
  d.hours = [hours]
  d.admission = [price]
  d.grade_legend = [grade]
  d.verified_at = '2026-02-30'
  const r = buildVisitInfo(d)
  assert.ok(!r.ok)
  assert.deepEqual(
    r.errors.map((e) => e.field).sort(),
    [
      `admission:${price.key}:currency`,
      `grade_legend:${grade.key}:color_hex`,
      `grade_legend:${grade.key}:color_name`,
      `hours:${hours.key}:closes_at`,
      `hours:${hours.key}:opens_at`,
      'provenance:verified_at',
    ].sort(),
  )
})

test('source details alone are not visit info', () => {
  const d = emptyVisitInfoDraft()
  d.provenance_note = 'Photo of sign'
  const r = buildVisitInfo(d)
  assert.ok(!r.ok && r.errors[0].field === 'provenance:note')
})

test('row limits match the API bounds', () => {
  const d = emptyVisitInfoDraft()
  d.rentals = Array.from({ length: 33 }, (_, i) => ({ ...emptyPriceDraft(), label: `R${i}`, amount: '1' }))
  const r = buildVisitInfo(d)
  assert.ok(!r.ok && r.errors.some((e) => e.field === 'rentals:add'))
})

test('edit round-trips existing info and requires rows (null clear is a separate action)', () => {
  const info = decodeGymVisitInfo(chillout.visit_info)!
  const r = planGymVisitUpdate(chillout.id, draftFromVisitInfo(info))
  assert.deepEqual(r, { ok: true, plan: { id: chillout.id, visit_info: info } })
  const empty = planGymVisitUpdate(chillout.id, emptyVisitInfoDraft())
  assert.ok(!empty.ok)
})

test('gyms stay listed with zero recorded routes; crags keep the route guard', () => {
  assert.equal(isPlaceListed('gym', 0, true), true)
  assert.equal(isPlaceListed('area', 0, true), false)
  assert.equal(isPlaceListed('area', 0, false), true)
  assert.equal(isPlaceListed('area', 2, true), true)
})
