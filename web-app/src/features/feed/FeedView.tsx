import { useMemo, useState } from 'react'
import { Avatar, Icon, SendBadge, Stars } from '../../components/Icon'
import { BrowseCragsLink, LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { CommentsSheet } from './CommentsSheet'
import {
  useFollowingIds,
  useLikeClimb,
  usePublicFeed,
  useSendItClimb,
  useUnlikeClimb,
  useUnsendItClimb,
} from '../../hooks/useMigration'
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
  const [commentPost, setCommentPost] = useState<FeedClimbRow | null>(null)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [sendIt, setSendIt] = useState<Set<string>>(new Set())
  const feedQ = usePublicFeed()
  const followingQ = useFollowingIds()
  const like = useLikeClimb()
  const unlike = useUnlikeClimb()
  const sendItMut = useSendItClimb()
  const unsendIt = useUnsendItClimb()

  const allRows = feedQ.data ?? []
  const followingIds = followingQ.data ?? new Set<string>()
  const rows = useMemo(() => {
    if (tab !== 'Following') return allRows
    return allRows.filter((post) => {
      const authorId = post.user_id ?? post.profile?.id
      return authorId != null && followingIds.has(authorId)
    })
  }, [allRows, tab, followingIds])

  const toggleLike = async (postId: string) => {
    const was = liked.has(postId)
    setLiked((prev) => {
      const next = new Set(prev)
      if (was) next.delete(postId)
      else next.add(postId)
      return next
    })
    try {
      if (was) await unlike.mutateAsync(postId)
      else await like.mutateAsync(postId)
    } catch {
      setLiked((prev) => {
        const next = new Set(prev)
        if (was) next.add(postId)
        else next.delete(postId)
        return next
      })
    }
  }

  const toggleSendIt = async (postId: string) => {
    const was = sendIt.has(postId)
    setSendIt((prev) => {
      const next = new Set(prev)
      if (was) next.delete(postId)
      else next.add(postId)
      return next
    })
    try {
      if (was) await unsendIt.mutateAsync(postId)
      else await sendItMut.mutateAsync(postId)
    } catch {
      setSendIt((prev) => {
        const next = new Set(prev)
        if (was) next.add(postId)
        else next.delete(postId)
        return next
      })
    }
  }

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
              <FeedCard
                key={post.id}
                post={post}
                liked={false}
                sendItOn={false}
                onOpenRoute={() => {}}
                onLike={() => {}}
                onSendIt={() => {}}
                onComment={() => {}}
              />
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
            liked={liked.has(post.id)}
            sendItOn={sendIt.has(post.id)}
            onOpenRoute={() => post.route_id && onOpenRoute(post.route_id)}
            onLike={() => toggleLike(post.id)}
            onSendIt={() => toggleSendIt(post.id)}
            onComment={() => setCommentPost(post)}
          />
        ))}
        {!feedQ.isLoading && rows.length === 0 && tab === 'Everyone' && (
          <p className="muted">No public sends yet. Log a climb to show up here.</p>
        )}
      </div>
      <CommentsSheet post={commentPost} open={!!commentPost} onClose={() => setCommentPost(null)} />
    </div>
  )
}

function FeedCard({
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
        <button
          type="button"
          className={`icon-btn ${liked ? 'active' : ''}`}
          onClick={onLike}
          aria-label="Like"
        >
          <Icon name="heart" size={18} />
          {post.like_count ?? 0}
        </button>
        <button type="button" className="icon-btn" onClick={onComment} aria-label="Comments">
          <Icon name="comment" size={18} />
          {post.comment_count ?? 0}
        </button>
        <button
          type="button"
          className={`icon-btn ${sendItOn ? 'active' : ''}`}
          onClick={onSendIt}
          aria-label="Send it"
        >
          <Icon name="share" size={18} />
          Send it
        </button>
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
