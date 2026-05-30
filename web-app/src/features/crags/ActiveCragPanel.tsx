import { Icon } from '../../components/Icon'
import { formatCragDistance, gradeBandLabel } from '../../lib/cragStats'
import { googleMapsDirectionsUrl } from '../../lib/approachGpx'
import type { ApiRoute } from '../../types/api'
import { CragThumb, type CragPanelRow } from './CragShared'

export type { CragPanelRow }

export function ActiveCragPanel({
  crag,
  routes,
  onDismiss,
  onOpenRoute,
  onApproach,
  onAddRoute,
  onShowAllRoutes,
  onGetDirections,
}: {
  crag: CragPanelRow
  routes: ApiRoute[]
  onDismiss: () => void
  onOpenRoute: (route: ApiRoute) => void
  onApproach?: () => void
  onAddRoute?: () => void
  onShowAllRoutes?: () => void
  onGetDirections?: () => void
}) {
  const sample = routes.slice(0, 3)
  const gradeBand = gradeBandLabel(routes.map((r) => r.grade ?? '').filter(Boolean))
  const moreCount = routes.length - sample.length

  return (
    <div className="active-crag-preview active-crag-panel">
      <div className="active-crag-panel-head">
        <CragThumb crag={crag} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{crag.name}</div>
            <span className="chip outline" style={{ height: 22 }}>
              {crag.kind === 'gym' ? 'Gym' : 'Outdoor'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>
            {crag.regionOrAddress ?? '—'} · {crag.routeCount} routes · {crag.wallCount} walls
            {crag.distanceKm != null ? ` · ${formatCragDistance(crag.distanceKm)}` : ''}
          </div>
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
        {crag.kind === 'gym' && crag.lat != null && crag.lng != null && (
          <button
            type="button"
            className="crag-action-row crag-action-primary"
            onClick={() => {
              if (onGetDirections) onGetDirections()
              else window.open(googleMapsDirectionsUrl(crag.lat!, crag.lng!, crag.name), '_blank', 'noopener')
            }}
          >
            <Icon name="pin" size={18} />
            <span style={{ flex: 1, fontWeight: 700 }}>Get directions</span>
            <Icon name="chevR" size={16} />
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
    </div>
  )
}
