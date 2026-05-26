import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useAuth } from '../auth/AuthProvider'
import { useCatalogAreas, useCatalogGyms, useCatalogRoutes } from '../../hooks/useCatalog'
import { useWishlistRouteIds } from '../../hooks/useMigration'
import type { ApiRoute } from '../../types/api'
import { CragsMap } from './CragsMap'

type ListStatusChip = 'all' | 'wishlist'

export function CragsView({
  onOpenRoute,
  onSignIn,
}: {
  onOpenRoute: (route: ApiRoute) => void
  onSignIn?: () => void
}) {
  const { accessToken } = useAuth()
  const isGuest = !accessToken
  const [filter, setFilter] = useState<'all' | 'crag' | 'gym'>('all')
  const [listStatusChip, setListStatusChip] = useState<ListStatusChip>('all')
  const [query, setQuery] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<{
    id: string
    kind: 'area' | 'gym'
    name: string
  } | null>(null)
  const areasQ = useCatalogAreas()
  const gymsQ = useCatalogGyms()
  const routesQ = useCatalogRoutes(0)
  const wishlistQ = useWishlistRouteIds()
  const wishlistIds = wishlistQ.data ?? new Set<string>()

  const routes = routesQ.data ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return routes.filter((r) => {
      if (listStatusChip === 'wishlist' && !wishlistIds.has(r.id)) return false
      if (filter === 'gym' && !r.gym_id) return false
      if (filter === 'crag' && !r.area_id) return false
      if (selectedPlace) {
        if (selectedPlace.kind === 'area' && r.area_id !== selectedPlace.id) return false
        if (selectedPlace.kind === 'gym' && r.gym_id !== selectedPlace.id) return false
      }
      if (!q) return true
      const hay = `${r.name} ${r.grade} ${r.area?.name ?? ''} ${r.gym?.name ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [routes, filter, query, selectedPlace, listStatusChip, wishlistIds])

  const wishlistCount = useMemo(
    () => routes.filter((r) => wishlistIds.has(r.id)).length,
    [routes, wishlistIds],
  )

  const onMapSelect = (id: string, kind: 'area' | 'gym') => {
    const name =
      kind === 'area'
        ? (areasQ.data ?? []).find((a) => a.id === id)?.name
        : (gymsQ.data ?? []).find((g) => g.id === id)?.name
    setSelectedPlace({ id, kind, name: name ?? 'Selected' })
    setFilter(kind === 'gym' ? 'gym' : 'crag')
  }

  return (
    <div className="view-crags">
      <div className="page-head">
        <div>
          <h1 className="page-title">Crags & gyms</h1>
          <p className="page-sub">Browse outdoor areas and gyms — tap a map pin to filter routes.</p>
        </div>
        <div className="chip-row">
          {(['all', 'crag', 'gym'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => {
                setFilter(f)
                if (f === 'all') setSelectedPlace(null)
              }}
            >
              {f === 'all' ? 'All' : f === 'crag' ? 'Outdoor' : 'Gyms'}
            </button>
          ))}
        </div>
      </div>
      <div className="chip-row" style={{ marginBottom: 12 }}>
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
      {selectedPlace && (
        <div className="crag-filter-banner">
          <span>
            Showing routes at <strong>{selectedPlace.name}</strong>
          </span>
          <button type="button" className="link-btn" onClick={() => setSelectedPlace(null)}>
            Clear
          </button>
        </div>
      )}
      <div className="crags-split">
        <div className="crags-list">
          <div className="search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={16} />
            <input
              placeholder="Search routes, areas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {routesQ.isLoading && <p className="muted">Loading routes…</p>}
          {routesQ.isError && <p className="error">Could not load routes.</p>}
          {listStatusChip === 'wishlist' && isGuest && (
            <p className="muted">
              <button type="button" className="link-btn" onClick={onSignIn}>
                Sign in
              </button>{' '}
              to see your saved routes.
            </p>
          )}
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              className="crag-row"
              onClick={() => onOpenRoute(r)}
            >
              <div>
                <strong>{r.name}</strong>
                <span className="chip" style={{ marginLeft: 8 }}>
                  {r.grade}
                </span>
                {wishlistIds.has(r.id) && (
                  <Icon name="bookmarkFilled" size={14} className="wishlist-inline-icon" />
                )}
              </div>
              <span className="muted" style={{ fontSize: 13 }}>
                {r.area?.name ?? r.gym?.name ?? '—'}
              </span>
            </button>
          ))}
          {!routesQ.isLoading && filtered.length === 0 && (
            <p className="muted">
              {listStatusChip === 'wishlist'
                ? 'No routes in your wishlist yet. Open a route and tap the bookmark to save it.'
                : 'No routes match this filter.'}
            </p>
          )}
        </div>
        <div className="crags-map-wrap">
          <CragsMap
            areas={areasQ.data ?? []}
            gyms={gymsQ.data ?? []}
            selectedId={selectedPlace?.id ?? null}
            onSelect={onMapSelect}
          />
        </div>
      </div>
    </div>
  )
}
