import { imageUrlMatches, normalizeTopoPathPoints } from './topoFittedLayout'
import type { RouteTopoLine, RouteTopoPoint } from '../types/api'

function coercePathPoints(raw: unknown): RouteTopoPoint[] {
  if (Array.isArray(raw)) return normalizeTopoPathPoints(raw as RouteTopoPoint[])
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? normalizeTopoPathPoints(parsed as RouteTopoPoint[]) : []
    } catch {
      return []
    }
  }
  return []
}

export function normalizeTopoLines(lines: RouteTopoLine[] | undefined): RouteTopoLine[] {
  return (lines ?? []).map((line) => ({
    ...line,
    path_points: coercePathPoints(line.path_points),
  }))
}

export function firstImageUrlWithTopo(lines: RouteTopoLine[], imageUrls: string[]): string | null {
  for (const url of imageUrls) {
    if (lines.some((l) => imageUrlMatches(l.image_url, url))) return url
  }
  return null
}
