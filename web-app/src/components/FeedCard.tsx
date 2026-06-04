import { useEffect, useRef, useState } from 'react'
import { profileDisplayName, profileHandle } from '../lib/peen-api/profiles'
import { FeedInlineComments } from '../features/feed/FeedInlineComments'
import { FeedUserAvatar } from './FeedUserAvatar'
import { HeartBurst } from './HeartBurst'
import { Icon, SendBadge } from './Icon'
import { PhotoLightbox } from './PhotoLightbox'
import { PopDivider, PopItem, Popover } from './Popover'
import { formatWhen } from '../lib/formatWhen'
import { SEND_COLORS } from '../types/api'
import type { FeedClimbRow } from '../types/api'

function routeMeta(route: FeedClimbRow['route']) {
  if (!route) return ''
  const parts = [
    route.area?.name ?? route.gym?.name,
    route.style_tags?.[0],
    route.length_meters != null ? `${route.length_meters}m` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

function climbPhotoUrls(post: FeedClimbRow): string[] {
  return (post.photo_urls ?? []).filter((u) => u?.trim().startsWith('http')).slice(0, 3)
}

function climbShareUrl(postId: string) {
  return `${window.location.origin}/app/feed?climb=${postId}`
}

function FeedPhotoGrid({
  urls,
  onOpen,
  onDoubleLike,
}: {
  urls: string[]
  onOpen: (index: number) => void
  onDoubleLike: () => void
}) {
  const n = urls.length
  const layout = n === 1 ? 'one' : n === 2 ? 'two' : 'three'
  const show = urls.slice(0, 3)

  return (
    <div className={`feed-media ${layout}`} onDoubleClick={onDoubleLike}>
      {layout === 'three' ? (
        <>
          <FeedPhotoButton url={show[0]} index={0} onOpen={onOpen} />
          <div className="col">
            <FeedPhotoButton url={show[1]} index={1} onOpen={onOpen} />
            <FeedPhotoButton url={show[2]} index={2} onOpen={onOpen} />
          </div>
        </>
      ) : (
        show.map((url, i) => <FeedPhotoButton key={url} url={url} index={i} onOpen={onOpen} />)
      )}
    </div>
  )
}

function FeedPhotoButton({
  url,
  index,
  onOpen,
}: {
  url: string
  index: number
  onOpen: (index: number) => void
}) {
  return (
    <button
      type="button"
      className="ph ph-btn"
      style={{ backgroundImage: `url(${url})` }}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(index)
      }}
      aria-label="View full-size photo"
    />
  )
}

