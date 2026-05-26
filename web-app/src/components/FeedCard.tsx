import { profileDisplayName, profileHandle } from '../lib/peen-api/profiles'
import { Icon, SendBadge } from './Icon'
import { SEND_COLORS } from '../types/api'
import type { FeedClimbRow } from '../types/api'

/** Per-climber avatar colors from peen-web/data.jsx CLIMBERS */
const CLIMBER_COLORS = ['#D55A1F', '#2860A3', '#459B51', '#9B59B6', '#1F1F20', '#D55A1F', '#2860A3']

const ROUTE_GRADIENTS: Record<string, [string, string, string]> = {
  r1: ['#D89971', '#7A4426', '#E8D2BA'],
  r2: ['#A2A09C', '#4A4D52', '#D8D5D0'],
  r3: ['#E1B074', '#8B5A2B', '#F5E0C5'],
  r4: ['#8FA08C', '#3F523F', '#D7DCC8'],
  r5: ['#C68C5A', '#5C3318', '#F0CDA8'],
  r6: ['#A89180', '#544740', '#D5C8BC'],
  r7: ['#A56646', '#3D1F12', '#E2B190'],
}

function climberColor(seed?: string) {
  if (!seed) return CLIMBER_COLORS[0]
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return CLIMBER_COLORS[n % CLIMBER_COLORS.length]
}

function routeGradient(routeId?: string): [string, string, string] {
  if (routeId && ROUTE_GRADIENTS[routeId]) return ROUTE_GRADIENTS[routeId]
  const keys = Object.keys(ROUTE_GRADIENTS)
  let n = 0
  const seed = routeId ?? 'default'
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return ROUTE_GRADIENTS[keys[n % keys.length]] ?? ROUTE_GRADIENTS.r1
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

/** Real URLs, or a single route placeholder thumb when the climb has a route (peen-web RouteThumb). */
function feedPhotoUrls(post: FeedClimbRow): string[] {
  const urls = (post.photo_urls ?? []).filter((u) => u?.trim().startsWith('http'))
  if (urls.length > 0) return urls.slice(0, 3)
  if (post.route_id || post.route?.id) return ['']
  return []
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
          <FeedPhoto url={show[0]} routeId={routeId} idx={0} />
          <div className="col">
            <FeedPhoto url={show[1]} routeId={routeId} idx={1} />
            <FeedPhoto url={show[2]} routeId={routeId} idx={2} />
          </div>
        </>
      ) : (
        show.map((url, i) => <FeedPhoto key={i} url={url} routeId={routeId} idx={i} />)
      )}
    </div>
  )
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

function FeedPhoto({ url, routeId, idx }: { url: string; routeId?: string; idx: number }) {
  const [a, b, c] = routeGradient(routeId)
  const off = (idx + 1) * 17
  if (url.startsWith('http')) {
    return <div className="ph" style={{ backgroundImage: `url(${url})` }} />
  }
  return (
    <div className="ph" style={{ background: `linear-gradient(160deg, ${a}, ${b})`, position: 'relative' }}>
      <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id={`sky-${routeId ?? 'x'}-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c} stopOpacity="0.7" />
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="200" height="150" fill={`url(#sky-${routeId ?? 'x'}-${idx})`} />
        <path
          d={`M 0 ${100 + (off % 20)} C 30 ${60 + (off % 15)}, 60 ${90 + (off % 10)}, 110 ${70 + (off % 12)} S 180 ${50 + (off % 15)}, 200 ${80 + (off % 8)} L 200 150 L 0 150 Z`}
          fill={b}
          opacity="0.55"
        />
        <path
          d={`M 0 ${115 + (off % 12)} C 40 ${85 + (off % 8)}, 80 ${110 + (off % 6)}, 130 ${95 + (off % 10)} S 190 ${75 + (off % 8)}, 200 ${105 + (off % 5)} L 200 150 L 0 150 Z`}
          fill="rgba(31,31,32,0.45)"
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
  const name = profileDisplayName(post.profile ?? {})
  const handle = profileHandle(post.profile ?? {})
  const sendType = (post.send_type ?? 'attempt').toLowerCase()
  const stripeColor = SEND_COLORS[sendType] ?? 'var(--tint)'
  const photos = feedPhotoUrls(post)
  const when = formatWhen(post.created_at)

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

      <RouteMedia urls={photos} routeId={post.route_id ?? post.route?.id} />

      {post.notes ? <div className="feed-body">{post.notes}</div> : null}

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
