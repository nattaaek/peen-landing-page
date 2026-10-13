import type { ApiGym } from '../types/api'
import type {
  GymVisitGrade,
  GymVisitHours,
  GymVisitInfo,
  GymVisitPrice,
  GymVisitProvenance,
} from '../types/gymVisitInfo'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const CURRENCY_RE = /^[A-Z]{3}$/
const HEX_RE = /^#[0-9A-Fa-f]{6}$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const DECIMAL_RE = /^[-+]?\d+(\.\d+)?$/

function hasControlChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c < 0x20 || c === 0x7f) return true
  }
  return false
}

export const VISIT_INFO_LIMITS = {
  rowsPerList: 32,
  label: 80,
  grade: 16,
  colorName: 40,
  note: 280,
  amountMinor: 1_000_000_000,
  bytes: 16 * 1024,
  gymName: 120,
  address: 300,
} as const

type Json = Record<string, unknown>

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function nonBlank(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/** Optional text is missing, `null` or a string. Any other type makes the enclosing object invalid. */
function isOptionalText(v: unknown): v is string | null | undefined {
  return v === undefined || v === null || typeof v === 'string'
}

export function isCalendarDate(v: string): boolean {
  const m = DATE_RE.exec(v)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
}

function isAmountMinor(v: unknown): v is number {
  return (
    typeof v === 'number' &&
    Number.isSafeInteger(v) &&
    v >= 0 &&
    v <= VISIT_INFO_LIMITS.amountMinor
  )
}

function decodeRows<T>(raw: unknown, decodeRow: (row: Json) => T | null): T[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((row) => {
    if (!isObject(row)) return []
    const decoded = decodeRow(row)
    return decoded ? [decoded] : []
  })
}

function decodeHours(row: Json): GymVisitHours | null {
  if (!nonBlank(row.label)) return null
  if (typeof row.opens_at !== 'string' || !TIME_RE.test(row.opens_at)) return null
  if (typeof row.closes_at !== 'string' || !TIME_RE.test(row.closes_at)) return null
  const note = row.note
  if (!isOptionalText(note)) return null
  return { label: row.label, opens_at: row.opens_at, closes_at: row.closes_at, note: note ?? null }
}

function decodePrice(row: Json): GymVisitPrice | null {
  if (!nonBlank(row.label) || !isAmountMinor(row.amount_minor)) return null
  if (typeof row.currency !== 'string' || !CURRENCY_RE.test(row.currency)) return null
  const conditions = row.conditions
  if (!isOptionalText(conditions)) return null
  return {
    label: row.label,
    amount_minor: row.amount_minor,
    currency: row.currency,
    conditions: conditions ?? null,
  }
}

function decodeGrade(row: Json): GymVisitGrade | null {
  if (!nonBlank(row.grade) || !nonBlank(row.color_name)) return null
  const hex = typeof row.color_hex === 'string' && HEX_RE.test(row.color_hex) ? row.color_hex : null
  return { grade: row.grade, color_name: row.color_name, color_hex: hex }
}

function decodeProvenance(raw: unknown): GymVisitProvenance | null {
  if (!isObject(raw) || raw.source !== 'posted_sign') return null
  const note = raw.note
  if (!isOptionalText(note)) return null
  const verified =
    typeof raw.verified_at === 'string' && isCalendarDate(raw.verified_at) ? raw.verified_at : null
  return { source: 'posted_sign', verified_at: verified, note: note ?? null }
}

/**
 * Tolerant read: anything but a schema_version 1 object is unknown (`null`); invalid rows are dropped.
 * Provenance with a wrong-typed note reads as unknown (`null`) without touching the lists.
 */
export function decodeGymVisitInfo(raw: unknown): GymVisitInfo | null {
  if (!isObject(raw) || raw.schema_version !== 1) return null
  return {
    schema_version: 1,
    hours: decodeRows(raw.hours, decodeHours),
    admission: decodeRows(raw.admission, decodePrice),
    rentals: decodeRows(raw.rentals, decodePrice),
    grade_legend: decodeRows(raw.grade_legend, decodeGrade),
    provenance: decodeProvenance(raw.provenance),
  }
}

function finiteNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** Catalog row boundary. Returns `null` only when the row lacks a usable id or name. */
export function normalizeApiGym(raw: unknown): ApiGym | null {
  if (!isObject(raw) || !nonBlank(raw.id) || typeof raw.name !== 'string') return null
  return {
    id: raw.id,
    name: raw.name,
    latitude: finiteNumber(raw.latitude),
    longitude: finiteNumber(raw.longitude),
    address: nonBlank(raw.address) ? raw.address : undefined,
    created_by: nonBlank(raw.created_by) ? raw.created_by : null,
    visit_info: decodeGymVisitInfo(raw.visit_info),
  }
}

export function normalizeApiGyms(raw: unknown): ApiGym[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((row) => {
    const gym = normalizeApiGym(row)
    return gym ? [gym] : []
  })
}

export function hasListedVisitInfo(info: GymVisitInfo | null | undefined): info is GymVisitInfo {
  return !!info && (info.hours.length + info.admission.length + info.rentals.length + info.grade_legend.length > 0)
}

/** ISO 4217 minor-unit digits (THB 2, JPY 0, KWD 3). */
export function currencyMinorDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

/** Exact major-unit string from integer minor units: THB 38000 is "380", 38050 is "380.50". */
export function formatMinorAmount(amountMinor: number, currency: string): string {
  const digits = currencyMinorDigits(currency)
  if (digits === 0) return String(amountMinor)
  const divisor = 10 ** digits
  const fraction = amountMinor % divisor
  const major = (amountMinor - fraction) / divisor
  return fraction === 0 ? String(major) : `${major}.${String(fraction).padStart(digits, '0')}`
}

export function formatPrice(row: Pick<GymVisitPrice, 'amount_minor' | 'currency'>): string {
  const [major, fraction] = formatMinorAmount(row.amount_minor, row.currency).split('.')
  const grouped = Number(major).toLocaleString('en-US')
  return `${row.currency} ${fraction ? `${grouped}.${fraction}` : grouped}`
}

/** Parses a typed major amount ("380", "380.5") into integer minor units without floats. */
export function parseMajorAmount(text: string, currency: string): number | null {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(text.trim())
  if (!m) return null
  const digits = currencyMinorDigits(currency)
  const fraction = m[2] ?? ''
  if (fraction.length > digits) return null
  const minor = Number(m[1]) * 10 ** digits + Number(fraction.padEnd(digits, '0') || '0')
  return isAmountMinor(minor) ? minor : null
}

export function coordinateText(lat: number, lng: number): string {
  return `${lat}, ${lng}`
}

export function directionsUrl(lat: number, lng: number): string {
  const q = new URLSearchParams({ api: '1', destination: `${lat},${lng}` })
  return `https://www.google.com/maps/dir/?${q}`
}

// ---- Drafts (form state) ----

export interface HoursDraft { key: string; label: string; opens_at: string; closes_at: string; note: string }
export interface PriceDraft { key: string; label: string; amount: string; currency: string; conditions: string }
export interface GradeDraft { key: string; grade: string; color_name: string; color_hex: string }
export interface VisitInfoDraft {
  hours: HoursDraft[]
  admission: PriceDraft[]
  rentals: PriceDraft[]
  grade_legend: GradeDraft[]
  verified_at: string
  provenance_note: string
}
export interface GymLocationDraft { name: string; latitude: string; longitude: string; address: string }

export type PriceListKey = 'admission' | 'rentals'
export type DraftListKey = 'hours' | PriceListKey | 'grade_legend'

/** `field` matches the form control id suffix, e.g. `hours:r3:label`, so the form can focus it. */
export interface FieldError { field: string; message: string }

export function fieldDomId(formId: string, field: string): string {
  return `${formId}-${field.replace(/:/g, '-')}`
}

let draftKeySeq = 0
export function newDraftKey(): string {
  draftKeySeq += 1
  return `r${draftKeySeq}`
}

export function emptyHoursDraft(): HoursDraft {
  return { key: newDraftKey(), label: '', opens_at: '', closes_at: '', note: '' }
}
export function emptyPriceDraft(): PriceDraft {
  return { key: newDraftKey(), label: '', amount: '', currency: 'THB', conditions: '' }
}
export function emptyGradeDraft(): GradeDraft {
  return { key: newDraftKey(), grade: '', color_name: '', color_hex: '' }
}

export function emptyVisitInfoDraft(): VisitInfoDraft {
  return { hours: [], admission: [], rentals: [], grade_legend: [], verified_at: '', provenance_note: '' }
}

export function draftFromVisitInfo(info: GymVisitInfo | null | undefined): VisitInfoDraft {
  if (!info) return emptyVisitInfoDraft()
  const price = (p: GymVisitPrice): PriceDraft => ({
    key: newDraftKey(),
    label: p.label,
    amount: formatMinorAmount(p.amount_minor, p.currency),
    currency: p.currency,
    conditions: p.conditions ?? '',
  })
  return {
    hours: info.hours.map((h) => ({ key: newDraftKey(), label: h.label, opens_at: h.opens_at, closes_at: h.closes_at, note: h.note ?? '' })),
    admission: info.admission.map(price),
    rentals: info.rentals.map(price),
    grade_legend: info.grade_legend.map((g) => ({ key: newDraftKey(), grade: g.grade, color_name: g.color_name, color_hex: g.color_hex ?? '' })),
    verified_at: info.provenance?.verified_at ?? '',
    provenance_note: info.provenance?.note ?? '',
  }
}

const blank = (...values: string[]) => values.every((v) => v.trim() === '')

function textError(
  errors: FieldError[],
  field: string,
  name: string,
  value: string,
  max: number,
  required: boolean,
) {
  const trimmed = value.trim()
  if (!trimmed) {
    if (required) errors.push({ field, message: `${name} is required.` })
    return
  }
  if (trimmed.length > max) errors.push({ field, message: `${name} must be ${max} characters or fewer.` })
  else if (hasControlChar(trimmed)) errors.push({ field, message: `${name} cannot contain control characters.` })
}

const LIST_NAMES: Record<DraftListKey, string> = {
  hours: 'Hours',
  admission: 'Admission',
  rentals: 'Rentals',
  grade_legend: 'Grade colours',
}

export type BuildVisitInfoResult =
  | { ok: true; info: GymVisitInfo | null }
  | { ok: false; errors: FieldError[] }

/** Strict write-side build. Fully blank rows are ignored; `info: null` means nothing was entered. */
export function buildVisitInfo(draft: VisitInfoDraft): BuildVisitInfoResult {
  const errors: FieldError[] = []
  const L = VISIT_INFO_LIMITS

  const hours = draft.hours.filter((h) => !blank(h.label, h.opens_at, h.closes_at, h.note))
  const admission = draft.admission.filter((p) => !blank(p.label, p.amount, p.conditions))
  const rentals = draft.rentals.filter((p) => !blank(p.label, p.amount, p.conditions))
  const grades = draft.grade_legend.filter((g) => !blank(g.grade, g.color_name, g.color_hex))

  const lists: [DraftListKey, unknown[]][] = [
    ['hours', hours],
    ['admission', admission],
    ['rentals', rentals],
    ['grade_legend', grades],
  ]
  for (const [key, rows] of lists) {
    if (rows.length > L.rowsPerList) {
      errors.push({ field: `${key}:add`, message: `${LIST_NAMES[key]} can list at most ${L.rowsPerList} rows.` })
    }
  }

  const hoursOut = hours.map((h, i): GymVisitHours => {
    const at = (f: string) => `hours:${h.key}:${f}`
    const row = `Hours row ${i + 1}`
    textError(errors, at('label'), `${row} label`, h.label, L.label, true)
    for (const f of ['opens_at', 'closes_at'] as const) {
      if (!TIME_RE.test(h[f].trim())) {
        errors.push({ field: at(f), message: `${row} ${f === 'opens_at' ? 'opening' : 'closing'} time must be HH:mm (24-hour).` })
      }
    }
    textError(errors, at('note'), `${row} note`, h.note, L.note, false)
    return { label: h.label.trim(), opens_at: h.opens_at.trim(), closes_at: h.closes_at.trim(), note: h.note.trim() || null }
  })

  const priceOut = (list: PriceListKey, rows: PriceDraft[]) =>
    rows.map((p, i): GymVisitPrice => {
      const at = (f: string) => `${list}:${p.key}:${f}`
      const row = `${LIST_NAMES[list]} row ${i + 1}`
      textError(errors, at('label'), `${row} label`, p.label, L.label, true)
      const currency = p.currency.trim()
      if (!CURRENCY_RE.test(currency)) {
        errors.push({ field: at('currency'), message: `${row} currency must be 3 uppercase letters, e.g. THB.` })
      }
      const minor = CURRENCY_RE.test(currency) ? parseMajorAmount(p.amount, currency) : null
      if (CURRENCY_RE.test(currency) && minor === null) {
        const digits = currencyMinorDigits(currency)
        errors.push({
          field: at('amount'),
          message: digits === 0
            ? `${row} price must be a whole number, e.g. 380.`
            : `${row} price must be a number with up to ${digits} decimals, e.g. 380 or 380.50.`,
        })
      }
      textError(errors, at('conditions'), `${row} conditions`, p.conditions, L.note, false)
      return { label: p.label.trim(), amount_minor: minor ?? 0, currency, conditions: p.conditions.trim() || null }
    })
  const admissionOut = priceOut('admission', admission)
  const rentalsOut = priceOut('rentals', rentals)

  const gradesOut = grades.map((g, i): GymVisitGrade => {
    const at = (f: string) => `grade_legend:${g.key}:${f}`
    const row = `Grade colour row ${i + 1}`
    textError(errors, at('grade'), `${row} grade`, g.grade, L.grade, true)
    textError(errors, at('color_name'), `${row} colour name`, g.color_name, L.colorName, true)
    const hex = g.color_hex.trim()
    if (hex && !HEX_RE.test(hex)) {
      errors.push({ field: at('color_hex'), message: `${row} colour code must look like #RRGGBB, or be left empty.` })
    }
    return { grade: g.grade.trim(), color_name: g.color_name.trim(), color_hex: hex || null }
  })

  const verified = draft.verified_at.trim()
  if (verified && !isCalendarDate(verified)) {
    errors.push({ field: 'provenance:verified_at', message: 'Verified date must be a real date (YYYY-MM-DD).' })
  }
  textError(errors, 'provenance:note', 'Source note', draft.provenance_note, L.note, false)

  const listedRows = hoursOut.length + admissionOut.length + rentalsOut.length + gradesOut.length
  if (listedRows === 0) {
    if (!blank(draft.verified_at, draft.provenance_note)) {
      errors.push({
        field: 'provenance:note',
        message: 'Add at least one hours, price or grade colour row before adding source details.',
      })
    }
    return errors.length ? { ok: false, errors } : { ok: true, info: null }
  }
  if (errors.length) return { ok: false, errors }

  const info: GymVisitInfo = {
    schema_version: 1,
    hours: hoursOut,
    admission: admissionOut,
    rentals: rentalsOut,
    grade_legend: gradesOut,
    provenance: { source: 'posted_sign', verified_at: verified || null, note: draft.provenance_note.trim() || null },
  }
  if (new TextEncoder().encode(JSON.stringify(info)).length > L.bytes) {
    return { ok: false, errors: [{ field: 'provenance:note', message: 'Posted info is too long to save. Remove some rows or notes.' }] }
  }
  return { ok: true, info }
}

function parseCoordinate(text: string, limit: number): number | null {
  const t = text.trim()
  if (!DECIMAL_RE.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

export interface GymCreateParams {
  name: string
  latitude: number
  longitude: number
  address: string | null
}

export type GymCreatePlan =
  | { op: 'createGym'; params: GymCreateParams }
  | { op: 'createGymWithVisitInfo'; params: GymCreateParams & { visit_info: GymVisitInfo } }

export type PlanResult<T> = { ok: true; plan: T } | { ok: false; errors: FieldError[] }

/** Chooses exactly one create op: legacy `createGym` without visit info, `createGymWithVisitInfo` with it. */
export function planGymCreate(location: GymLocationDraft, visit: VisitInfoDraft): PlanResult<GymCreatePlan> {
  const errors: FieldError[] = []
  const L = VISIT_INFO_LIMITS
  textError(errors, 'gym:name', 'Gym name', location.name, L.gymName, true)

  const latitude = parseCoordinate(location.latitude, 90)
  const longitude = parseCoordinate(location.longitude, 180)
  if (latitude === null) errors.push({ field: 'gym:latitude', message: 'Latitude must be a number between -90 and 90.' })
  if (longitude === null) errors.push({ field: 'gym:longitude', message: 'Longitude must be a number between -180 and 180.' })
  if (latitude === 0 && longitude === 0) {
    errors.push({ field: 'gym:latitude', message: "0, 0 is not a gym location. Enter the gym's actual coordinates." })
  }
  textError(errors, 'gym:address', 'Address', location.address, L.address, false)

  const built = buildVisitInfo(visit)
  if (!built.ok) errors.push(...built.errors)
  if (errors.length || !built.ok || latitude === null || longitude === null) return { ok: false, errors }

  const params: GymCreateParams = {
    name: location.name.trim(),
    latitude,
    longitude,
    address: location.address.trim() || null,
  }
  return built.info
    ? { ok: true, plan: { op: 'createGymWithVisitInfo', params: { ...params, visit_info: built.info } } }
    : { ok: true, plan: { op: 'createGym', params } }
}

export interface GymVisitUpdateParams { id: string; visit_info: GymVisitInfo | null }

export function planGymVisitUpdate(gymId: string, visit: VisitInfoDraft): PlanResult<GymVisitUpdateParams> {
  const built = buildVisitInfo(visit)
  if (!built.ok) return built
  if (!built.info) {
    return {
      ok: false,
      errors: [{ field: 'hours:add', message: 'Add at least one hours, price or grade colour row, or remove the posted info instead.' }],
    }
  }
  return { ok: true, plan: { id: gymId, visit_info: built.info } }
}
