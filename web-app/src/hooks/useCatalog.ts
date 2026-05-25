import { useQuery } from '@tanstack/react-query'
import { catalogAreas, catalogGyms, catalogRoute, catalogRoutes } from '../lib/peen-api/catalog'

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
