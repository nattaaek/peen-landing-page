import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Icon } from '../../components/Icon'
import { useDeleteTopoLine, useSaveTopoLine, useUpdateTopoLine } from '../../hooks/useMigration'
import {
  fittedImageRect,
  normalizePointInFittedRect,
  normalizeTopoPathPoints,
  type FittedRect,
} from '../../lib/topoFittedLayout'
import type { RouteTopoLine, RouteTopoPoint } from '../../types/api'

const TOPO_COLORS = ['#FF6B35', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C3B1E1'] as const

function LiveTopoPreview({
  points,
  color,
  fitted,
}: {
  points: RouteTopoPoint[]
  color: string
  fitted: FittedRect
}) {
  if (points.length === 0 || fitted.width <= 0) return null
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * fitted.width} ${p.y * fitted.height}`)
    .join(' ')
  const first = points[0]
  return (
    <svg
      className="topo-editor-preview-svg"
      style={{ left: fitted.x, top: fitted.y, width: fitted.width, height: fitted.height }}
      viewBox={`0 0 ${fitted.width} ${fitted.height}`}
    >
      {points.length >= 2 && (
        <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x * fitted.width}
          cy={p.y * fitted.height}
          r={5}
          fill="#fff"
          stroke={color}
          strokeWidth={2}
        />
      ))}
      {first && points.length >= 1 && (
        <circle
          cx={first.x * fitted.width}
          cy={first.y * fitted.height}
          r={7}
          fill="#fff"
          stroke={color}
          strokeWidth={2}
        />
      )}
    </svg>
  )
}

export function TopoLineEditor({
  routeId,
  imageUrl,
  existingLine,
  onClose,
  onSaved,
}: {
  routeId: string
  imageUrl: string
  existingLine?: RouteTopoLine | null
  onClose: () => void
  onSaved: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [fitted, setFitted] = useState<FittedRect>({ x: 0, y: 0, width: 0, height: 0 })
  const [points, setPoints] = useState<RouteTopoPoint[]>(() =>
    normalizeTopoPathPoints(existingLine?.path_points ?? []),
  )
  const [color, setColor] = useState(existingLine?.color ?? TOPO_COLORS[0])
  const [label, setLabel] = useState(existingLine?.label ?? '')
  const [error, setError] = useState<string | null>(null)

  const saveTopo = useSaveTopoLine()
  const updateTopo = useUpdateTopoLine()
  const deleteTopo = useDeleteTopoLine()

  const recomputeFitted = useCallback(() => {
    const el = containerRef.current
    if (!el || !naturalSize) return
    const rect = el.getBoundingClientRect()
    setFitted(fittedImageRect(rect.width, rect.height, naturalSize.w, naturalSize.h))
  }, [naturalSize])

  useEffect(() => {
    setPoints(normalizeTopoPathPoints(existingLine?.path_points ?? []))
    setColor(existingLine?.color ?? TOPO_COLORS[0])
    setLabel(existingLine?.label ?? '')
    setError(null)
  }, [existingLine, imageUrl])

  useEffect(() => {
    recomputeFitted()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => recomputeFitted())
    ro.observe(el)
    return () => ro.disconnect()
  }, [recomputeFitted])

  const onCanvasClick = (e: MouseEvent) => {
    const el = containerRef.current
    if (!el || !naturalSize) return
    const norm = normalizePointInFittedRect(e.clientX, e.clientY, el.getBoundingClientRect(), fitted)
    if (!norm) return
    setPoints((prev) => [...prev, norm])
  }

  const handleSave = async () => {
    if (points.length < 2) return
    setError(null)
    try {
      if (existingLine) {
        await updateTopo.mutateAsync({
          lineId: existingLine.id,
          imageUrl,
          pathPoints: points,
          color,
          label: label.trim() || null,
          routeIdToInvalidate: routeId,
        })
      } else {
        await saveTopo.mutateAsync({
          routeId,
          imageUrl,
          pathPoints: points,
          color,
          label: label.trim() || null,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save topo line')
    }
  }

  const handleDelete = async () => {
    if (!existingLine) return
    setError(null)
    try {
      await deleteTopo.mutateAsync({ lineId: existingLine.id })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete topo line')
    }
  }

  const busy = saveTopo.isPending || updateTopo.isPending || deleteTopo.isPending

  return (
    <>
      <div className="modal-backdrop route-stack-modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal topo-editor-modal route-stack-modal"
        role="dialog"
        aria-label="Draw topo line"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{existingLine ? 'Edit topo line' : 'Draw topo line'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto' }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body topo-editor-body">
          <p className="muted topo-editor-hint">Tap on the photo to place points. Need at least 2 points.</p>
          <div ref={containerRef} className="topo-editor-canvas" onClick={onCanvasClick} role="presentation">
            <img
              src={imageUrl}
              alt="Topo"
              className="topo-editor-image"
              onLoad={(e) => {
                const img = e.currentTarget
                setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />
            <LiveTopoPreview points={points} color={color} fitted={fitted} />
          </div>
          <div className="topo-editor-toolbar">
            <button type="button" className="btn btn-secondary" disabled={points.length === 0 || busy} onClick={() => setPoints((p) => p.slice(0, -1))}>
              Undo
            </button>
            <button type="button" className="btn btn-secondary" disabled={points.length === 0 || busy} onClick={() => setPoints([])}>
              Clear
            </button>
            <span className="topo-editor-point-count">{points.length} pts</span>
          </div>
          <div className="topo-editor-colors">
            {TOPO_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`topo-editor-color-swatch${color === c ? ' active' : ''}`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="field">
            <label>Label (optional)</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Main line" />
          </div>
          {error && <p className="topo-editor-error">{error}</p>}
        </div>
        <div className="modal-foot">
          {existingLine && (
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={handleDelete}>
              Delete line
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || points.length < 2}
            onClick={handleSave}
          >
            {busy ? 'Saving…' : 'Save line'}
          </button>
        </div>
      </div>
    </>
  )
}
