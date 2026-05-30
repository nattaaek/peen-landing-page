import type { ApiArea, ApiGym, ApiRoute } from '../types/api'

const ANGLE_TAGS = new Set(['slab', 'vertical', 'overhang', 'roof', 'steep', 'crack', 'traverse'])

/** Design copy default when location is unavailable. */
export const CRAG_RADIUS_KM = 800

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatCragDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km >= 100) return `${Math.round(km)} km`
  return `${km.toFixed(km < 10 ? 1 : 0)} km`
}

/** Rough French sport grade ordering for band labels. */
export function gradeRank(grade: string): number | null {
  const g = grade.trim().toLowerCase()
  if (!g) return null
  const m = /^(\d)([a-c])?(\+)?$/.exec(g)
  if (!m) return null
  const base = parseInt(m[1], 10) * 100
  const letterMap: Record<string, number> = { a: 0, b: 10, c: 20 }
  const letter = m[2] ? (letterMap[m[2]] ?? 0) : 0
  const plus = m[3] ? 5 : 0
  return base + letter + plus
}

export function gradeBandLabel(grades: string[]): string | null {
  const ranked = grades
    .map((g) => ({ g, r: gradeRank(g) }))
    .filter((x): x is { g: string; r: number } => x.r != null)
  if (ranked.length === 0) {
    const any = grades.find((g) => g.trim())
    return any ?? null
  }
  ranked.sort((a, b) => a.r - b.r)
  const lo = ranked[0].g
  const hi = ranked[ranked.length - 1].g
  return lo === hi ? lo : `${lo} – ${hi}`
}

/** Distinct topo / wall surfaces inferred from route image URLs. */
export function wallCountForRoutes(routes: ApiRoute[]): number {
  if (routes.length === 0) return 0
  const walls = new Set<string>()
  for (const r of routes) {
    const key = r.images?.[0] ?? r.gallery_images?.[0] ?? r.id
    walls.add(key)
  }
  return Math.max(walls.size, 1)
}

function mode(values: string[]): string | null {
  if (values.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best = values[0]
  let bestN = 0
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k
      bestN = n
    }
  }
  return best
}

/** Map overlay chip: e.g. "Limestone · sport" from route metadata. */
export function layersChipLabel(routes: ApiRoute[]): string | null {
  if (routes.length === 0) return null
  const typeNames = routes
    .map((r) => r.route_type?.name?.trim())
    .filter((n): n is string => !!n)
  const type = mode(typeNames.map((n) => n.toLowerCase()))
  const styleTags = routes
    .flatMap((r) => r.style_tags ?? [])
    .map((t) => t.trim())
    .filter((t) => t && !ANGLE_TAGS.has(t.toLowerCase()))
  const rock = mode(styleTags.map((t) => t.toLowerCase()))
  if (rock && type) return `${capitalize(rock)} · ${type}`
  if (type) return type
  if (rock) return capitalize(rock)
  return null
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function resolveAreaCoordinate(area: ApiArea, routes: ApiRoute[]): { lat: number; lng: number } | null {
  if (area.latitude != null && area.longitude != null && (area.latitude !== 0 || area.longitude !== 0)) {
    return { lat: area.latitude, lng: area.longitude }
  }
  const withCoords = routes.filter((r) => r.latitude && r.longitude && (r.latitude !== 0 || r.longitude !== 0))
  if (withCoords.length === 0) return null
  const lat = withCoords.reduce((s, r) => s + (r.latitude ?? 0), 0) / withCoords.length
  const lng = withCoords.reduce((s, r) => s + (r.longitude ?? 0), 0) / withCoords.length
  return { lat, lng }
}

export function resolveGymCoordinate(gym: ApiGym): { lat: number; lng: number } | null {
  if (gym.latitude == null || gym.longitude == null) return null
  if (gym.latitude === 0 && gym.longitude === 0) return null
  return { lat: gym.latitude, lng: gym.longitude }
}

export function routesForPlace(
  routes: ApiRoute[],
  id: string,
  kind: 'area' | 'gym',
): ApiRoute[] {
  return routes.filter((r) => (kind === 'area' ? r.area_id === id : r.gym_id === id))
}
