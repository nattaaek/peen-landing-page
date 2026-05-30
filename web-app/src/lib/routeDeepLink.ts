import { normalizeRouteId, parseRouteId } from './routeIds'

const ROUTE_QUERY_KEY = 'route'

/** Read `?route=<uuid>` from the current location. */
export function routeIdFromSearchParams(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const raw = params.get(ROUTE_QUERY_KEY)
  if (!raw) return null
  return parseRouteId(raw)
}

export function buildRouteShareUrl(routeId: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set(ROUTE_QUERY_KEY, normalizeRouteId(routeId))
  return url.toString()
}

export function applyRouteSearchParam(
  searchParams: URLSearchParams,
  routeId: string | null,
): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  if (routeId) next.set(ROUTE_QUERY_KEY, normalizeRouteId(routeId))
  else next.delete(ROUTE_QUERY_KEY)
  return next
}
