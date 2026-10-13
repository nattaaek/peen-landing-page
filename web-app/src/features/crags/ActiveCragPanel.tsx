import type { ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { formatCragDistance, gradeBandLabel } from '../../lib/cragStats'
import type { ApiRoute } from '../../types/api'
import { CragThumb, type CragPanelRow } from './CragShared'

export type { CragPanelRow }

export function ActiveCragPanel({
  crag,
  routes,
  routesLoaded,
  visitSection,
  onDismiss,
  onOpenRoute,
  onApproach,
  onAddRoute,
  onShowAllRoutes,
}: {
  crag: CragPanelRow
  routes: ApiRoute[]
  routesLoaded: boolean
  /** Posted gym info, shown before the recorded route list. */
  visitSection?: ReactNode
  onDismiss: () => void
  onOpenRoute: (route: ApiRoute) => void
  onApproach?: () => void
  onAddRoute?: () => void
  onShowAllRoutes?: () => void
}) {
  const sample = routes.slice(0, 3)
  const gradeBand = gradeBandLabel(routes.map((r) => r.grade ?? '').filter(Boolean))
  const moreCount = routes.length - sample.length
  const meta = [
    crag.kind === 'gym' ? crag.regionOrAddress : (crag.regionOrAddress ?? '—'),
    `${crag.routeCount} routes`,
    `${crag.wallCount} walls`,
    crag.distanceKm != null ? formatCragDistance(crag.distanceKm) : null,
  ].filter(Boolean)

  return (
    <div className="active-crag-preview active-crag-panel">
      <div className="active-crag-panel-head">
        <CragThumb crag={crag} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{crag.name}</h2>
            <span className="chip outline" style={{ height: 22 }}>
              {crag.kind === 'gym' ? 'Gym' : 'Outdoor'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>{meta.join(' · ')}</div>
          {gradeBand && (
            <div style={{ marginTop: 8 }}>
              <span className="chip blue" style={{ fontWeight: 700 }}>
                {gradeBand}
              </span>
            </div>
          )}
        </div>
        <button type="button" className="icon-btn" onClick={onDismiss} aria-label="Dismiss">
          <Icon name="close" size={18} />
        </button>
      </div>

      {visitSection}

      <div className="crag-action-list">
        {crag.kind === 'area' && onApproach && (
          <button type="button" className="crag-action-row" onClick={onApproach}>
            <Icon name="pin" size={18} />
            <span style={{ flex: 1, fontWeight: 700 }}>Approach</span>
            <Icon name="chevR" size={16} style={{ color: 'var(--fg-2)' }} />
          </button>
        )}
        {onAddRoute && (
          <button type="button" className="crag-action-row" onClick={onAddRoute}>
            <Icon name="plus" size={18} />
            <span style={{ flex: 1, fontWeight: 700 }}>Add route here</span>
            <Icon name="chevR" size={16} style={{ color: 'var(--fg-2)' }} />
          </button>
        )}
      </div>

      {sample.length > 0 && (
        <div className="crag-route-preview-list">
          {sample.map((r) => (
            <button key={r.id} type="button" className="crag-route-preview-row" onClick={() => onOpenRoute(r)}>
              <span style={{ flex: 1, fontWeight: 600, textAlign: 'left' }}>{r.name}</span>
              <span className="chip" style={{ fontWeight: 700 }}>
                {r.grade}
              </span>
              <Icon name="chevR" size={14} style={{ color: 'var(--fg-2)' }} />
            </button>
          ))}
          {moreCount > 0 && onShowAllRoutes && (
            <button type="button" className="crag-more-routes" onClick={onShowAllRoutes}>
              + {moreCount} more route{moreCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      )}
      {routes.length === 0 && routesLoaded && <p className="crag-routes-empty">No routes recorded in Peen yet.</p>}
    </div>
  )
}
