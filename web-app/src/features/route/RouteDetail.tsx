import { Icon } from '../../components/Icon'
import { useCatalogRoute } from '../../hooks/useCatalog'
import type { ApiRoute } from '../../types/api'

export function RouteDetailOverlay({
  routeId,
  onClose,
  onLog,
  isGuest,
  onSignIn,
}: {
  routeId: string
  onClose: () => void
  onLog: (route: ApiRoute) => void
  isGuest: boolean
  onSignIn: () => void
}) {
  const routeQ = useCatalogRoute(routeId)
  const route = routeQ.data

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover" role="dialog">
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--fg-2)' }}>
            {route?.area?.name ?? route?.gym?.name ?? 'Route'}
          </div>
        </div>
        <div className="slideover-body">
          {routeQ.isLoading && <p className="muted">Loading route…</p>}
          {route && (
            <>
              <div className="route-hero-placeholder" />
              <div style={{ padding: 24 }}>
                <h2 style={{ margin: 0 }}>{route.name}</h2>
                <span className="chip" style={{ marginLeft: 8 }}>
                  {route.grade}
                </span>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => (isGuest ? onSignIn() : onLog(route))}
                  >
                    <Icon name="plus" size={16} /> Log a send
                  </button>
                </div>
                {route.description && (
                  <p style={{ marginTop: 16, lineHeight: 1.5 }}>{route.description}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