export function FeedCard({
  post,
  liked,
  sendItOn,
  isFollowing,
  isSelf,
  isSaved,
  isGuest,
  onOpenRoute,
  onOpenProfile,
  onLike,
  onSendIt,
  onToggleFollow,
  onToggleWishlist,
  onToast,
  onSignIn,
  likeCount,
  commentCount,
  highlighted = false,
  commentsOpen = false,
  cardRef,
}: {
  post: FeedClimbRow
  liked: boolean
  sendItOn: boolean
  isFollowing: boolean
  isSelf: boolean
  isSaved: boolean
  isGuest: boolean
  likeCount: number
  commentCount: number
  highlighted?: boolean
  commentsOpen?: boolean
  cardRef?: (el: HTMLElement | null) => void
  onOpenRoute: () => void
  onOpenProfile: () => void
  onLike: () => void
  onSendIt: () => void
  onToggleFollow: () => void
  onToggleWishlist: () => void
  onToast?: (msg: string) => void
  onSignIn: (msg?: string) => void
}) {
  const name = profileDisplayName(post.profile ?? {})
  const handle = profileHandle(post.profile ?? {})
  const sendType = (post.send_type ?? 'attempt').toLowerCase()
  const stripeColor = SEND_COLORS[sendType] ?? 'var(--tint)'
  const when = formatWhen(post.created_at)
  const photos = climbPhotoUrls(post)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [likePulse, setLikePulse] = useState(0)
  const [showComments, setShowComments] = useState(commentsOpen)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const gate = (msg: string, fn: () => void) => () => {
    if (isGuest) {
      onSignIn(msg)
      return
    }
    fn()
  }

  useEffect(() => {
    if (commentsOpen) setShowComments(true)
  }, [commentsOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moreOpen])

  const handleLike = gate('Sign in to like sends.', () => {
    if (!liked) setLikePulse((p) => p + 1)
    onLike()
  })

  const copyLink = () => {
    try {
      void navigator.clipboard?.writeText(climbShareUrl(post.id))
    } catch {
      /* ignore */
    }
    onToast?.('Link copied')
    setMoreOpen(false)
  }

  return (
    <article
      id={`feed-climb-${post.id}`}
      ref={cardRef}
      className={`feed-card${highlighted ? ' feed-card-highlight' : ''}${
        moreOpen ? ' feed-card-popover-open' : ''
      }`}
    >
      <header className="feed-head">
        <button
          type="button"
          className="feed-profile-hit"
          onClick={onOpenProfile}
          aria-label={`Open ${name}'s profile`}
        >
          <FeedUserAvatar
            name={name}
            avatarUrl={post.profile?.avatar_url}
            colorSeed={post.user_id ?? post.profile?.id}
            following={isFollowing && !isSelf}
          />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="who">
            <button type="button" className="feed-name-link" onClick={onOpenProfile}>
              {name}
            </button>
            {handle ? (
              <span style={{ color: 'var(--fg-2)', fontWeight: 400 }}> {handle}</span>
            ) : null}
            {isFollowing && !isSelf ? (
              <span className="feed-following-label">· Following</span>
            ) : null}
          </div>
          <div className="when">
            {when ? `${when} · ` : null}
            <SendBadge type={post.send_type} />
          </div>
        </div>
        <div className="act feed-head-actions" ref={moreRef}>
          {!isFollowing && !isSelf && !isGuest ? (
            <button
              type="button"
              className="chip outline feed-follow-chip"
              onClick={gate('Sign in to follow climbers.', onToggleFollow)}
            >
              <Icon name="plus" size={12} /> Follow
            </button>
          ) : null}
          <button
            type="button"
            className="act icon-btn"
            aria-label="More"
            onClick={(e) => {
              e.stopPropagation()
              setMoreOpen((v) => !v)
            }}
          >
            <Icon name="more" size={18} />
          </button>
          {moreOpen ? (
            <Popover anchor="right" top={42}>
              <PopItem
                icon={isSaved ? 'bookmarkFilled' : 'bookmark'}
                label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={gate('Sign in to save routes.', () => {
                  onToggleWishlist()
                  setMoreOpen(false)
                })}
              />
              <PopItem icon="share" label="Copy link" onClick={copyLink} />
              <PopItem
                icon={isFollowing ? 'check' : 'plus'}
                label={isFollowing ? `Unfollow ${name}` : `Follow ${name}`}
                onClick={gate('Sign in to follow climbers.', () => {
                  onToggleFollow()
                  setMoreOpen(false)
                })}
              />
              <PopDivider />
              <PopItem
                icon="bell"
                label="Mute for 24h"
                onClick={gate('Sign in to mute posts.', () => {
                  onToast?.(`Muted ${name} for 24h`)
                  setMoreOpen(false)
                })}
              />
              <PopItem
                icon="flag"
                label="Report"
                danger
                onClick={gate('Sign in to report.', () => {
                  onToast?.("Reported — thanks. We'll take a look.")
                  setMoreOpen(false)
                })}
              />
            </Popover>
          ) : null}
        </div>
      </header>

      <div
        className="feed-route"
        role="button"
        tabIndex={0}
        onClick={onOpenRoute}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpenRoute()
          }
        }}
      >
        <span className="stripe" style={{ background: stripeColor }} />
        <span style={{ color: 'var(--fg-2)', display: 'inline-flex' }}>
          <Icon name="mountain" size={18} />
        </span>
        <div className="info">
          <div className="name">{post.route?.name ?? 'Route'}</div>
          <div className="meta">{routeMeta(post.route)}</div>
        </div>
        <span className="grade">{post.route?.grade ?? '—'}</span>
        <Icon name="chevR" size={16} style={{ color: 'var(--fg-2)', marginLeft: 4, flexShrink: 0 }} />
      </div>

      {photos.length > 0 ? (
        <FeedPhotoGrid urls={photos} onOpen={(i) => setLightboxIndex(i)} onDoubleLike={handleLike} />
      ) : null}

      {post.notes ? <div className="feed-body">{post.notes}</div> : null}

      <footer className="feed-actions">
        <button
          type="button"
          className={`act-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          aria-pressed={liked}
          aria-label="Like"
          title="Like"
        >
          <span className="act-btn-heart-wrap">
            <Icon
              name={liked ? 'heartFilled' : 'heart'}
              size={18}
              className={liked ? 'heart-liked' : undefined}
            />
            {likePulse > 0 ? <HeartBurst key={likePulse} /> : null}
          </span>
          <span className="mono-num">{Math.max(0, likeCount)}</span>
        </button>
        <button
          type="button"
          className={`act-btn ${showComments ? 'liked' : ''}`}
          onClick={() => {
            if (isGuest) {
              onSignIn('Sign in to comment.')
              return
            }
            setShowComments((v) => !v)
          }}
          aria-expanded={showComments}
          title="Comments"
        >
          <Icon name="comment" size={18} />
          <span className="mono-num">{commentCount}</span>
        </button>
        <button
          type="button"
          className="act-btn"
          onClick={(e) => {
            e.stopPropagation()
            copyLink()
          }}
          aria-label="Copy link to send"
          title="Copy link"
        >
          <Icon name="share" size={16} />
        </button>
        <button
          type="button"
          className={`act-btn ${isSaved ? 'liked' : ''}`}
          onClick={gate('Sign in to save routes.', onToggleWishlist)}
          aria-label="Add to wishlist"
          aria-pressed={isSaved}
          title={isSaved ? 'In your wishlist' : 'Add to wishlist'}
        >
          <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} size={18} />
        </button>
        <button
          type="button"
          className={`act-btn send-it ${sendItOn ? 'liked' : ''}`}
          onClick={gate('Sign in to cheer climbers on.', onSendIt)}
          aria-pressed={sendItOn}
          title='"Send it!" — a virtual high-five to cheer them on'
        >
          <Icon name="bolt" size={14} />
          {sendItOn ? 'Cheered' : 'Send it!'}
        </button>
      </footer>

      {showComments ? <FeedInlineComments climbId={post.id} onSignIn={onSignIn} /> : null}

      {lightboxIndex != null ? (
        <PhotoLightbox
          urls={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </article>
  )
}
