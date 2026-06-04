const CLIMB_QUERY_KEY = 'climb'

export function climbIdFromSearchParams(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const raw = params.get(CLIMB_QUERY_KEY)?.trim()
  return raw || null
}

export function buildClimbShareUrl(climbId: string): string {
  const url = new URL(`${window.location.origin}/app/feed`)
  url.searchParams.set(CLIMB_QUERY_KEY, climbId)
  return url.toString()
}

export function applyClimbSearchParam(
  searchParams: URLSearchParams,
  climbId: string | null,
): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  if (climbId) next.set(CLIMB_QUERY_KEY, climbId)
  else next.delete(CLIMB_QUERY_KEY)
  return next
}
