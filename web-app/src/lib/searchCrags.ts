import type { ApiArea, ApiGym } from '../types/api'

export type CragSearchHit = {
  id: string
  name: string
  region?: string
  kind: 'area' | 'gym'
  routeCount?: number
}

export function searchCragHits(
  query: string,
  areas: ApiArea[],
  gyms: ApiGym[],
  routeCountByAreaId?: Map<string, number>,
  limit = 4,
): CragSearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: CragSearchHit[] = []
  for (const area of areas) {
    const hay = `${area.name} ${area.region ?? ''}`.toLowerCase()
    if (!hay.includes(q)) continue
    hits.push({
      id: area.id,
      name: area.name,
      region: area.region,
      kind: 'area',
      routeCount: routeCountByAreaId?.get(area.id),
    })
  }
  for (const gym of gyms) {
    if (!gym.name.toLowerCase().includes(q)) continue
    hits.push({
      id: gym.id,
      name: gym.name,
      kind: 'gym',
    })
  }
  return hits.slice(0, limit)
}
