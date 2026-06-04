import type { ApiRoute } from '../types/api'

/** Quickdraws for clipping bolts + typical sport anchor (matches iOS). */
export function packingQuickdrawsCount(route: ApiRoute): number {
  const bolts = route.bolt_count ?? 0
  if (bolts <= 0) return 0
  return bolts + 2
}

/** Minimum common rope length for single-pitch sport (matches iOS heuristic). */
export function recommendedRopeMetersForPitch(route: ApiRoute): number {
  const len = route.length_meters ?? 0
  if (len <= 0) return 60
  if (len <= 28) return 60
  if (len <= 38) return 70
  return 80
}

export function bringStatForRoute(route: ApiRoute): { value: string; sub: string } {
  const draws = packingQuickdrawsCount(route)
  if (draws > 0) {
    return {
      value: `${draws} draws`,
      sub: `${recommendedRopeMetersForPitch(route)} m rope`,
    }
  }
  return { value: '—', sub: 'Varies by style' }
}
