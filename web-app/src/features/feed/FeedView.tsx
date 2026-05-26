import { useEffect, useMemo, useRef, useState } from 'react'
import { FeedCard } from '../../components/FeedCard'
import { Icon } from '../../components/Icon'
import { BrowseCragsLink, LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { CommentsSheet } from './CommentsSheet'
import {
  useFollowingIds,
  useInfinitePublicFeed,
  useLikeClimb,
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
  const feedQ = useInfinitePublicFeed()
  const followingQ = useFollowingIds()
  const like = useLikeClimb()
  const unlike = useUnlikeClimb()
  const sendItMut = useSendItClimb()
  const unsendIt = useUnsendItClimb()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const allRows = useMemo(
    () => feedQ.data?.pages.flatMap((page) => page.posts) ?? [],
    [feedQ.data],
  )
  const followingIds = followingQ.data ?? new Set<string>()

  useEffect(() => {
    if (!feedQ.data) return
    const likedIds = new Set<string>()
    const sendItIds = new Set<string>()
    for (const page of feedQ.data.pages) {
      for (const id of page.likedClimbIds) likedIds.add(id)
      for (const id of page.sendItClimbIds) sendItIds.add(id)
    }
    setLiked(likedIds)
    setSendIt(sendItIds)
  }, [feedQ.data])

  const rows = useMemo(() => {
    if (tab !== 'Following') return allRows
    return allRows.filter((post) => {
      const authorId = post.user_id ?? post.profile?.id
      return authorId != null && followingIds.has(authorId)
    })
  }, [allRows, tab, followingIds])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !feedQ.hasNextPage || feedQ.isFetchingNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) feedQ.fetchNextPage()
      },
      { rootMargin: '240px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [feedQ.hasNextPage, feedQ.isFetchingNextPage, feedQ.fetchNextPage])

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

  const filterChips = (
    <div className="feed-filters">
      <span className="chip outline">
        <Icon name="bolt" size={12} /> Flash only
      </span>
      <span className="chip outline">
        <Icon name="grade" size={12} /> 6c – 7b
      </span>
      <span className="chip outline">
        <Icon name="pin" size={12} /> Within 50 km
      </span>
      <span className="chip outline">
        <Icon name="calendar" size={12} /> Last 7 days
      </span>
    </div>
  )

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
        <div className="segmented" role="tablist">
          {(['Following', 'Everyone'] as const).map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filterChips}

      {tab === 'Following' && followingQ.isSuccess && rows.length === 0 && !feedQ.isLoading && (
        <p className="muted" style={{ maxWidth: 720, margin: '0 auto 16px' }}>
          No sends from people you follow yet.{' '}
          <button type="button" className="link-btn" onClick={() => setTab('Everyone')}>
            Browse everyone
          </button>
        </p>
      )}
      {feedQ.isLoading && !feedQ.data && (
        <p className="muted" style={{ maxWidth: 720, margin: '0 auto' }}>Loading feed…</p>
      )}
      {feedQ.isError && <p className="error" style={{ maxWidth: 720, margin: '0 auto' }}>Could not load feed.</p>}

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

      {feedQ.hasNextPage ? <div ref={loadMoreRef} className="feed-sentinel" aria-hidden /> : null}
      {feedQ.isFetchingNextPage && (
        <p className="muted feed-loading-more">Loading more…</p>
      )}
      {!feedQ.hasNextPage && !feedQ.isFetchingNextPage && rows.length > 0 && (
        <div className="feed-end">
          That&apos;s everything. <a href="/app/crags">Find new climbers →</a>
        </div>
      )}

      <CommentsSheet post={commentPost} open={!!commentPost} onClose={() => setCommentPost(null)} />
    </div>
  )
}

const MOCK_TEASER: FeedClimbRow[] = [
  {
    id: 't1',
    send_type: 'flash',
    notes: 'Stuck the crux on the second go.',
    like_count: 12,
    comment_count: 3,
    created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    route: { id: 'mock-1', name: 'The Coffin', grade: '7a', area: { id: 'a1', name: 'Tonsai' }, length_meters: 18 },
    profile: { nickname: 'Maya', username: 'maya' },
  },
  {
    id: 't2',
    send_type: 'onsight',
    like_count: 28,
    comment_count: 5,
    created_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    route: { id: 'mock-2', name: 'Heart of Darkness', grade: '7b+', gym: { id: 'g1', name: 'Stone Locker' } },
    profile: { nickname: 'Alex', username: 'alex' },
  },
]
