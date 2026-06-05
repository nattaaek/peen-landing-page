import { useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  contentRectAspectFill,
  normalizeTopoPathPoints,
  type FittedRect,
} from '../../lib/topoFittedLayout'
import type { RouteTopoLine } from '../../types/api'

const VIEW = 100

function renderLinePath(
  points: { x: number; y: number }[],
  color: string,
  key: string,
  opts?: { strokeWidth?: number; opacity?: number; onClick?: (e: MouseEvent) => void },
) {
  if (points.length < 2) return null
  const d = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x * VIEW} ${p.y * VIEW}`)
    .join(' ')
  return (
    <g key={key} style={{ cursor: opts?.onClick ? 'pointer' : undefined }} onClick={opts?.onClick}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={opts?.strokeWidth ?? 2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={opts?.opacity ?? 0.92}
      />
      {points.map((p, idx) => (
        <circle
          key={`${key}-pt-${idx}`}
          cx={p.x * VIEW}
          cy={p.y * VIEW}
          r={idx === 0 ? 2.8 : 1.8}
          fill={idx === 0 ? '#fff' : color}
          stroke={color}
          strokeWidth={idx === 0 ? 1.2 : 0}
        />
      ))}
    </g>
  )
}

export function TopoImageWithLines({
  imageUrl,
  lines,
  fit = 'cover',
  homeRouteId,
  onLineRouteTap,
}: {
  imageUrl: string
  lines: RouteTopoLine[]
  /** Hero uses cover (iOS aspect fill); editor/modal use contain. */
  fit?: 'cover' | 'contain'
  homeRouteId?: string
  onLineRouteTap?: (routeId: string) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [content, setContent] = useState<FittedRect>({ x: 0, y: 0, width: 0, height: 0 })

  const syncNaturalFromImage = (img: HTMLImageElement) => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    }
  }

  useEffect(() => {
    setNatural(null)
    const img = imgRef.current
    if (img?.complete) {
      syncNaturalFromImage(img)
    }
  }, [imageUrl])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      if (!natural) {
        setContent({ x: 0, y: 0, width: rect.width, height: rect.height })
        return
      }
      if (fit === 'contain') {
        const scale = Math.min(rect.width / natural.w, rect.height / natural.h)
        const width = natural.w * scale
        const height = natural.h * scale
        setContent({
          x: (rect.width - width) / 2,
          y: (rect.height - height) / 2,
          width,
          height,
        })
      } else {
        setContent(contentRectAspectFill(rect.width, rect.height, natural.w, natural.h))
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [natural, fit])

  const preparedLines = lines
    .map((line) => ({
      ...line,
      path_points: normalizeTopoPathPoints(line.path_points ?? []),
    }))
    .filter((l) => (l.path_points?.length ?? 0) >= 2)

  return (
    <div ref={wrapRef} className="route-topo-image-wrap">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Topo photo"
        className={`route-topo-image route-topo-image-${fit}`}
        style={{
          left: content.x,
          top: content.y,
          width: content.width > 0 ? content.width : '100%',
          height: content.height > 0 ? content.height : '100%',
        }}
        onLoad={(e) => syncNaturalFromImage(e.currentTarget)}
      />
      {preparedLines.length > 0 && content.width > 0 && (
        <svg
          className="route-topo-overlay"
          style={{
            left: content.x,
            top: content.y,
            width: content.width,
            height: content.height,
          }}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          preserveAspectRatio="none"
          pointerEvents={onLineRouteTap ? 'auto' : 'none'}
        >
          {preparedLines.map((line) => {
            const isHome = homeRouteId != null && line.route_id === homeRouteId
            const canTap = !!onLineRouteTap && !isHome && line.route_id
            return renderLinePath(line.path_points, line.color || '#FF6B35', line.id, {
              strokeWidth: isHome ? 3.2 : 2.2,
              opacity: isHome ? 1 : 0.88,
              onClick: canTap
                ? (e) => {
                    e.stopPropagation()
                    onLineRouteTap(line.route_id)
                  }
                : undefined,
            })
          })}
        </svg>
      )}
    </div>
  )
}
