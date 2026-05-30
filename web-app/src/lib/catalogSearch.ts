import { catalogRoutes } from './peen-api/catalog'
import type { ApiRoute } from '../types/api'

const PAGE_SIZE = 80
const MAX_PAGES = 12

let catalogCache: ApiRoute[] | null = null
let catalogLoadPromise: Promise<ApiRoute[]> | null = null

/** Load full catalog once per session (client cache for search). */
export async function loadCatalogCache(): Promise<ApiRoute[]> {
  if (catalogCache) return catalogCache
  if (!catalogLoadPromise) {
    catalogLoadPromise = (async () => {
      const all: ApiRoute[] = []
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await catalogRoutes(page, PAGE_SIZE)
        all.push(...batch)
        if (batch.length < PAGE_SIZE) break
      }
      catalogCache = all
      return all
    })()
  }
  return catalogLoadPromise
}

/** Drop session cache (after catalog writes). */
export function invalidateCatalogCache(): void {
  catalogCache = null
  catalogLoadPromise = null
}

/** Filter cached catalog (call `loadCatalogCache` once on app/search open). */
export function filterCatalogRoutes(routes: ApiRoute[], query: string, limit = 24): ApiRoute[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: ApiRoute[] = []
  for (const r of routes) {
    const hay = `${r.name} ${r.grade ?? ''} ${r.area?.name ?? ''} ${r.gym?.name ?? ''}`.toLowerCase()
    if (hay.includes(q)) hits.push(r)
    if (hits.length >= limit) break
  }
  return hits
}

/** Search routes (uses session catalog cache). */
export async function searchCatalogRoutes(query: string, limit = 24): Promise<ApiRoute[]> {
  const routes = await loadCatalogCache()
  return filterCatalogRoutes(routes, query, limit)
}
