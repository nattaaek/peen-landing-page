import { Icon } from '../../components/Icon'
import { imageUrlMatches } from '../../lib/topoFittedLayout'
import type { RouteTopoLine } from '../../types/api'
import { TopoImageWithLines } from './TopoImageWithLines'

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
  onEditLine,
  homeRouteId,
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
  onEditLine: (line: RouteTopoLine) => void
  homeRouteId?: string
  onLineRouteTap?: (routeId: string) => void
}) {
  if (!open) return null

  const activeLines = activeImageUrl
    ? lines.filter((l) => imageUrlMatches(l.image_url, activeImageUrl))
    : []
  const activeIndex = activeImageUrl
    ? imageUrls.findIndex((u) => imageUrlMatches(u, activeImageUrl))
    : -1

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
    imageUrls.some((url) => !imageUrlMatches(url, activeImageUrl ?? '') && lines.some((l) => imageUrlMatches(l.image_url, url)))

  return (
    <>
      <div className="modal-backdrop route-stack-modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal route-topo-modal route-stack-modal"
        role="dialog"
        aria-label="Topo photos"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>Topo</h3>
          {imageUrls.length > 1 && activeIndex >= 0 && (
            <span className="chip outline" style={{ marginLeft: 8 }}>
              {activeIndex + 1} / {imageUrls.length}
            </span>
          )}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto' }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body route-topo-modal-body">
          {loading && imageUrls.length > 0 ? (
            <p className="muted">Loading topo lines…</p>
          ) : imageUrls.length === 0 ? (
            <p className="muted">No route photos available.</p>
          ) : activeImageUrl ? (
            <>
              <div className="route-topo-modal-stage">
                <TopoImageWithLines
                  imageUrl={activeImageUrl}
                  lines={activeLines}
                  fit="contain"
                  homeRouteId={homeRouteId}
                  onLineRouteTap={onLineRouteTap}
                />
              </div>
              {imageUrls.length > 1 && (
                <div className="scroll-x route-topo-modal-thumbs">
                  {imageUrls.map((url) => {
                    const active = url === activeImageUrl
                    const count = lines.filter((l) => imageUrlMatches(l.image_url, url)).length
                    return (
                      <button
                        key={url}
                        type="button"
                        className={`route-topo-thumb${active ? ' active' : ''}`}
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
              <div className="route-topo-modal-actions">
                <button type="button" className="btn btn-primary" onClick={startDraw}>
                  <Icon name="plus" size={16} /> Draw topo line
                </button>
              </div>
              {activeLines.length > 0 ? (
                <ul className="route-topo-line-list">
                  {activeLines.map((line) => (
                    <li key={line.id} className="route-topo-line-item">
                      <span
                        className="route-topo-line-swatch"
                        style={{ background: line.color }}
                        aria-hidden
                      />
                      <span className="route-topo-line-meta">
                        {line.label?.trim() || 'Topo line'} · {(line.path_points ?? []).length} points
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ height: 32, padding: '0 12px' }}
                        onClick={() => (isGuest ? onSignIn() : onEditLine(line))}
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                  {linesOnOtherPhotos
                    ? 'Topo line is on another photo — switch thumbnails above.'
                    : lines.length > 0
                      ? 'No topo lines on this photo.'
                      : 'No topo lines on this route yet.'}
                </p>
              )}
            </>
          ) : null}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  )
}
