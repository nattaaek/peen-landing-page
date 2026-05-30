import { Icon } from '../../components/Icon'
import { useCragWeather } from '../../hooks/useCragWeather'
import type { ApiArea } from '../../types/api'

/** Compact conditions rail for route detail (Open-Meteo at crag coords). */
export function RouteConditionsCard({ area }: { area: ApiArea | undefined }) {
  const { conditions: cond, loading, live } = useCragWeather(area)

  if (!area || !cond) {
    return (
      <div className="rail-card route-conditions-card">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Loading conditions…
        </p>
      </div>
    )
  }

  const headline = `${cond.rock.v} · ${cond.temp}° at the wall`
  const detail = loading && !live ? 'Loading forecast…' : cond.summary

  return (
    <div className="rail-card route-conditions-card">
      <div
        className={`route-conditions-icon ${cond.icon === 'sun' ? 'route-conditions-icon-sun' : 'route-conditions-icon-cloud'}`}
      >
        <Icon name={cond.icon} size={28} />
      </div>
      <div className="route-conditions-text">
        <div className="route-conditions-headline">{headline}</div>
        <div className="route-conditions-detail">{detail}</div>
        <div className="route-conditions-metrics">
          <span className={`tone-${cond.friction.tone}`}>{cond.friction.v} friction</span>
          <span>{cond.humidity} humidity</span>
        </div>
      </div>
      <span className="route-conditions-chev">
        <Icon name="chevR" size={18} />
      </span>
    </div>
  )
}
