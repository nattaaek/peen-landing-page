import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useAuth } from '../auth/AuthProvider'
import { useCatalogAreas, useCatalogGyms, useCatalogRoutes } from '../../hooks/useCatalog'
import { useWishlistRouteIds } from '../../hooks/useMigration'
import { normalizeRouteId, wishlistIdsToSet } from '../../lib/routeIds'
import type { ApiArea, ApiGym, ApiRoute } from '../../types/api'
import { CragsMap, type CragsMapHandle } from './CragsMap'

type ListStatusChip = 'all' | 'wishlist'
type CragKind = 'area' | 'gym'

type ActiveCrag = {
  id: string
  kind: CragKind
  name: string
  regionOrAddress?: string
}

function stableGradientForId(id: string): string {
  // Small, deterministic hash -> picks one of a few hardcoded gradients.
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  const palettes = [
    ['#E0A77A', '#7A4426'],
    ['#E5C088', '#5C3318'],
    ['#B5A99A', '#544740'],
    ['#9CA39A', '#3F523F'],
    ['#D8BA90', '#7A4426'],
    ['#1F1F20', '#4A4D52'],
    ['#2860A3', '#1F1F20'],
  ] as const
  const pick = palettes[h % palettes.length]
  return `linear-gradient(140deg, ${pick[0]}, ${pick[1]})`
}

function CragThumb({ crag, size = 60 }: { crag: ActiveCrag; size?: number }) {
  const gradient = stableGradientForId(crag.id)
  const accent = crag.kind === 'gym' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.10)'

  return (
    <div
      className="thumb"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: gradient,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--separator)',
      }}
    >
      <svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice" width={size} height={size}>
        <path d="M 0 38 C 12 26, 22 36, 34 24 S 54 16, 60 30 L 60 60 L 0 60 Z" fill="#000" opacity={0.15} />
        <path d="M 0 48 C 14 38, 28 46, 40 38 S 58 30, 60 44 L 60 60 L 0 60 Z" fill="#000" opacity={0.12} />
        {crag.kind === 'gym' && (
          <rect
            x="18"
            y="14"
            width="24"
            height="32"
            fill={accent}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
        )}
      </svg>
    </div>
  )
}

