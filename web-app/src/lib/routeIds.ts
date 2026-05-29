/** Canonical route id for Set lookups and API params (UUID case-insensitive). */
export function normalizeRouteId(id: string): string {
  return id.trim().toLowerCase()
}

export function wishlistIdsToSet(ids: string[] | undefined): Set<string> {
  return new Set((ids ?? []).map(normalizeRouteId))
}
