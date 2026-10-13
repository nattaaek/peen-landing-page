import type {
  SeasonalChallengeProgress,
  SeasonalRouteProgress,
  SeasonalSpotlight,
} from '../types/seasonalChallenge'

export function parseSeasonalSpotlight(raw: unknown): SeasonalSpotlight | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const challengeId = o.challenge_id
  const title = o.title
  if (typeof challengeId !== 'string' || typeof title !== 'string') return null
  return {
    challenge_id: challengeId,
    slug: typeof o.slug === 'string' ? o.slug : undefined,
    title,
    subtitle: typeof o.subtitle === 'string' ? o.subtitle : undefined,
    reward_summary: typeof o.reward_summary === 'string' ? o.reward_summary : undefined,
    start_date: typeof o.start_date === 'string' ? o.start_date : undefined,
    end_date: typeof o.end_date === 'string' ? o.end_date : undefined,
    days_left: typeof o.days_left === 'number' ? o.days_left : undefined,
    joined_count: typeof o.joined_count === 'number' ? o.joined_count : undefined,
    routes_total: typeof o.routes_total === 'number' ? o.routes_total : undefined,
    my_completed_count: typeof o.my_completed_count === 'number' ? o.my_completed_count : undefined,
    achievement_id: typeof o.achievement_id === 'string' ? o.achievement_id : undefined,
    hero_image_url: typeof o.hero_image_url === 'string' ? o.hero_image_url : null,
  }
}

/** Asia/Bangkok has been a fixed UTC+7 with no DST since 1920; event dates are Bangkok calendar days. */
const BANGKOK_OFFSET_MS = 7 * 3_600_000

export function daysLeftUntilEnd(endDate: string | undefined, now: Date = new Date()): number | null {
  if (!endDate) return null
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(end.getTime())) return null
  const today = new Date(now.getTime() + BANGKOK_OFFSET_MS)
  const startToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const endStart = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.round((endStart - startToday) / 86_400_000)
}

export function seasonWindowPhrase(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  const a = fmt(start)
  const b = fmt(end)
  return a && b ? `${a} – ${b}` : ''
}

const EVENT_DATE = /^\d{4}-\d{2}-\d{2}$/

function eventDay(iso: string): Date | null {
  const day = iso.slice(0, 10)
  if (!EVENT_DATE.test(day)) return null
  const d = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== day) return null
  return d
}

const eventDayLabel = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/**
 * Eligibility copy for the server-configured event window, or null when the dates are unusable.
 * The window is Bangkok calendar days and closes exclusively at 00:00 Bangkok on the day after end_date.
 * The server alone decides what counts; this only describes the rule.
 */
export function challengeEligibilityRules(start: string, end: string): string[] | null {
  const from = eventDay(start)
  const to = eventDay(end)
  if (!from || !to || to.getTime() < from.getTime()) return null
  const close = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1))
  return [
    `A climb counts only if both the day you climbed it and the first time Peen receives your log are within the event dates, ${eventDayLabel(from)} through ${eventDayLabel(to)}, Bangkok time (UTC+7). Peen must first receive the log at or after 12:00 AM on ${eventDayLabel(from)} and before 12:00 AM on ${eventDayLabel(close)}, Bangkok time (UTC+7), when the event closes.`,
    'Logs saved offline or sent after the event closes do not count, even when the climb date is inside the event. There is no grace period.',
    'Those logs still save to your climbing history as usual.',
  ]
}

export function groupRoutesByGrade(
  routes: SeasonalRouteProgress[],
): { grade: string; routes: SeasonalRouteProgress[] }[] {
  const order: string[] = []
  const map = new Map<string, SeasonalRouteProgress[]>()
  for (const r of routes) {
    const g = r.grade_label || 'Other'
    if (!map.has(g)) {
      map.set(g, [])
      order.push(g)
    }
    map.get(g)!.push(r)
  }
  return order.map((grade) => ({
    grade,
    routes: (map.get(grade) ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }))
}

export function routeStatusLabel(item: SeasonalRouteProgress): string {
  if (item.completed) return 'Complete'
  switch (item.status) {
    case 'needs_photo':
    case 'needs_photo_or_verify':
      return 'Needs photo'
    case 'pending_verify':
      return 'Pending'
    default:
      return 'Not logged'
  }
}

export function challengeProgressPct(p: SeasonalChallengeProgress): number {
  const total = Math.max(p.routes_total, 1)
  return Math.round((p.routes_completed_count / total) * 100)
}

export function heroRegionTagline(title: string): string {
  return title.replace(/\s+Classics$/i, '').trim().toLowerCase()
}

export function pastSeasonMeta(row: {
  routes_total: number
  start_date: string
  end_date: string
}): string {
  const routesPart = `${row.routes_total} routes`
  const fmt = (iso: string) => {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  }
  const a = fmt(row.start_date)
  const b = fmt(row.end_date)
  return a && b ? `${routesPart} · ${a} – ${b}` : routesPart
}

export function spotlightProgressPct(spotlight: SeasonalSpotlight): number {
  const total = Math.max(spotlight.routes_total ?? 1, 1)
  const done = spotlight.my_completed_count ?? 0
  return Math.round((done / total) * 100)
}
