import type { RouteTopoPoint } from '../types/api'

export type FittedRect = { x: number; y: number; width: number; height: number }

/** Same as iOS `TopoAspectFitGeometry.contentRectAspectFill` (scaleAspectFill). */
export function contentRectAspectFill(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): FittedRect {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) {
    return { x: 0, y: 0, width: containerW, height: containerH }
  }
  const scale = Math.max(containerW / imageW, containerH / imageH)
  const width = imageW * scale
  const height = imageH * scale
  return {
    x: (containerW - width) / 2,
    y: (containerH - height) / 2,
    width,
    height,
  }
}

/** Compare storage URLs ignoring query tokens and trailing slashes. */
export function imageUrlMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const norm = (url: string) => {
    try {
      const u = new URL(url)
      return `${u.origin}${u.pathname}`.replace(/\/$/, '')
    } catch {
      return url.trim().replace(/\/$/, '')
    }
  }
  return norm(a) === norm(b)
}

/** Aspect-fit image rect inside a container (matches iOS TopoImageFittedLayout). */
export function fittedImageRect(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): FittedRect {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  const scale = Math.min(containerW / imageW, containerH / imageH)
  const width = imageW * scale
  const height = imageH * scale
  return {
    x: (containerW - width) / 2,
    y: (containerH - height) / 2,
    width,
    height,
  }
}

/** Normalized 0–1 point inside the fitted image bounds. */
export function normalizePointInFittedRect(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  fitted: FittedRect,
): { x: number; y: number } | null {
  const localX = clientX - containerRect.left - fitted.x
  const localY = clientY - containerRect.top - fitted.y
  if (fitted.width <= 0 || fitted.height <= 0) return null
  if (localX < 0 || localY < 0 || localX > fitted.width || localY > fitted.height) return null
  return { x: localX / fitted.width, y: localY / fitted.height }
}

/** Legacy rows may store pixel coords; iOS stores 0–1 normalized. */
export function normalizeTopoPathPoints(points: RouteTopoPoint[]): RouteTopoPoint[] {
  if (points.length === 0) return points
  const max = Math.max(...points.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]))
  if (max <= 1.5) return points
  return points.map((p) => ({ x: p.x / max, y: p.y / max }))
}
