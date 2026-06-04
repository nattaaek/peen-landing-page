import { Icon } from './Icon'
import type { AchievementView } from '../domain/achievements'

export function AchievementsStrip({
  achievements,
  totalCount,
  unlockedCount,
  onSeeAll,
}: {
  achievements: AchievementView[]
  totalCount: number
  unlockedCount: number
  onSeeAll?: () => void
}) {
  if (totalCount === 0) return null

  return (
    <section className="achievements-strip" aria-label="Achievements">
      <div className="achievements-strip-head">
        <div>
          <h4 className="profile-section-label" style={{ margin: 0 }}>
            Achievements
          </h4>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
        {onSeeAll ? (
          <button type="button" className="link-btn" onClick={onSeeAll}>
            See all
          </button>
        ) : null}
      </div>
      <div className="achievements-strip-scroll">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`achievement-tile${a.isUnlocked ? '' : ' locked'}`}
            title={a.title}
          >
            <span className={`achievement-tile-icon${a.isUnlocked ? ' unlocked' : ''}`}>
              <Icon name={a.icon} size={18} />
            </span>
            <span className="achievement-tile-title">{a.title}</span>
          </div>
        ))}
        {achievements.length === 0 ? (
          <p className="muted" style={{ fontSize: 13, padding: '8px 0' }}>
            No badges unlocked yet.
          </p>
        ) : null}
      </div>
    </section>
  )
}
