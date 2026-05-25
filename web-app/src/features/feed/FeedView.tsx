import { useState } from 'react'
import { Avatar, Icon, SendBadge, Stars } from '../../components/Icon'
import { LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { useLikeClimb, usePublicFeed } from '../../hooks/useMigration'
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
  const like = useLikeClimb()

  if (!accessToken) {
    return (
      <LoginRequired
        title="Your feed lives here"
        hint="Sign in to see sends from climbers you follow and the wider community."
        onSignIn={onSignIn}
      />
    )
  }

  const rows = feedQ.data ?? []

  return (
    <div className="view-feed">
      <div className="view-head">
        <h1>Feed</h1>
        <div className="seg-control">
          {(['Following', 'Everyone'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === 'Following' && (
        <p className="muted" style={{ padding: '0 24px 16px' }}>
          Following feed uses the same API as Everyone once your follow graph has activity.
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
        {!feedQ.isLoading && rows.length === 0 && (
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
