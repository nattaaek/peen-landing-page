import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FeedCard } from '../../components/FeedCard'
import { Icon } from '../../components/Icon'
import { BrowseCragsLink, LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import {
  useFollowingIds,
  useInfinitePublicFeed,
  useLikeClimb,
  useSendItClimb,
  useToggleFollow,
  useToggleWishlist,
  useUnlikeClimb,
  useUnsendItClimb,
  useWishlistRouteIds,
} from '../../hooks/useMigration'
import type { FeedClimbRow } from '../../types/api'
import { DEFAULT_GRADE_RANGE } from './feedConstants'
import { FeedFilterBar } from './FeedFilterBar'
import {
  cragCountsFromPosts,
  filterFeedPosts,
  sortFeedPosts,
  uniqueCragsFromPosts,
  type FeedFilterState,
} from './feedFilterLogic'

export function FeedView({
  onSignIn,
  onOpenRoute,
  onToast,
  onOpenProfile,
}: {
  onSignIn: (msg?: string) => void
  onOpenRoute: (routeId: string) => void
  onToast?: (msg: string) => void
  onOpenProfile: (userId: string) => void
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkClimbId = searchParams.get('climb')
  const { accessToken, user } = useAuth()
  const [tab, setTab] = useState<'Following' | 'Everyone'>('Everyone')
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [sendIt, setSendIt] = useState<Set<string>>(new Set())
  const [likeDeltas, setLikeDeltas] = useState<Map<string, number>>(new Map())
  const [highlightClimbId, setHighlightClimbId] = useState<string | null>(null)
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null)
  const [deepLinkMissing, setDeepLinkMissing] = useState(false)
  const deepLinkHandled = useRef(false)
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [filterState, setFilterState] = useState<FeedFilterState>({
    styleSet: new Set(),
    gradeRange: [...DEFAULT_GRADE_RANGE],
    cragSet: new Set(),
    whenChoice: 'any',
    sortBy: 'recent',
  })

  const feedQ = useInfinitePublicFeed()
  const followingQ = useFollowingIds()
  const wishlistQ = useWishlistRouteIds()
  const like = useLikeClimb()
  const unlike = useUnlikeClimb()
  const sendItMut = useSendItClimb()
  const unsendIt = useUnsendItClimb()
  const toggleFollow = useToggleFollow()
  const toggleWishlist = useToggleWishlist()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const allRows = useMemo(
    () => feedQ.data?.pages.flatMap((page) => page.posts) ?? [],
    [feedQ.data],
  )
  const followingIds = followingQ.data ?? new Set<string>()
  const wishlistIds = wishlistQ.data ?? new Set<string>()

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

  const tabRows = useMemo(() => {
    if (tab !== 'Following') return allRows
    return allRows.filter((post) => {
      const authorId = post.user_id ?? post.profile?.id
      return authorId != null && followingIds.has(authorId)
    })
  }, [allRows, tab, followingIds])

  const cragOptions = useMemo(() => uniqueCragsFromPosts(allRows), [allRows])
  const cragCounts = useMemo(() => cragCountsFromPosts(allRows), [allRows])

  const filteredRows = useMemo(
    () => sortFeedPosts(filterFeedPosts(tabRows, filterState), filterState.sortBy),
    [tabRows, filterState],
  )

  const registerCardRef = useCallback((postId: string, el: HTMLElement | null) => {
    if (el) cardRefs.current.set(postId, el)
    else cardRefs.current.delete(postId)
  }, [])

  useEffect(() => {
    deepLinkHandled.current = false
    setHighlightClimbId(null)
    setExpandedCommentsId(null)
    setDeepLinkMissing(false)
  }, [deepLinkClimbId])

  useEffect(() => {
    if (!deepLinkClimbId) return
    const post = allRows.find((p) => p.id === deepLinkClimbId)
    if (!post || filteredRows.some((p) => p.id === deepLinkClimbId)) return
    setTab('Everyone')
    setFilterState({
      styleSet: new Set(),
      gradeRange: [...DEFAULT_GRADE_RANGE],
      cragSet: new Set(),
      whenChoice: 'any',
      sortBy: 'recent',
    })
  }, [deepLinkClimbId, allRows, filteredRows])

  useEffect(() => {
    if (!deepLinkClimbId || !accessToken || !feedQ.data) return
    if (allRows.some((p) => p.id === deepLinkClimbId)) return
    if (feedQ.hasNextPage && !feedQ.isFetchingNextPage) {
      void feedQ.fetchNextPage()
    }
  }, [deepLinkClimbId, allRows, accessToken, feedQ])

  useEffect(() => {
    if (!deepLinkClimbId || deepLinkHandled.current || !accessToken) return
    if (!filteredRows.some((p) => p.id === deepLinkClimbId)) return

    const el = cardRefs.current.get(deepLinkClimbId)
    if (!el) return

    deepLinkHandled.current = true
    setExpandedCommentsId(deepLinkClimbId)
    setHighlightClimbId(deepLinkClimbId)
    window.setTimeout(() => setHighlightClimbId(null), 2800)

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('climb')
        return next
      },
      { replace: true },
    )
  }, [deepLinkClimbId, filteredRows, accessToken, setSearchParams])

  useEffect(() => {
    if (!deepLinkClimbId || !feedQ.data || deepLinkHandled.current) return
    if (allRows.some((p) => p.id === deepLinkClimbId)) return
    if (feedQ.hasNextPage || feedQ.isFetchingNextPage) return

    deepLinkHandled.current = true
    setDeepLinkMissing(true)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('climb')
        return next
      },
      { replace: true },
    )
  }, [deepLinkClimbId, allRows, feedQ.data, feedQ.hasNextPage, feedQ.isFetchingNextPage, setSearchParams])

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

  const displayLikeCount = (post: FeedClimbRow) =>
    Math.max(0, (post.like_count ?? 0) + (likeDeltas.get(post.id) ?? 0))

  const toggleLike = async (postId: string) => {
    const was = liked.has(postId)
    setLiked((prev) => {
      const next = new Set(prev)
      if (was) next.delete(postId)
      else next.add(postId)
      return next
    })
    setLikeDeltas((prev) => {
      const next = new Map(prev)
      next.set(postId, (next.get(postId) ?? 0) + (was ? -1 : 1))
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
      setLikeDeltas((prev) => {
        const next = new Map(prev)
        next.set(postId, (next.get(postId) ?? 0) + (was ? 1 : -1))
        return next
      })
    }
  }

  const toggleSendItPost = async (postId: string) => {
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

  const clearFilters = () => {
    setFilterState({
      styleSet: new Set(),
      gradeRange: [...DEFAULT_GRADE_RANGE],
      cragSet: new Set(),
      whenChoice: 'any',
      sortBy: 'recent',
    })
  }

  const renderCard = (post: FeedClimbRow, guest = false) => {
    const authorId = post.user_id ?? post.profile?.id
    const routeId = post.route_id ?? post.route?.id
    const isSelf = !!user?.id && authorId === user.id
    const isFollowing = authorId != null && followingIds.has(authorId)

    return (
      <FeedCard
        key={post.id}
        post={post}
        liked={liked.has(post.id)}
        sendItOn={sendIt.has(post.id)}
        likeCount={displayLikeCount(post)}
        commentCount={post.comment_count ?? 0}
        highlighted={highlightClimbId === post.id}
        commentsOpen={expandedCommentsId === post.id}
        cardRef={(el) => registerCardRef(post.id, el)}
        isFollowing={isFollowing}
        isSelf={isSelf}
        isSaved={routeId ? wishlistIds.has(routeId) : false}
        isGuest={guest || !accessToken}
        onOpenRoute={() => routeId && onOpenRoute(routeId)}
        onOpenProfile={() => authorId && onOpenProfile(authorId)}
        onLike={() => toggleLike(post.id)}
        onSendIt={() => toggleSendItPost(post.id)}
        onToggleFollow={() => {
          if (!authorId || isSelf) return
          toggleFollow.mutate({ targetId: authorId, follow: !isFollowing })
        }}
        onToggleWishlist={() => {
          if (!routeId) return
          const save = !wishlistIds.has(routeId)
          toggleWishlist.mutate({ routeId, save })
          onToast?.(
            save
              ? `Added ${post.route?.name ?? 'route'} to wishlist`
              : `Removed ${post.route?.name ?? 'route'} from wishlist`,
          )
        }}
        onToast={onToast}
        onSignIn={onSignIn}
      />
    )
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
          body="The feed shows sends from climbers you follow and the wider community. Sign in to follow climbers, like, comment, and post your own sends."
          onSignIn={() => onSignIn()}
          secondary={<BrowseCragsLink />}
        />
        <div className="feed-guest-teaser" aria-hidden>
          <div className="feed-guest-teaser-fade" />
          <div className="feed-list feed-guest-teaser-blur">
            {MOCK_TEASER.map((post) => renderCard(post, true))}
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
        <div className="segmented" role="tablist" aria-label="Feed scope">
          {(['Following', 'Everyone'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <FeedFilterBar
        state={filterState}
        onChange={setFilterState}
        cragOptions={cragOptions}
        cragCounts={cragCounts}
        resultCount={filteredRows.length}
      />

      {tab === 'Following' ? (
        <p className="muted feed-tab-hint">
          Following shows sends from people you follow in the loaded feed — scroll down to load more.
        </p>
      ) : null}

      {tab === 'Following' && followingQ.isSuccess && tabRows.length === 0 && !feedQ.isLoading && (
        <p className="muted feed-tab-hint">
          No sends from people you follow yet.{' '}
          <button type="button" className="link-btn" onClick={() => setTab('Everyone')}>
            Browse everyone
          </button>
        </p>
      )}
      {deepLinkClimbId && !deepLinkHandled.current && feedQ.isFetchingNextPage ? (
        <p className="muted feed-tab-hint">Finding shared send…</p>
      ) : null}
      {deepLinkMissing ? (
        <p className="muted feed-tab-hint">That send isn&apos;t in the feed or may no longer be public.</p>
      ) : null}
      {feedQ.isLoading && !feedQ.data && (
        <p className="muted feed-tab-hint">Loading feed…</p>
      )}
      {feedQ.isError && <p className="error feed-tab-hint">Could not load feed.</p>}

      <div className="feed-list">
        {filteredRows.length === 0 && !feedQ.isLoading ? (
          tabRows.length > 0 ? (
            <div className="feed-empty">
              <Icon name="filter" size={28} style={{ opacity: 0.4 }} />
              <div className="feed-empty-title">No sends match those filters</div>
              <div className="feed-empty-body">Try widening the grade range or removing a crag.</div>
              <button type="button" className="btn btn-secondary feed-empty-clear" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : tab === 'Everyone' ? (
            <p className="muted">No public sends yet. Log a climb to show up here.</p>
          ) : null
        ) : (
          filteredRows.map((post) => renderCard(post))
        )}
      </div>

      {feedQ.hasNextPage ? <div ref={loadMoreRef} className="feed-sentinel" aria-hidden /> : null}
      {feedQ.isFetchingNextPage && (
        <p className="muted feed-loading-more">Loading more…</p>
      )}
      {!feedQ.hasNextPage && !feedQ.isFetchingNextPage && filteredRows.length > 0 && (
        <div className="feed-end">
          That&apos;s everything.{' '}
          <button type="button" className="link-btn" onClick={() => navigate('/crags')}>
            Find new climbers →
          </button>
        </div>
      )}
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
