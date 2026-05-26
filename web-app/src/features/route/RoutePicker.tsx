import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useCatalogRoutes } from '../../hooks/useCatalog'
import type { ApiRoute } from '../../types/api'

export function RoutePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (route: ApiRoute) => void
}) {
  const [query, setQuery] = useState('')
  const routesQ = useCatalogRoutes(0)
  const routes = routesQ.data ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return routes.slice(0, 40)
    return routes
      .filter((r) => {
        const hay = `${r.name} ${r.grade} ${r.area?.name ?? ''} ${r.gym?.name ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 40)
  }, [routes, query])

  if (!open) return null

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal route-picker" role="dialog" aria-label="Pick a route">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Pick a route</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <label className="search" style={{ marginTop: 16, width: '100%' }}>
          <Icon name="search" size={16} />
          <input
            placeholder="Search by name, grade, crag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </label>
        <div className="route-picker-list">
          {routesQ.isLoading && <p className="muted">Loading routes…</p>}
          {routesQ.isError && <p className="error">Could not load routes.</p>}
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              className="crag-row"
              onClick={() => {
                onSelect(r)
                onClose()
              }}
            >
              <div>
                <strong>{r.name}</strong>
                {r.grade && (
                  <span className="chip" style={{ marginLeft: 8 }}>
                    {r.grade}
                  </span>
                )}
              </div>
              <span className="muted" style={{ fontSize: 13 }}>
                {r.area?.name ?? r.gym?.name ?? '—'}
              </span>
            </button>
          ))}
          {!routesQ.isLoading && filtered.length === 0 && (
            <p className="muted">No routes match. Try another search.</p>
          )}
        </div>
      </div>
    </>
  )
}
