import { useMemo } from 'react'
import { Avatar, Icon, SendBadge } from '../../components/Icon'
import { FeedUserAvatar } from '../../components/FeedUserAvatar'
import { useAuth } from '../auth/AuthProvider'
import {
  useFollowingIds,
  useProfileIdentities,
  useToggleFollow,
  useUserAchievements,
  useUserProfile,
  useUserPublicSends,
} from '../../hooks/useMigration'
import { AchievementsStrip } from '../../components/AchievementsStrip'
import { ActivityHeatmap } from '../../components/ActivityHeatmap'
import { achievementDef } from '../../domain/achievements'
import { computeClimbStats } from '../../lib/climbStats'
import { profileHandle } from '../../lib/peen-api/profiles'

export function PublicProfilePeek({
  userId,
  fallbackName,
  onClose,
  onOpenRoute,
  onSignIn,
}: {
  userId: string
  fallbackName?: string
  onClose: () => void
  onOpenRoute: (routeId: string) => void
  onSignIn: () => void
}) {
  const { accessToken, user } = useAuth()
  const isGuest = !accessToken
  const profileQ = useUserProfile(userId)
  const sendsQ = useUserPublicSends(userId)
  const identitiesQ = useProfileIdentities(userId ? [userId] : [])
  const followingQ = useFollowingIds()
  const toggleFollow = useToggleFollow()

  const identity = identitiesQ.data?.[0]
  const profileResult = profileQ.data
  const profile = profileResult?.kind === 'ok' ? profileResult.profile : null
  const isPrivate = profileQ.isSuccess && profileResult?.kind === 'private'
  const achievementsQ = useUserAchievements(isPrivate ? null : userId)
  const profileLoadError =
    profileQ.isError || profileResult?.kind === 'error'
      ? profileResult?.kind === 'error'
        ? profileResult.message
        : 'Could not load profile'
      : null
  const displayName =
    profile?.nickname?.trim() ||
    profile?.username?.trim() ||
    identity?.nickname?.trim() ||
    identity?.username?.trim() ||
    fallbackName ||
    'Climber'
  const handle = profileHandle(profile ?? identity ?? {})
  const sends = sendsQ.data ?? []
  const stats = useMemo(() => computeClimbStats(sends), [sends])
  const isMe = user?.id === userId
  const isFollowing = followingQ.data?.has(userId) ?? false
  const featuredId = profile?.featured_achievement_id
  const featuredBadge = featuredId ? achievementDef(featuredId) : null

  const follow = () => {
    if (isGuest) {
      onSignIn()
      return
    }
    toggleFollow.mutate({ targetId: userId, follow: !isFollowing })
  }

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover" role="dialog" aria-label={`${displayName} profile`} style={{ maxWidth: 440 }}>
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, color: 'var(--fg-2)', fontSize: 14 }}>Profile</div>
        </div>
        <div className="slideover-body" style={{ padding: 0 }}>
          <div
            className="profile-peek-cover"
            style={{
              height: 120,
              background: 'linear-gradient(135deg, var(--peen-orange), var(--peen-charcoal))',
              position: 'relative',
            }}
          >
            <TopoCover />
          </div>
          <div style={{ padding: '0 22px 22px', marginTop: -36 }}>
            {profile?.avatar_url ? (
              <FeedUserAvatar
                name={displayName}
                avatarUrl={profile.avatar_url}
                size={72}
                colorSeed={userId}
              />
            ) : (
              <Avatar name={displayName} size={72} />
            )}
            <div style={{ marginTop: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3 }}>{displayName}</h2>
              {handle && (
                <div style={{ color: 'var(--fg-2)', fontSize: 14 }}>{handle}</div>
              )}
              {featuredBadge ? (
                <div className="feed-featured-badge profile-peek-featured" title={featuredBadge.title}>
                  <Icon name={featuredBadge.icon} size={12} />
                  <span>Featured: {featuredBadge.title}</span>
                </div>
              ) : null}
            </div>

            {!isMe && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1 }}
                  disabled={toggleFollow.isPending}
                  onClick={follow}
                >
                  {isFollowing ? (
                    <>
                      <Icon name="check" size={14} /> Following
                    </>
                  ) : (
                    <>
                      <Icon name="plus" size={14} /> Follow
                    </>
                  )}
                </button>
              </div>
            )}

            {profileQ.isLoading ? (
              <p className="muted" style={{ marginTop: 20 }}>Loading profile…</p>
            ) : profileLoadError ? (
              <p className="error" style={{ marginTop: 20, fontSize: 14 }}>
                {profileLoadError}
              </p>
            ) : isPrivate ? (
              <p className="muted" style={{ marginTop: 20, fontSize: 14, lineHeight: 1.5 }}>
                This climber keeps their full profile private. You can still see their nickname on public
                climbs in the feed.
              </p>
            ) : (
              <>
                <div className="profile-stat-grid" style={{ marginTop: 20 }}>
                  <ProfileStat label="Sends" value={String(stats.total)} />
                  <ProfileStat label="This year" value={String(stats.thisYear)} />
                  <ProfileStat label="Hardest" value={stats.hardest} />
                </div>

                {sends.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <ActivityHeatmap logs={sends} />
                  </div>
                )}

                {achievementsQ.data ? (
                  <div style={{ marginTop: 16 }}>
                    <AchievementsStrip
                      achievements={achievementsQ.data.strip}
                      totalCount={achievementsQ.data.totalCount}
                      unlockedCount={achievementsQ.data.unlockedCount}
                    />
                  </div>
                ) : achievementsQ.isLoading ? (
                  <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
                    Loading achievements…
                  </p>
                ) : null}

                <h4 className="profile-section-label">Recent sends</h4>
                {sendsQ.isLoading && <p className="muted">Loading…</p>}
                {!sendsQ.isLoading && sends.length === 0 && (
                  <p className="muted">No public sends yet.</p>
                )}
                <div className="rail-card" style={{ padding: 0, marginTop: 6 }}>
                  {sends.slice(0, 8).map((log, i) => (
                    <button
                      key={log.id}
                      type="button"
                      className="profile-send-row"
                      style={{
                        borderBottom: i < Math.min(sends.length, 8) - 1 ? '1px solid var(--separator)' : 'none',
                      }}
                      onClick={() => log.route_id && onOpenRoute(log.route_id)}
                      disabled={!log.route_id}
                    >
                      {log.send_type && <SendBadge type={log.send_type} />}
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{log.route?.name ?? 'Route'}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>
                          {log.route?.area?.name ?? log.route?.gym?.name ?? '—'}
                        </div>
                      </div>
                      <span className="chip outline" style={{ fontWeight: 700 }}>
                        {log.grade ?? log.route?.grade ?? '—'}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-stat-cell">
      <div className="profile-stat-value">{value}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
  )
}

function TopoCover() {
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', opacity: 0.4 }}>
      <g fill="none" stroke="#fff" strokeWidth="0.8">
        <path d="M-10 100 C 60 80, 120 90, 180 70 S 320 50, 410 80" />
        <path d="M-10 80 C 60 60, 120 70, 180 50 S 320 30, 410 60" />
        <path d="M-10 60 C 60 40, 120 50, 180 30 S 320 10, 410 40" />
      </g>
    </svg>
  )
}
