import { useMemo, useState } from 'react'
import { Avatar, Icon, SendBadge, Stars } from '../../components/Icon'
import { BrowseCragsLink, LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { useFollowingIds, useLikeClimb, usePublicFeed } from '../../hooks/useMigration'
import type { FeedClimbRow } from '../../types/api'

export function FeedView({
  onSignIn,
  onOpenRoute,
}: {
  onSignIn: () => void
  onOpenRoute: (routeId: string) => void
}) {
  const { accessToken } = useAuth()
  const [tab, setTab] = useState<'Following' | 'Everyone'>('Everyone')
  const feedQ = usePublicFeed()
  const followingQ = useFollowingIds()
  const like = useLikeClimb()

  const allRows = feedQ.data ?? []
  const followingIds = followingQ.data ?? new Set<string>()
  const rows = useMemo(() => {
    if (tab !== 'Following') return allRows
    return allRows.filter((post) => {
      const authorId = post.user_id ?? post.profile?.id
      return authorId != null && followingIds.has(authorId)
    })
  }, [allRows, tab, followingIds])

  if (!accessToken) {
    return (
      <div className="view-feed">
        <div className="page-head">
          <div>
            <h1 className="page-title">Feed</h1>
            <p className="page-sub">Sends from your crew and the wider community.</p>
          </div>
        </div>
        <LoginRequired
          icon="feed"
          title="Sign in to see the feed"
          body="Follow climbers, like sends, comment, and post your own — the same feed as on iOS."
          onSignIn={onSignIn}
          secondary={<BrowseCragsLink />}
        />
        <div className="feed-guest-teaser" aria-hidden>
          <div className="feed-guest-teaser-fade" />
          <div className="feed-list feed-guest-teaser-blur">
            {MOCK_TEASER.map((post) => (
              <FeedCard key={post.id} post={post} onOpenRoute={() => {}} onLike={() => {}} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="view-feed">
      <div className="page-head">
        <div>
          <h1 className="page-title">Feed</h1>
          <p className="page-sub">Sends from your crew and the wider community.</p>
        </div>
        <div className="segmented">
          {(['Following', 'Everyone'] as const).map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === 'Following' && followingQ.isSuccess && rows.length === 0 && (
        <p className="muted" style={{ padding: '0 0 16px' }}>
          No sends from people you follow yet.{' '}
          <button type="button" className="link-btn" onClick={() => setTab('Everyone')}>
            Browse everyone
          </button>
        </p>
      )}
      {feedQ.isLoading && <p className="muted">Loading feed…</p>}
      {feedQ.isError && <p className="error">Could not load feed.</p>}
      <div className="feed-list">
        {rows.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            onOpenRoute={() => post.route_id && onOpenRoute(post.route_id)}
            onLike={() => like.mutate(post.id)}
          />
        ))}
        {!feedQ.isLoading && rows.length === 0 && tab === 'Everyone' && (
          <p className="muted">No public sends yet. Log a climb to show up here.</p>
        )}
      </div>
    </div>
  )
}

function FeedCard({
  post,
  onOpenRoute,
  onLike,
}: {
  post: FeedClimbRow
  onOpenRoute: () => void
  onLike: () => void
}) {
  const name = post.profile?.nickname ?? post.profile?.username ?? 'Climber'
  return (
    <article className="feed-card">
      <div className="feed-card-head">
        <Avatar name={name} />
        <div>
          <strong>{name}</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            {post.route?.name ?? 'Route'} · <SendBadge type={post.send_type} />
          </div>
        </div>
      </div>
      {post.notes && <p style={{ margin: '12px 0', lineHeight: 1.5 }}>{post.notes}</p>}
      <button type="button" className="route-stripe" onClick={onOpenRoute}>
        <span className="chip">{post.route?.grade}</span>
        <span>{post.route?.name}</span>
      </button>
      <div className="feed-actions">
        <button type="button" className="icon-btn" onClick={onLike} aria-label="Like">
          <Icon name="heart" size={18} />
          {post.like_count ?? 0}
        </button>
        <span className="icon-btn">
          <Icon name="comment" size={18} />
          {post.comment_count ?? 0}
        </span>
        {post.personal_rating != null && <Stars value={Math.round(post.personal_rating)} />}
      </div>
    </article>
  )
}

const MOCK_TEASER: FeedClimbRow[] = [
  {
    id: 't1',
    send_type: 'onsight',
    notes: 'Stuck the crux on the second go.',
    like_count: 12,
    comment_count: 3,
    route: { id: 'mock-1', name: 'The Coffin', grade: '7a' },
    profile: { nickname: 'Maya' },
  },
  {
    id: 't2',
    send_type: 'flash',
    like_count: 28,
    comment_count: 5,
    route: { id: 'mock-2', name: 'Heart of Darkness', grade: '7b+' },
    profile: { nickname: 'Alex' },
  },
]
