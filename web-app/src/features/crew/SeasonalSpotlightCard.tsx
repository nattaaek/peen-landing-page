import { Icon } from '../../components/Icon'
import { TopoLines } from '../../components/TopoLines'
import { passportEdition, type PassportEdition } from '../../lib/challengeIntro'
import { spotlightProgressPct } from '../../lib/seasonalChallenge'
import { EditionName } from '../passport/EditionName'
import type { SeasonalSpotlight } from '../../types/seasonalChallenge'

function EditionArt({ edition }: Readonly<{ edition: PassportEdition }>) {
  return (
    <div className="seasonal-spotlight-hero seasonal-edition-art">
      <img src={`${import.meta.env.BASE_URL}passport/cover.png`} width={720} height={1024} alt="" />
      <div className="seasonal-edition-copy">
        <span className="seasonal-edition-kicker">Passport · {edition.edition}</span>
        <EditionName edition={edition} />
      </div>
    </div>
  )
}

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
  const edition = passportEdition(spotlight.challenge_id)

  return (
    <button type="button" className={`seasonal-spotlight-card${edition ? ' is-edition' : ''}`} onClick={onOpen}>
      {edition ? <EditionArt edition={edition} /> : (
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
      )}
      <div className="seasonal-spotlight-body">
        <div className="seasonal-spotlight-eyebrow">Seasonal · {daysLeft}d left</div>
        {edition ? null : <h2 className="seasonal-spotlight-title">{spotlight.title}</h2>}
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
