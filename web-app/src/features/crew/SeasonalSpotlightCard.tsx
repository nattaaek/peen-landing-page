import { Icon } from '../../components/Icon'
import { TopoLines } from '../../components/TopoLines'
import { spotlightProgressPct } from '../../lib/seasonalChallenge'
import type { SeasonalSpotlight } from '../../types/seasonalChallenge'

export function SeasonalSpotlightCard({
  spotlight,
  onOpen,
}: {
  spotlight: SeasonalSpotlight
  onOpen: () => void
}) {
  const done = spotlight.my_completed_count ?? 0
  const total = Math.max(spotlight.routes_total ?? 1, 1)
  const pct = spotlightProgressPct(spotlight)
  const daysLeft = Math.max(0, spotlight.days_left ?? 0)
  const subtitle = spotlight.subtitle?.trim() ?? ''
  const heroUrl = spotlight.hero_image_url?.trim()

  return (
    <button type="button" className="seasonal-spotlight-card" onClick={onOpen}>
      <div
        className="seasonal-spotlight-hero"
        style={
          heroUrl
            ? { backgroundImage: `url(${heroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        {!heroUrl ? <TopoLines /> : null}
      </div>
      <div className="seasonal-spotlight-body">
        <div className="seasonal-spotlight-eyebrow">Seasonal · {daysLeft}d left</div>
        <h2 className="seasonal-spotlight-title">{spotlight.title}</h2>
        {subtitle ? <p className="seasonal-spotlight-subtitle">{subtitle}</p> : null}

        <div className="seasonal-spotlight-progress-block">
          <div className="seasonal-spotlight-progress-head">
            <span>Verified sends</span>
            <strong>
              {done}/{total}
            </strong>
          </div>
          <div className="seasonal-spotlight-progress-bar">
            <div className="seasonal-spotlight-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="seasonal-spotlight-meta">
          <Icon name="crew" size={13} />
          <span>{spotlight.joined_count ?? 0} joined</span>
          {spotlight.reward_summary ? (
            <>
              <span className="seasonal-spotlight-dot">·</span>
              <Icon name="star" size={13} />
              <span>{spotlight.reward_summary}</span>
            </>
          ) : null}
        </div>
      </div>
    </button>
  )
}
