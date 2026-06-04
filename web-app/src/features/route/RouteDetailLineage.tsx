import type { ApiRoute } from '../../types/api'

export function RouteDetailLineage({ route }: { route: ApiRoute }) {
  const fa = route.first_ascent?.trim() || '—'
  const bolted = route.bolted_by?.trim() || '—'
  if (fa === '—' && bolted === '—') return null

  return (
    <div className="rail-card route-lineage-card">
      <div className="route-lineage-col">
        <div className="route-lineage-label">First ascent</div>
        <div className="route-lineage-value">{fa}</div>
      </div>
      <div className="route-lineage-divider" aria-hidden />
      <div className="route-lineage-col">
        <div className="route-lineage-label">Bolted by</div>
        <div className="route-lineage-value">{bolted}</div>
      </div>
    </div>
  )
}
