import { useQuery } from '@tanstack/react-query'
import { catalogAreas, catalogGyms, catalogRoute, catalogRoutes } from '../lib/peen-api/catalog'
import { loadCatalogCache } from '../lib/catalogSearch'

export function useCatalogAreas() {
  return useQuery({ queryKey: ['catalog', 'areas'], queryFn: catalogAreas, staleTime: 60_000 })
}

export function useCatalogGyms() {
  return useQuery({ queryKey: ['catalog', 'gyms'], queryFn: catalogGyms, staleTime: 60_000 })
}

export function useCatalogRoutes(page = 0) {
  return useQuery({
    queryKey: ['catalog', 'routes', page],
    queryFn: () => catalogRoutes(page, 80),
    staleTime: 30_000,
  })
}

export function useCatalogRoute(id: string | null) {
  return useQuery({
    queryKey: ['catalog', 'route', id],
    queryFn: () => catalogRoute(id!),
    enabled: !!id,
  })
}

/** Full route catalog (paginated fetch, session cache) for crag stats and search. */
export function useCatalogAllRoutes() {
  return useQuery({
    queryKey: ['catalog', 'routes', 'all'],
    queryFn: loadCatalogCache,
    staleTime: 60_000,
  })
}