export function CragsView({
  onOpenRoute,
  onSignIn,
  onToast,
}: {
  onOpenRoute: (route: ApiRoute) => void
  onSignIn?: (message?: string) => void
  onToast?: (msg: string) => void
}) {
  const { accessToken } = useAuth()
  const location = useLocation()
  const isGuest = !accessToken
  const [filter, setFilter] = useState<'all' | 'crag' | 'gym'>('all')
  const [listStatusChip, setListStatusChip] = useState<ListStatusChip>('all')
  const [query, setQuery] = useState('')
  const [activeCrag, setActiveCrag] = useState<ActiveCrag | null>(null)
  const mapRef = useRef<CragsMapHandle>(null)

  const areasQ = useCatalogAreas()
  const gymsQ = useCatalogGyms()
  const routesQ = useCatalogRoutes(0)
  const wishlistQ = useWishlistRouteIds()
  const wishlistIds = useMemo(() => wishlistIdsToSet(wishlistQ.data), [wishlistQ.data])

  const routes = routesQ.data ?? []

  const allCrags = useMemo((): ActiveCrag[] => {
    const areas: ApiArea[] = areasQ.data ?? []
    const gyms: ApiGym[] = gymsQ.data ?? []

    const areaRouteCount = new Map<string, number>()
    const gymRouteCount = new Map<string, number>()
    for (const r of routes) {
      if (r.area_id) areaRouteCount.set(r.area_id, (areaRouteCount.get(r.area_id) ?? 0) + 1)
      if (r.gym_id) gymRouteCount.set(r.gym_id, (gymRouteCount.get(r.gym_id) ?? 0) + 1)
    }

    const q = query.trim().toLowerCase()

    const areaRows: ActiveCrag[] = areas
      .filter(() => filter !== 'gym')
      .filter((a) => (!q ? true : a.name.toLowerCase().includes(q)))
      .map((a) => ({
        id: a.id,
        kind: 'area' as const,
        name: a.name,
        regionOrAddress: a.region,
      }))
      .filter((c) => (routes.length ? (areaRouteCount.get(c.id) ?? 0) > 0 : true))

    const gymRows: ActiveCrag[] = gyms
      .filter(() => filter !== 'crag')
      .filter((g) => (!q ? true : g.name.toLowerCase().includes(q)))
      .map((g) => ({
        id: g.id,
        kind: 'gym' as const,
        name: g.name,
        regionOrAddress: g.address,
      }))
      .filter((c) => (routes.length ? (gymRouteCount.get(c.id) ?? 0) > 0 : true))

    const byFilter = (c: ActiveCrag) => {
      if (filter === 'all') return true
      if (filter === 'crag') return c.kind === 'area'
      if (filter === 'gym') return c.kind === 'gym'
      return true
    }

    return [...areaRows, ...gymRows].filter(byFilter)
  }, [areasQ.data, gymsQ.data, routes, filter, query])

  const wishlistCount = useMemo(
    () => routes.filter((r) => wishlistIds.has(normalizeRouteId(r.id))).length,
    [routes, wishlistIds],
  )

  useEffect(() => {
    if (activeCrag) return
    if (allCrags.length > 0) setActiveCrag(allCrags[0])
  }, [activeCrag, allCrags])

  useEffect(() => {
    const pinName = (location.state as { pinName?: string } | null)?.pinName
    if (!pinName || allCrags.length === 0) return
    const match = allCrags.find((c) => c.name.toLowerCase() === pinName.toLowerCase())
    if (match) setActiveCrag(match)
  }, [location.state, allCrags])

  const routesForActiveCrag = useMemo(() => {
    if (!activeCrag) return []
    const list = routes.filter((r) => (activeCrag.kind === 'area' ? r.area_id === activeCrag.id : r.gym_id === activeCrag.id))
    const wishFiltered =
      listStatusChip === 'wishlist' ? list.filter((r) => wishlistIds.has(normalizeRouteId(r.id))) : list
    // Sort by "best looking" heuristic: grade string then name.
    return [...wishFiltered].sort((a, b) => (b.grade ?? '').localeCompare(a.grade ?? '') || b.name.localeCompare(a.name))
  }, [activeCrag, routes, listStatusChip, wishlistIds])

  const routeSampleForPreview = routesForActiveCrag.slice(0, 3)

  const gradeBandLabel = useMemo(() => {
    const grades = routesForActiveCrag.map((r) => r.grade).filter(Boolean) as string[]
    if (grades.length === 0) return null
    const sorted = [...grades].sort()
    return sorted.length === 1 ? sorted[0] : `${sorted[0]} – ${sorted[sorted.length - 1]}`
  }, [routesForActiveCrag])

  return (
    <div className="crags-split">
      <div className="crags-list">
        <div className="crag-list-head">
          <h1 className="page-title" style={{ fontSize: 24, marginBottom: 4 }}>
            Crags & gyms
          </h1>
          <div className="page-sub" style={{ marginBottom: 14 }}>
            {allCrags.length} locations · within 800 km
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['all', 'crag', 'gym'] as const).map((f) => (
              <button
                key={f}
                className="chip"
                style={{
                  background: filter === f ? 'var(--peen-charcoal)' : 'var(--surface)',
                  color: filter === f ? '#fff' : 'var(--fg-1)',
                  cursor: 'pointer',
                  height: 30,
                  padding: '0 14px',
                }}
                type="button"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'crag' ? 'Outdoor' : 'Gyms'}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button
                className="icon-btn"
                aria-label="Filter"
                type="button"
                onClick={() => {
                  // Placeholder for future filter/sort controls (prototype has icons here).
                }}
              >
                <Icon name="filter" size={18} />
              </button>
              <button className="icon-btn" aria-label="Sort" type="button" onClick={() => {}}>
                <Icon name="sort" size={18} />
              </button>
            </div>
          </div>

          <label className="search" style={{ flex: 1, height: 36 }}>
            <Icon name="search" size={14} />
            <input placeholder="Filter by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>

          <div className="chip-row" style={{ marginTop: 12 }}>
            {(
              [
                ['all', 'All routes', routes.length],
                ['wishlist', 'Wishlist', wishlistCount],
              ] as const
            ).map(([chip, label, count]) => (
              <button
                key={chip}
                type="button"
                className={`chip ${listStatusChip === chip ? 'active' : ''}`}
                onClick={() => {
                  if (chip === 'wishlist' && isGuest) {
                    onSignIn?.()
                    return
                  }
                  setListStatusChip(chip)
                }}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        <div>
          {allCrags.map((c) => (
            <div
              key={c.id + c.kind}
              className={`crag-row ${activeCrag?.id === c.id && activeCrag?.kind === c.kind ? 'active' : ''}`}
              onClick={() => setActiveCrag(c)}
              role="button"
              tabIndex={0}
            >
              <CragThumb crag={c} />
              <div className="info">
                <div className="name">{c.name}</div>
                <div className="meta">
                  <span>
                    <Icon name="pin" size={12} />
                    {c.regionOrAddress ?? '—'}
                  </span>
                  <span>{routes.filter((r) => (c.kind === 'area' ? r.area_id === c.id : r.gym_id === c.id)).length} routes</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="chip outline" style={{ fontWeight: 700 }}>
                  {routes.filter((r) => (c.kind === 'area' ? r.area_id === c.id : r.gym_id === c.id)).length}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--fg-2)',
                    marginTop: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    fontWeight: 700,
                  }}
                >
                  {c.kind === 'gym' ? 'Gym' : 'Outdoor'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="crags-map" style={{ position: 'relative', height: '100%', minHeight: 320 }}>
        <CragsMap
          ref={mapRef}
          areas={areasQ.data ?? []}
          gyms={gymsQ.data ?? []}
          selectedId={activeCrag?.id ?? null}
          onSelect={(id, kind) => {
            const name = kind === 'area' ? (areasQ.data ?? []).find((a) => a.id === id)?.name : (gymsQ.data ?? []).find((g) => g.id === id)?.name
            const regionOrAddress =
              kind === 'area' ? (areasQ.data ?? []).find((a) => a.id === id)?.region : (gymsQ.data ?? []).find((g) => g.id === id)?.address
            setActiveCrag({ id, kind, name: name ?? 'Selected', regionOrAddress })
          }}
        />

        <div className="map-overlay">
          {activeCrag?.kind === 'area' && (
            <div
              className="chip solid"
              style={{
                background: '#fff',
                color: 'var(--fg-1)',
                border: '1px solid var(--separator)',
                boxShadow: 'var(--shadow-card)',
                height: 32,
                padding: '0 12px',
              }}
            >
              <Icon name="layers" size={14} /> Limestone · sport
            </div>
          )}
          {gradeBandLabel && (
            <div
              className="chip solid"
              style={{
                background: '#fff',
                color: 'var(--fg-1)',
                border: '1px solid var(--separator)',
                boxShadow: 'var(--shadow-card)',
                height: 32,
                padding: '0 12px',
              }}
            >
              <Icon name="grade" size={14} /> {gradeBandLabel}
            </div>
          )}
          <button
            type="button"
            className="btn-log"
            style={{ marginLeft: 'auto', height: 32, fontSize: 13 }}
            onClick={() => {
              if (isGuest) {
                onSignIn?.('Sign in to suggest a new route.')
                return
              }
              onToast?.('Route suggestions coming soon.')
            }}
          >
            <Icon name="plus" size={14} /> Add route here
          </button>
        </div>

        <div className="map-zoom">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
            <Icon name="plus" size={18} />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>–</span>
          </button>
        </div>

        {activeCrag && (
          <div
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 16,
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              padding: 16,
              boxShadow: 'var(--shadow-button)',
              display: 'flex',
              alignItems: 'stretch',
              gap: 14,
              maxWidth: 720,
              margin: '0 auto',
              border: '1px solid var(--separator)',
            }}
          >
            <div style={{ flex: '0 0 auto' }}>
              <CragThumb crag={activeCrag} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{activeCrag.name}</div>
                <span className="chip outline" style={{ height: 22 }}>
                  {activeCrag.kind === 'gym' ? 'Gym' : 'Outdoor'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>
                {activeCrag.regionOrAddress ?? '—'} · {routes.filter((r) => (activeCrag.kind === 'area' ? r.area_id === activeCrag.id : r.gym_id === activeCrag.id)).length} routes
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, flexWrap: 'wrap' }}>
                {routeSampleForPreview.length === 0 ? (
                  <span className="muted">No routes found in the current page.</span>
                ) : (
                  routeSampleForPreview.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
                      onClick={() => onOpenRoute(r)}
                    >
                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                      <span style={{ color: 'var(--fg-2)' }}> · {r.grade}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ alignSelf: 'center', height: 36 }}
              onClick={() => {
                if (routeSampleForPreview.length > 0) onOpenRoute(routeSampleForPreview[0])
              }}
              disabled={routeSampleForPreview.length === 0}
            >
              Open <Icon name="chevR" size={16} />
            </button>
          </div>
        )}

        {routesQ.isLoading && <div style={{ position: 'absolute', top: 16, left: 16 }} className="muted">Loading routes…</div>}
        {routesQ.isError && (
          <div style={{ position: 'absolute', top: 16, left: 16 }} className="error">
            Could not load routes.
          </div>
        )}
      </div>
    </div>
  )
}
