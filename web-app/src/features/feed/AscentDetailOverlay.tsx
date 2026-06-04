import { useMemo, useState } from 'react'
import { FeedInlineComments } from './FeedInlineComments'
import { FeedUserAvatar } from '../../components/FeedUserAvatar'
import { Icon, SendBadge } from '../../components/Icon'
import { PhotoLightbox } from '../../components/PhotoLightbox'
import { useAuth } from '../auth/AuthProvider'
import { usePublicClimb } from '../../hooks/useMigration'
import { buildClimbShareUrl } from '../../lib/climbDeepLink'
import { formatWhen } from '../../lib/formatWhen'
import { parseRouteId } from '../../lib/routeIds'
import { profileDisplayName, profileHandle } from '../../lib/peen-api/profiles'
import { SEND_COLORS } from '../../types/api'
import type { FeedClimbRow } from '../../types/api'

function climbPhotoUrls(post: FeedClimbRow): string[] {
  return (post.photo_urls ?? []).filter((u) => u?.trim().startsWith('http'))
}

function routeLocation(route: FeedClimbRow['route']) {
  if (!route) return null
  return route.area?.name ?? route.gym?.name ?? null
}

export function AscentDetailOverlay({
  climbId,
  initialPost,
  expandComments = false,
  onClose,
  onOpenRoute,
  onOpenProfile,
  onSignIn,
  onToast,
}: {
  climbId: string
  initialPost?: FeedClimbRow | null
  expandComments?: boolean
  onClose: () => void
  onOpenRoute: (routeId: string) => void
  onOpenProfile: (userId: string, fallbackName?: string) => void
  onSignIn: (msg?: string) => void
  onToast?: (msg: string) => void
}) {
  const { accessToken, user } = useAuth()
  const climbQ = usePublicClimb(climbId, initialPost)
  const post = climbQ.data
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showComments, setShowComments] = useState(expandComments)

  const authorId = post?.user_id ?? post?.profile?.id
  const routeId = parseRouteId(post?.route?.id ?? post?.route_id)
  const isSelf = !!user?.id && authorId === user.id
  const name = profileDisplayName(post?.profile ?? {})
  const handle = profileHandle(post?.profile ?? {})
  const photos = useMemo(() => (post ? climbPhotoUrls(post) : []), [post])
  const sendType = (post?.send_type ?? 'attempt').toLowerCase()
  const stripeColor = SEND_COLORS[sendType] ?? 'var(--tint)'

  const copyLink = () => {
    try {
      void navigator.clipboard?.writeText(buildClimbShareUrl(climbId))
    } catch {
      /* ignore */
    }
    onToast?.('Link copied')
  }

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover ascent-detail-slideover" role="dialog" aria-label="Ascent details">
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div className="route-detail-head-title">Ascent</div>
          {isSelf ? (
            <button type="button" className="icon-btn" aria-label="Copy link" onClick={copyLink}>
              <Icon name="share" size={18} />
            </button>
          ) : (
            <span style={{ width: 40 }} aria-hidden />
          )}
        </div>

        <div className="slideover-body">
          {climbQ.isLoading && !post && <p className="muted route-detail-pad">Loading send…</p>}
          {climbQ.isError && !post && (
            <div className="ascent-detail-empty route-detail-pad">
              <p className="error">Could not load this send.</p>
              <button type="button" className="btn btn-secondary" onClick={() => climbQ.refetch()}>
                Try again
              </button>
            </div>
          )}
          {climbQ.isSuccess && !post && (
            <p className="muted route-detail-pad">This send is no longer available or is not public.</p>
          )}
          {post && (
            <div className="ascent-detail">
              <div className="ascent-detail-send">
                <SendBadge type={post.send_type} />
                <span className="ascent-detail-when">{formatWhen(post.created_at)}</span>
              </div>

              <button
                type="button"
                className="ascent-detail-climber"
                onClick={() => authorId && onOpenProfile(authorId, name)}
              >
                <FeedUserAvatar
                  name={name}
                  avatarUrl={post.profile?.avatar_url}
                  colorSeed={authorId}
                  size={40}
                />
                <div style={{ minWidth: 0, textAlign: 'left' }}>
                  <div className="ascent-detail-climber-name">{name}</div>
                  {handle ? <div className="ascent-detail-climber-handle">{handle}</div> : null}
                </div>
                <Icon name="chevR" size={16} style={{ color: 'var(--fg-2)', marginLeft: 'auto' }} />
              </button>

              {post.route ? (
                <div className="feed-route ascent-detail-route" style={{ margin: 0 }}>
                  <span className="stripe" style={{ background: stripeColor }} />
                  <span style={{ color: 'var(--fg-2)', display: 'inline-flex' }}>
                    <Icon name="mountain" size={18} />
                  </span>
                  <div className="info">
                    <div className="name">{post.route.name}</div>
                    <div className="meta">
                      {[routeLocation(post.route), post.route.style_tags?.[0]]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <span className="grade">{post.route.grade ?? '—'}</span>
                </div>
              ) : (
                <p className="muted">Route unavailable</p>
              )}

              {routeId ? (
                <button type="button" className="btn btn-secondary ascent-detail-route-btn" onClick={() => onOpenRoute(routeId)}>
                  View route details
                </button>
              ) : null}

              {(post.attempts ?? 0) > 1 || sendType === 'attempt' ? (
                <p className="ascent-detail-meta">
                  <span className="ascent-detail-meta-label">Attempts</span> {post.attempts ?? 1}
                </p>
              ) : null}

              {post.personal_rating != null ? (
                <p className="ascent-detail-meta">
                  <span className="ascent-detail-meta-label">Personal rating</span> {post.personal_rating}/5
                </p>
              ) : null}

              {photos.length > 0 ? (
                <div className={`feed-media ${photos.length === 1 ? 'one' : photos.length === 2 ? 'two' : 'three'}`}>
                  {photos.slice(0, 3).map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      className="ph ph-btn"
                      style={{ backgroundImage: `url(${url})` }}
                      onClick={() => setLightboxIndex(i)}
                      aria-label="View full-size photo"
                    />
                  ))}
                </div>
              ) : null}

              {post.notes ? (
                <div className="ascent-detail-notes">
                  <div className="ascent-detail-meta-label">Notes</div>
                  <p>{post.notes}</p>
                </div>
              ) : null}

              <div className="ascent-detail-reactions mono-num">
                <span>{post.like_count ?? 0} likes</span>
                <span>·</span>
                <span>{post.comment_count ?? 0} comments</span>
              </div>

              {accessToken ? (
                <>
                  <button
                    type="button"
                    className="link-btn ascent-detail-comments-toggle"
                    onClick={() => setShowComments((v) => !v)}
                  >
                    {showComments ? 'Hide comments' : 'Show comments'}
                  </button>
                  {showComments ? <FeedInlineComments climbId={post.id} onSignIn={onSignIn} /> : null}
                </>
              ) : (
                <button type="button" className="link-btn" onClick={() => onSignIn('Sign in to comment.')}>
                  Sign in to comment
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex != null && photos.length > 0 ? (
        <PhotoLightbox
          urls={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </>
  )
}
