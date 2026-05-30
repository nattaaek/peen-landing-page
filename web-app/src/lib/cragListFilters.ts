import { CRAG_RADIUS_KM } from './cragStats'
import type { CragPanelRow } from '../features/crags/CragShared'

export type CragSortOption = 'distance' | 'name' | 'routes' | 'walls'

export type CragListFilters = {
  maxDistanceKm: number
  regions: string[]
  minRoutes: number
}

export const DEFAULT_CRAG_LIST_FILTERS: CragListFilters = {
  maxDistanceKm: CRAG_RADIUS_KM,
  regions: [],
  minRoutes: 0,
}

export const CRAG_SORT_OPTIONS: { id: CragSortOption; label: string; sub: string }[] = [
  { id: 'distance', label: 'Nearest first', sub: 'Uses your location' },
  { id: 'name', label: 'Name A–Z', sub: 'Alphabetical' },
  { id: 'routes', label: 'Most routes', sub: 'Largest catalogs first' },
  { id: 'walls', label: 'Most walls', sub: 'By distinct topo surfaces' },
]

export function countActiveCragFilters(f: CragListFilters, hasLocation: boolean): number {
  let n = 0
  if (f.regions.length > 0) n += 1
  if (f.minRoutes > 0) n += 1
  if (hasLocation && f.maxDistanceKm < CRAG_RADIUS_KM) n += 1
  return n
}

export function applyCragListFilters(
  rows: CragPanelRow[],
  filters: CragListFilters,
  sort: CragSortOption,
  hasLocation: boolean,
): CragPanelRow[] {
  let list = [...rows]

  if (filters.regions.length > 0) {
    const set = new Set(filters.regions.map((r) => r.toLowerCase()))
    list = list.filter((c) => c.regionOrAddress && set.has(c.regionOrAddress.toLowerCase()))
  }

  if (filters.minRoutes > 0) {
    list = list.filter((c) => c.routeCount >= filters.minRoutes)
  }

  if (hasLocation) {
    list = list.filter((c) => c.distanceKm == null || c.distanceKm <= filters.maxDistanceKm)
  }

  list.sort((a, b) => {
    switch (sort) {
      case 'distance':
        if (!hasLocation) return a.name.localeCompare(b.name)
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      case 'routes':
        return b.routeCount - a.routeCount || a.name.localeCompare(b.name)
      case 'walls':
        return b.wallCount - a.wallCount || a.name.localeCompare(b.name)
      case 'name':
      default:
        return a.name.localeCompare(b.name)
    }
  })

  return list
}

export function uniqueCragRegions(rows: CragPanelRow[]): string[] {
  const set = new Set<string>()
  for (const c of rows) {
    const r = c.regionOrAddress?.trim()
    if (r) set.add(r)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
