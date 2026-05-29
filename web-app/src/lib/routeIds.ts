/** Canonical route id for Set lookups and API params (UUID case-insensitive). */
export function normalizeRouteId(id: string): string {
  return id.trim().toLowerCase()
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Parse a route id from API/feed JSON (string UUID only). */
export function parseRouteId(value: unknown): string | null {
  if (value == null) return null
  const raw = typeof value === 'string' ? value.trim() : String(value).trim()
  if (!raw || !UUID_RE.test(raw)) return null
  return normalizeRouteId(raw)
}

export function wishlistIdsToSet(ids: string[] | undefined): Set<string> {
  return new Set((ids ?? []).map(normalizeRouteId))
}
