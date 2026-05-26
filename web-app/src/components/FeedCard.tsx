import { useState } from 'react'
import { profileDisplayName, profileHandle } from '../lib/peen-api/profiles'
import { Icon, SendBadge } from './Icon'
import { PhotoLightbox } from './PhotoLightbox'
import { SEND_COLORS } from '../types/api'
import type { FeedClimbRow } from '../types/api'

/** Per-climber avatar colors from peen-web/data.jsx CLIMBERS */
const CLIMBER_COLORS = ['#D55A1F', '#2860A3', '#459B51', '#9B59B6', '#1F1F20', '#D55A1F', '#2860A3']

function climberColor(seed?: string) {
  if (!seed) return CLIMBER_COLORS[0]
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return CLIMBER_COLORS[n % CLIMBER_COLORS.length]
}

/** Matches peen-web: "2h ago", "Just now" (no double "ago"). */
function formatWhen(iso?: string) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 48) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function routeMeta(route: FeedClimbRow['route']) {
  if (!route) return ''
  const parts = [
    route.area?.name ?? route.gym?.name,
    route.style_tags?.[0],
    route.length_meters != null ? `${route.length_meters}m` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

/** Only real uploaded photos — no placeholders. */
function climbPhotoUrls(post: FeedClimbRow): string[] {
  return (post.photo_urls ?? []).filter((u) => u?.trim().startsWith('http')).slice(0, 3)
}

function FeedUserAvatar({
  name,
  avatarUrl,
  colorSeed,
}: {
  name: string
  avatarUrl?: string | null
  colorSeed?: string
}) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase()
  const photo = avatarUrl?.trim()
  if (photo?.startsWith('http')) {
    return (
      <span
        className="av"
        style={{ backgroundImage: `url(${photo})` }}
        role="img"
        aria-label={name}
      />
    )
  }
  return (
    <span
      className="av"
      style={{
        background: climberColor(colorSeed),
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 16,
      }}
    >
      {initial}
    </span>
  )
}

function FeedPhotoGrid({
  urls,
  onOpen,
}: {
  urls: string[]
  onOpen: (index: number) => void
}) {
  const n = urls.length
  const layout = n === 1 ? 'one' : n === 2 ? 'two' : 'three'
  const show = urls.slice(0, 3)

  return (
    <div className={`feed-media ${layout}`}>
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
  onOpenRoute,
  onLike,
  onSendIt,
  onComment,
}: {
  post: FeedClimbRow
  liked: boolean
  sendItOn: boolean
  onOpenRoute: () => void
  onLike: () => void
  onSendIt: () => void
  onComment: () => void
}) {
  const name = profileDisplayName(post.profile ?? {})
  const handle = profileHandle(post.profile ?? {})
  const sendType = (post.send_type ?? 'attempt').toLowerCase()
  const stripeColor = SEND_COLORS[sendType] ?? 'var(--tint)'
  const when = formatWhen(post.created_at)
  const likes = post.like_count ?? 0
  const comments = post.comment_count ?? 0
  const photos = climbPhotoUrls(post)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <article className="feed-card">
      <header className="feed-head">
        <FeedUserAvatar
          name={name}
          avatarUrl={post.profile?.avatar_url}
          colorSeed={post.user_id ?? post.profile?.id}
        />
        <div>
          <div className="who">
            {name}
            {handle ? (
              <span style={{ color: 'var(--fg-2)', fontWeight: 400 }}> {handle}</span>
            ) : null}
          </div>
          <div className="when">
            {when}
            {when ? ' · ' : null}
            <SendBadge type={post.send_type} />
          </div>
        </div>
        <button type="button" className="act icon-btn" aria-label="More">
          <Icon name="more" size={18} />
        </button>
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
      </div>

      {photos.length > 0 ? (
        <FeedPhotoGrid urls={photos} onOpen={(index) => setLightboxIndex(index)} />
      ) : null}

      {post.notes ? <div className="feed-body">{post.notes}</div> : null}

      <footer className="feed-actions">
        <button
          type="button"
          className={`act-btn ${liked ? 'liked' : ''}`}
          onClick={onLike}
        >
          <Icon name={liked ? 'heartFilled' : 'heart'} size={18} />
          <span className="act-count">{likes}</span>
        </button>
        <button type="button" className="act-btn" onClick={onComment}>
          <Icon name="comment" size={18} />
          <span className="act-count">{comments}</span>
        </button>
        <button type="button" className="act-btn" aria-label="Share">
          <Icon name="share" size={16} />
        </button>
        <button
          type="button"
          className={`act-btn send-it ${sendItOn ? 'liked' : ''}`}
          onClick={onSendIt}
        >
          <Icon name="bolt" size={14} />
          {sendItOn ? 'Sent it' : 'Send it'}
        </button>
      </footer>

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
