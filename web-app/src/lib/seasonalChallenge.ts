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

export function daysLeftUntilEnd(endDate: string | undefined): number | null {
  if (!endDate) return null
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(end.getTime())) return null
  const today = new Date()
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
