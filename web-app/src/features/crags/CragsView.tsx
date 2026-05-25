import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useCatalogAreas, useCatalogGyms, useCatalogRoutes } from '../../hooks/useCatalog'
import type { ApiRoute } from '../../types/api'
import { CragsMap } from './CragsMap'

export function CragsView({ onOpenRoute }: { onOpenRoute: (route: ApiRoute) => void }) {
  const [filter, setFilter] = useState<'all' | 'crag' | 'gym'>('all')
  const [query, setQuery] = useState('')
  const areasQ = useCatalogAreas()
  const gymsQ = useCatalogGyms()
  const routesQ = useCatalogRoutes(0)

  const routes = routesQ.data ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return routes.filter((r) => {
      if (filter === 'gym' && !r.gym_id) return false
      if (filter === 'crag' && !r.area_id) return false
      if (!q) return true
      const hay = `${r.name} ${r.grade} ${r.area?.name ?? ''} ${r.gym?.name ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [routes, filter, query])

  return (
    <div className="view-crags">
      <div className="view-head">
        <h1>Crags & gyms</h1>
        <div className="chip-row">
          {(['all', 'crag', 'gym'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'crag' ? 'Outdoor' : 'Gyms'}
            </button>
          ))}
        </div>
      </div>
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
              </div>
              <span className="muted" style={{ fontSize: 13 }}>
                {r.area?.name ?? r.gym?.name ?? '—'}
              </span>
            </button>
          ))}
        </div>
        <div className="crags-map-wrap">
          <CragsMap areas={areasQ.data ?? []} gyms={gymsQ.data ?? []} />
        </div>
      </div>
    </div>
  )
}
