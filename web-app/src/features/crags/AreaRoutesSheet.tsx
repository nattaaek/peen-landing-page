import { Icon } from '../../components/Icon'
import type { ApiRoute } from '../../types/api'

export function AreaRoutesSheet({
  open,
  cragName,
  routes,
  onClose,
  onOpenRoute,
}: {
  open: boolean
  cragName: string
  routes: ApiRoute[]
  onClose: () => void
  onOpenRoute: (route: ApiRoute) => void
}) {
  if (!open) return null

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover area-routes-sheet" role="dialog" aria-label={`Routes at ${cragName}`}>
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{cragName}</div>
          <span className="chip outline">{routes.length}</span>
        </div>
        <div className="slideover-body" style={{ padding: 0 }}>
          {routes.length === 0 ? (
            <div className="muted" style={{ padding: 20 }}>
              No routes listed for this location.
            </div>
          ) : (
            routes.map((r) => (
              <button
                key={r.id}
                type="button"
                className="area-route-row"
                onClick={() => {
                  onOpenRoute(r)
                  onClose()
                }}
              >
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                  {r.description ? (
                    <div className="muted" style={{ fontSize: 12, marginTop: 2, lineHeight: 1.35 }}>
                      {r.description.length > 80 ? `${r.description.slice(0, 80)}…` : r.description}
                    </div>
                  ) : null}
                </div>
                <span className="chip" style={{ fontWeight: 700 }}>
                  {r.grade}
                </span>
                <Icon name="chevR" size={16} style={{ color: 'var(--fg-2)', flexShrink: 0 }} />
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
