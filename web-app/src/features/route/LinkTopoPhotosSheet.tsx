import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { loadCatalogCache } from '../../lib/catalogSearch'
import { imageUrlMatches } from '../../lib/topoFittedLayout'
import type { ApiRoute } from '../../types/api'

type Phase = { kind: 'routes' } | { kind: 'images'; source: ApiRoute }

export function LinkTopoPhotosSheet({
  open,
  routeId,
  areaId,
  existingUrls,
  onClose,
  onLink,
}: {
  open: boolean
  routeId: string
  areaId?: string | null
  existingUrls: string[]
  onClose: () => void
  onLink: (urls: string[]) => void
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'routes' })
  const [search, setSearch] = useState('')
  const [routes, setRoutes] = useState<ApiRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) {
      setPhase({ kind: 'routes' })
      setSearch('')
      setSelected(new Set())
      return
    }
    let cancelled = false
    setLoading(true)
    loadCatalogCache()
      .then((all) => {
        if (cancelled) return
        const filtered = all.filter((r) => {
          if (r.id === routeId) return false
          if (areaId && r.area_id !== areaId) return false
          const urls = [...(r.images ?? []), ...(r.gallery_images ?? [])]
          const existing = new Set(existingUrls)
          return urls.some((u) => u && !existing.has(u))
        })
        setRoutes(filtered)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, routeId, areaId, existingUrls.join('\0')])

  const routeList = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return routes.slice(0, 40)
    return routes
      .filter((r) => `${r.name} ${r.grade ?? ''}`.toLowerCase().includes(q))
      .slice(0, 40)
  }, [routes, search])

  if (!open) return null

  const source = phase.kind === 'images' ? phase.source : null
  const candidateUrls = source
    ? [...(source.images ?? []), ...(source.gallery_images ?? [])].filter(
        (u) =>
          u &&
          !existingUrls.some((e) => imageUrlMatches(e, u)),
      )
    : []

  const toggleUrl = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  return (
    <>
      <div className="modal-backdrop route-stack-modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal route-stack-modal route-link-topo-modal"
        role="dialog"
        aria-label="Link wall photos"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{phase.kind === 'routes' ? 'Link wall photo' : 'Choose photos'}</h3>
          {phase.kind === 'images' && (
            <button
              type="button"
              className="link-btn"
              style={{ marginRight: 'auto', marginLeft: 12 }}
              onClick={() => {
                setSelected(new Set())
                setPhase({ kind: 'routes' })
              }}
            >
              Back
            </button>
          )}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">
          {phase.kind === 'routes' && (
            <>
              <input
                className="route-link-search"
                placeholder="Search routes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {loading && <p className="muted">Loading routes…</p>}
              {!loading && routeList.length === 0 && (
                <p className="muted">No other routes with linkable photos at this crag.</p>
              )}
              <div className="route-link-route-list">
                {routeList.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="route-link-route-row"
                    onClick={() => {
                      setSelected(new Set())
                      setPhase({ kind: 'images', source: r })
                    }}
                  >
                    <span className="route-link-route-name">{r.name}</span>
                    {r.grade && <span className="chip outline">{r.grade}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
          {phase.kind === 'images' && source && (
            <div className="route-link-image-grid">
              {candidateUrls.map((url) => {
                const on = selected.has(url)
                return (
                  <button
                    key={url}
                    type="button"
                    className={`route-link-image-btn${on ? ' selected' : ''}`}
                    onClick={() => toggleUrl(url)}
                  >
                    <img src={url} alt="" />
                    {on && <span className="route-link-image-check">✓</span>}
                  </button>
                )
              })}
              {candidateUrls.length === 0 && (
                <p className="muted">This route has no new photos to link.</p>
              )}
            </div>
          )}
        </div>
        {phase.kind === 'images' && (
          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selected.size === 0}
              onClick={() => {
                onLink([...selected])
                onClose()
              }}
            >
              Add {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
