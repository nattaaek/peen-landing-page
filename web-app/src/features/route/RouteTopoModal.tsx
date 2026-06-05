import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { ModalPortal } from '../../components/ModalPortal'
import { useRoutesByIds } from '../../hooks/useCatalog'
import { gradeBandStyle } from '../../lib/gradeBand'
import { imageUrlMatches } from '../../lib/topoFittedLayout'
import { normalizeRouteId } from '../../lib/routeIds'
import type { ApiRoute, RouteTopoLine } from '../../types/api'
import { TopoImageWithLines } from './TopoImageWithLines'

function topoLineName(line: RouteTopoLine, routeById: Map<string, ApiRoute>): string {
  const label = line.label?.trim()
  if (label) return label
  const route = routeById.get(normalizeRouteId(line.route_id))
  return route?.name ?? 'Route'
}

function topoLineGrade(line: RouteTopoLine, routeById: Map<string, ApiRoute>): string {
  return routeById.get(normalizeRouteId(line.route_id))?.grade ?? '—'
}

export function RouteTopoModal({
  open,
  onClose,
  imageUrls,
  activeImageUrl,
  onSelectImage,
  lines,
  loading,
  isGuest,
  onSignIn,
  onDrawTopo,
  homeRouteId,
  originRoute,
  onLineRouteTap,
}: {
  open: boolean
  onClose: () => void
  imageUrls: string[]
  activeImageUrl: string | null
  onSelectImage: (url: string) => void
  lines: RouteTopoLine[]
  loading: boolean
  isGuest: boolean
  onSignIn: () => void
  onDrawTopo: (imageUrl: string) => void
  homeRouteId?: string
  /** Route that opened this sheet (avoids extra fetch for its label). */
  originRoute?: ApiRoute | null
  onLineRouteTap?: (routeId: string) => void
}) {
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null)

  useEffect(() => {
    setHighlightedRouteId(null)
  }, [activeImageUrl])

  const activeLines = activeImageUrl
    ? lines.filter((l) => imageUrlMatches(l.image_url, activeImageUrl))
    : []
  const activeIndex = activeImageUrl
    ? imageUrls.findIndex((u) => imageUrlMatches(u, activeImageUrl))
    : -1

  const routeIds = useMemo(() => activeLines.map((l) => l.route_id), [activeLines])
  const routesQ = useRoutesByIds(routeIds)

  const routeById = useMemo(() => {
    const map = new Map<string, ApiRoute>()
    if (originRoute) map.set(normalizeRouteId(originRoute.id), originRoute)
    for (const route of routesQ.data ?? []) {
      map.set(normalizeRouteId(route.id), route)
    }
    return map
  }, [originRoute, routesQ.data])

  if (!open) return null

  const startDraw = () => {
    if (!activeImageUrl) return
    if (isGuest) {
      onSignIn()
      return
    }
    onDrawTopo(activeImageUrl)
  }

  const linesOnOtherPhotos =
    activeLines.length === 0 &&
    lines.length > 0 &&
    imageUrls.some(
      (url) =>
        !imageUrlMatches(url, activeImageUrl ?? '') &&
        lines.some((l) => imageUrlMatches(l.image_url, url)),
    )

  const handleLineRowTap = (line: RouteTopoLine) => {
    const id = normalizeRouteId(line.route_id)
    setHighlightedRouteId((prev) => (prev === id ? null : id))
    if (homeRouteId && id === normalizeRouteId(homeRouteId)) return
    if (isGuest) {
      onSignIn()
      return
    }
    onLineRouteTap?.(line.route_id)
  }

  return (
    <ModalPortal>
      <div className="modal-backdrop route-stack-modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal route-topo-modal route-topo-modal-ios route-stack-modal"
        role="dialog"
        aria-label="Topo photos"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body route-topo-modal-body">
          {loading && imageUrls.length > 0 ? (
            <p className="muted route-topo-modal-empty">Loading topo lines…</p>
          ) : imageUrls.length === 0 ? (
            <p className="muted route-topo-modal-empty">No route photos available.</p>
          ) : activeImageUrl ? (
            <>
              <div className="route-topo-modal-stage">
                <TopoImageWithLines
                  imageUrl={activeImageUrl}
                  lines={activeLines}
                  fit="contain"
                  homeRouteId={highlightedRouteId ?? homeRouteId}
                  onLineRouteTap={
                    isGuest
                      ? () => onSignIn()
                      : (routeId) => {
                          setHighlightedRouteId(normalizeRouteId(routeId))
                          if (homeRouteId && normalizeRouteId(routeId) === normalizeRouteId(homeRouteId)) return
                          onLineRouteTap?.(routeId)
                        }
                  }
                />
                <div className="route-topo-modal-stage-chrome">
                  {imageUrls.length > 1 && activeIndex >= 0 && (
                    <span className="route-topo-modal-counter">
                      {activeIndex + 1} / {imageUrls.length}
                    </span>
                  )}
                  <button type="button" className="route-topo-modal-close" onClick={onClose} aria-label="Close">
                    <Icon name="close" size={20} />
                  </button>
                </div>
                {imageUrls.length > 1 && (
                  <div className="route-topo-modal-thumbs scroll-x">
                    {imageUrls.map((url) => {
                      const active = imageUrlMatches(url, activeImageUrl)
                      const count = lines.filter((l) => imageUrlMatches(l.image_url, url)).length
                      return (
                        <button
                          key={url}
                          type="button"
                          className={`route-topo-thumb route-topo-thumb-on-dark${active ? ' active' : ''}`}
                          onClick={() => onSelectImage(url)}
                          aria-label="Select photo"
                        >
                          <img src={url} alt="" />
                          {count > 0 && <span className="route-topo-thumb-badge">{count}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
                {activeLines.length > 0 && (
                  <div className="route-topo-lines-panel">
                    <div className="route-topo-lines-panel-head">
                      <span className="route-topo-lines-panel-title">Lines on this topo</span>
                      <span className="route-topo-lines-panel-hint">Tap a line or row → route</span>
                    </div>
                    <ul className="route-topo-lines-panel-list">
                      {activeLines.map((line) => {
                        const id = normalizeRouteId(line.route_id)
                        const selected = highlightedRouteId === id
                        const name = topoLineName(line, routeById)
                        const grade = topoLineGrade(line, routeById)
                        const band = gradeBandStyle(grade === '—' ? '' : grade)
                        return (
                          <li key={line.id}>
                            <button
                              type="button"
                              className={`route-topo-lines-panel-row${selected ? ' selected' : ''}`}
                              onClick={() => handleLineRowTap(line)}
                            >
                              <span
                                className="route-topo-line-swatch"
                                style={{ background: line.color }}
                                aria-hidden
                              />
                              <span className="route-topo-lines-panel-name">{name}</span>
                              <span
                                className="route-topo-lines-panel-grade"
                                style={{ background: band.fill, color: band.text }}
                              >
                                {grade}
                              </span>
                              <Icon name="chevR" size={14} className="route-topo-lines-panel-chev" />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="route-topo-modal-panel">
                <div className="route-topo-modal-actions">
                  <button type="button" className="btn btn-primary" onClick={startDraw}>
                    <Icon name="plus" size={16} /> Draw topo line
                  </button>
                </div>
                {activeLines.length === 0 && (
                  <p className="muted route-topo-modal-hint">
                    {linesOnOtherPhotos
                      ? 'Topo lines are on another photo — switch thumbnails on the image.'
                      : lines.length > 0
                        ? 'No topo lines on this photo.'
                        : 'No topo lines on this route yet.'}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </ModalPortal>
  )
}
