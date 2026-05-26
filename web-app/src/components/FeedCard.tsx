import { Icon, SendBadge } from './Icon'
import { SEND_COLORS } from '../types/api'
import type { FeedClimbRow } from '../types/api'

function formatWhen(iso?: string) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return 'Just now'
  if (h < 48) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
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

function RouteMedia({ urls, routeId }: { urls: string[]; routeId?: string }) {
  const n = urls.length
  if (n === 0) return null
  const layout = n === 1 ? 'one' : n === 2 ? 'two' : 'three'
  const show = urls.slice(0, 3)
  return (
    <div className={`feed-media ${layout}`}>
      {layout === 'three' ? (
        <>
          <FeedPhoto url={show[0]} routeId={routeId} />
          <div className="col">
            <FeedPhoto url={show[1]} routeId={routeId} />
            <FeedPhoto url={show[2]} routeId={routeId} />
          </div>
        </>
      ) : (
        show.map((url, i) => <FeedPhoto key={i} url={url} routeId={routeId} />)
      )}
    </div>
  )
}

function FeedPhoto({ url, routeId }: { url: string; routeId?: string }) {
  const seeds = [
    ['#D89971', '#7A4426'],
    ['#A2A09C', '#4A4D52'],
    ['#E1B074', '#8B5A2B'],
  ]
  const [a, b] = seeds[(routeId?.charCodeAt(0) ?? 0) % seeds.length]
  if (url.startsWith('http')) {
    return <div className="ph" style={{ backgroundImage: `url(${url})` }} />
  }
  return (
    <div className="ph" style={{ background: `linear-gradient(160deg, ${a}, ${b})` }}>
      <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
        <path
          fill="rgba(255,255,255,0.12)"
          d="M0 120 C40 90 80 100 120 80 S200 60 220 70 L220 150 L0 150 Z"
        />
      </svg>
    </div>
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
  const name = post.profile?.nickname ?? post.profile?.username ?? 'Climber'
  const handle = post.profile?.username ? `@${post.profile.username}` : ''
  const sendType = (post.send_type ?? 'attempt').toLowerCase()
  const stripeColor = SEND_COLORS[sendType] ?? 'var(--tint)'
  const photos = post.photo_urls ?? []

  return (
    <article className="feed-card">
      <header className="feed-head">
        <span
          className="av"
          style={{
            background: 'var(--tint)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <div>
          <div className="who">
            {name}{' '}
            {handle && <span style={{ color: 'var(--fg-2)', fontWeight: 400 }}>{handle}</span>}
          </div>
          <div className="when">
            {formatWhen(post.created_at)} ago · <SendBadge type={post.send_type} />
          </div>
        </div>
        <button type="button" className="act icon-btn" aria-label="More">
          <Icon name="more" size={18} />
        </button>
      </header>

      <button type="button" className="feed-route" onClick={onOpenRoute}>
        <span className="stripe" style={{ background: stripeColor }} />
        <span style={{ color: 'var(--fg-2)', display: 'inline-flex' }}>
          <Icon name="mountain" size={18} />
        </span>
        <div className="info">
          <div className="name">{post.route?.name ?? 'Route'}</div>
          <div className="meta">{routeMeta(post.route)}</div>
        </div>
        <span className="grade">{post.route?.grade ?? '—'}</span>
      </button>

      <RouteMedia urls={photos} routeId={post.route_id} />

      {post.notes && <div className="feed-body">{post.notes}</div>}

      <footer className="feed-actions">
        <button
          type="button"
          className={`act-btn ${liked ? 'liked' : ''}`}
          onClick={onLike}
        >
          <Icon name={liked ? 'heartFilled' : 'heart'} size={18} />
          {post.like_count ?? 0}
        </button>
        <button type="button" className="act-btn" onClick={onComment}>
          <Icon name="comment" size={18} /> {post.comment_count ?? 0}
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
    </article>
  )
}
