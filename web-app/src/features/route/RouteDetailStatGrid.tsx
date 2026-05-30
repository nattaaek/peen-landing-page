import { Icon, type IconName } from '../../components/Icon'
import { useCragWeather } from '../../hooks/useCragWeather'
import type { ApiRoute } from '../../types/api'

type StatTileProps = {
  icon: IconName
  label: string
  value: string
  sub?: string
  onClick?: () => void
  valueTone?: 'default' | 'warn' | 'good'
}

function StatTile({ icon, label, value, sub, onClick, valueTone = 'default' }: StatTileProps) {
  const inner = (
    <>
      <Icon name={icon} size={16} className="route-stat-icon" />
      <div className="route-stat-label">{label}</div>
      <div className={`route-stat-value tone-${valueTone}`}>{value}</div>
      {sub ? <div className="route-stat-sub">{sub}</div> : null}
    </>
  )
  if (onClick) {
    return (
      <button type="button" className="route-stat-tile" onClick={onClick}>
        {inner}
      </button>
    )
  }
  return <div className="route-stat-tile">{inner}</div>
}

export function RouteDetailStatGrid({
  route,
  topAngle,
  hazardCount,
  onSteepness,
  onApproach,
  onHazards,
}: {
  route: ApiRoute
  topAngle?: string | null
  hazardCount: number
  onSteepness: () => void
  onApproach: () => void
  onHazards: () => void
}) {
  const { conditions } = useCragWeather(route.area ?? undefined)
  const nowTemp = conditions ? `${conditions.temp}°` : '—'
  const approachMin =
    route.area?.approach_minutes_from_carpark != null ? `${route.area.approach_minutes_from_carpark} min` : '—'
  const walkIn = route.area?.walk_in_angle ?? '—'
  const bring =
    (route.style_tags ?? []).find((t) => /quickdraw|trad|sport/i.test(t)) ??
    (route.style_tags ?? [])[0] ??
    '—'

  return (
    <div className="route-stat-grid">
      <StatTile
        icon="mountain"
        label="Steepness"
        value={topAngle ?? '—'}
        sub="Community vote"
        onClick={onSteepness}
      />
      <StatTile
        icon="grade"
        label="Length"
        value={route.length_meters != null ? `${route.length_meters} m` : '—'}
        sub={route.grade ?? undefined}
      />
      <StatTile icon="layers" label="Bring" value={bring} sub="Style hint" />
      <StatTile icon={conditions?.icon === 'cloud' ? 'cloud' : 'sun'} label="Now" value={nowTemp} sub={conditions?.rock.v ?? '—'} />
      <StatTile icon="pin" label="Approach" value={approachMin} sub={walkIn} onClick={onApproach} />
      <StatTile
        icon={hazardCount > 0 ? 'flag' : 'check'}
        label="Hazards"
        value={hazardCount > 0 ? String(hazardCount) : 'Clear'}
        sub={hazardCount > 0 ? 'Active reports' : 'None reported'}
        onClick={onHazards}
        valueTone={hazardCount > 0 ? 'warn' : 'good'}
      />
    </div>
  )
}
