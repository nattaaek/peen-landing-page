import { Icon, type IconName } from '../../components/Icon'
import { useCragWeather } from '../../hooks/useCragWeather'
import { bringStatForRoute } from '../../lib/routePacking'
import type { ApiRoute } from '../../types/api'

type StatTileProps = {
  icon: IconName
  label: string
  value: string
  sub?: string
  onClick?: () => void
  valueTone?: 'default' | 'warn' | 'good'
  disabled?: boolean
}

function StatTile({ icon, label, value, sub, onClick, valueTone = 'default', disabled }: StatTileProps) {
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
      <button type="button" className="route-stat-tile" onClick={onClick} disabled={disabled}>
        {inner}
      </button>
    )
  }
  return <div className="route-stat-tile">{inner}</div>
}

export function RouteDetailStatGrid({
  route,
  topAngle,
  consensusVotes,
  isGuest,
  hazardCount,
  onSteepnessVote,
  onApproach,
  onHazards,
}: {
  route: ApiRoute
  topAngle?: string | null
  consensusVotes?: number
  isGuest?: boolean
  hazardCount: number
  onSteepnessVote: () => void
  onApproach: () => void
  onHazards: () => void
}) {
  const { conditions } = useCragWeather(route.area ?? undefined)
  const nowTemp = conditions ? `${conditions.temp}°` : '—'
  const approachMin =
    route.area?.approach_minutes_from_carpark != null ? `${route.area.approach_minutes_from_carpark} min` : '—'
  const approachSub = route.area
    ? route.area.walk_in_angle ?? 'From carpark'
    : route.gym
      ? 'Indoor'
      : 'Wall not linked'
  const bring = bringStatForRoute(route)

  const votes = consensusVotes ?? 0
  const steepnessSub = isGuest
    ? 'Sign in to vote'
    : votes > 0
      ? `${votes} vote${votes === 1 ? '' : 's'} · tap to vote`
      : 'Tap to vote'

  return (
    <div className="route-stat-grid">
      <StatTile
        icon="mountain"
        label="Steepness"
        value={topAngle ?? '—'}
        sub={steepnessSub}
        onClick={onSteepnessVote}
        disabled={isGuest}
      />
      <StatTile
        icon="grade"
        label="Length"
        value={route.length_meters != null ? `${route.length_meters} m` : '—'}
        sub={route.bolt_count && route.bolt_count > 0 ? `${route.bolt_count} bolts to chains` : route.grade ?? undefined}
      />
      <StatTile icon="layers" label="Bring" value={bring.value} sub={bring.sub} />
      <StatTile icon={conditions?.icon === 'cloud' ? 'cloud' : 'sun'} label="Now" value={nowTemp} sub={conditions?.rock.v ?? '—'} />
      <StatTile icon="pin" label="Approach" value={approachMin} sub={approachSub} onClick={onApproach} />
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
