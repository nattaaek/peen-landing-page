import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { migrationInvoke } from '../lib/peen-api/migration'
import {
  fetchMyProfile,
  fetchProfileIdentities,
  fetchUserProfile,
  patchProfile,
} from '../lib/peen-api/profiles'
import type { UserProfileIdentity } from '../lib/peen-api/profiles'
import type {
  AngleConsensus,
  ApiRoute,
  ClimbComment,
  ClimbLogRow,
  FeedClimbRow,
  FeedReactionCountRow,
  InboxNotification,
  HazardReportRow,
  RouteTopoPoint,
  RouteTopoLine,
  ApproachGPXVersionRow,
  PartnerPost,
  PublicFeedPayload,
  RouteRatingSummary,
  WeeklyLeaderboardRow,
  SharedProjectRow,
  BetaSprayRow,
  CommunityChallengeRow,
  CrewInviteRow,
} from '../types/api'
import { useAuth } from '../features/auth/AuthProvider'
import { normalizeRouteId, parseRouteId } from '../lib/routeIds'

export function useMyProfile() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => fetchMyProfile(accessToken!),
    enabled: !!accessToken,
  })
}

export function useUserProfile(userId: string | null) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchUserProfile(accessToken!, userId!),
    enabled: !!accessToken && !!userId,
  })
}

export function useUserPublicSends(userId: string | null, limit = 20) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['climbs', 'public', userId, limit],
    queryFn: () =>
      migrationInvoke<ClimbLogRow[]>(
        'climbs',
        'fetchRecentPublicSends',
        { user_id: userId, limit },
        accessToken!,
      ),
    enabled: !!accessToken && !!userId,
  })
}

export function useProfileIdentities(userIds: string[]) {
  const { accessToken } = useAuth()
  const key = [...new Set(userIds.filter(Boolean))].sort().join(',')
  return useQuery({
    queryKey: ['profile', 'identities', key],
    queryFn: () => fetchProfileIdentities(accessToken!, userIds),
    enabled: !!accessToken && userIds.length > 0,
  })
}

export const FEED_PAGE_SIZE = 20

export type FeedPageCursor = { created_at: string; id: string }

function feedInfiniteQueryKey(userId?: string) {
  return ['feed', 'public', 'infinite', userId] as const
}

export function bumpFeedCommentCount(
  qc: QueryClient,
  userId: string | undefined,
  climbId: string,
) {
  qc.setQueryData<InfiniteData<PublicFeedPayload>>(feedInfiniteQueryKey(userId), (old) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        posts: page.posts.map((p) =>
          p.id === climbId ? { ...p, comment_count: (p.comment_count ?? 0) + 1 } : p,
        ),
      })),
    }
  })
}

async function hydrateFeedPage(
  rows: FeedClimbRow[],
  accessToken: string,
  userId?: string,
): Promise<PublicFeedPayload> {
  const userIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))]
  const climbIds = rows.map((r) => r.id).filter(Boolean)

  const [identities, avatarRows, reactionRows, myLikes, mySendIts] = await Promise.all([
    userIds.length > 0 ? fetchProfileIdentities(accessToken, userIds) : Promise.resolve([]),
    userIds.length > 0
      ? migrationInvoke<{ user_id: string; avatar_url?: string | null }[]>(
          'community',
          'fetchAvatarUrls',
          { user_ids: userIds },
          accessToken,
        )
      : Promise.resolve([]),
    climbIds.length > 0
      ? migrationInvoke<FeedReactionCountRow[]>(
          'social',
          'loadReactionCounts',
          { climb_ids: climbIds },
          accessToken,
        )
      : Promise.resolve([]),
    climbIds.length > 0 && userId
      ? migrationInvoke<{ climb_id: string }[]>(
          'social',
          'loadMyLikes',
          { user_id: userId, climb_ids: climbIds },
          accessToken,
        )
      : Promise.resolve([]),
    climbIds.length > 0 && userId
      ? migrationInvoke<{ climb_id: string }[]>(
          'social',
          'loadMySendIts',
          { user_id: userId, climb_ids: climbIds },
          accessToken,
        )
      : Promise.resolve([]),
  ])

  const byUserId = new Map(identities.map((i) => [i.user_id, i]))
  const avatarByUserId = new Map(
    avatarRows
      .map((r) => [r.user_id, r.avatar_url?.trim() ?? ''] as const)
      .filter(([, url]) => /^https?:\/\//i.test(url) || url.startsWith('//')),
  )
  const reactionsByClimb = new Map(reactionRows.map((r) => [r.climb_id, r]))

  const posts = rows.map((row) => {
    const uid = row.user_id
    const identity = uid ? byUserId.get(uid) : undefined
    const avatarUrl = uid ? avatarByUserId.get(uid) ?? row.profile?.avatar_url : row.profile?.avatar_url
    const reaction = reactionsByClimb.get(row.id)
    return {
      ...row,
      like_count: reaction?.likes_count ?? row.like_count ?? 0,
      comment_count: reaction?.comments_count ?? row.comment_count ?? 0,
      profile:
        uid || identity || avatarUrl
          ? {
              id: uid,
              nickname: identity?.nickname ?? row.profile?.nickname,
              username: identity?.username ?? row.profile?.username,
              avatar_url: avatarUrl,
            }
          : row.profile,
    }
  })

  return {
    posts,
    likedClimbIds: myLikes.map((r) => r.climb_id),
    sendItClimbIds: mySendIts.map((r) => r.climb_id),
  }
}

export function useInfinitePublicFeed() {
  const { accessToken, user } = useAuth()
  return useInfiniteQuery({
    queryKey: feedInfiniteQueryKey(user?.id),
    queryFn: async ({ pageParam }): Promise<PublicFeedPayload> => {
      const params: Record<string, unknown> = { limit: FEED_PAGE_SIZE }
      if (pageParam) {
        params.cursor_created_at = pageParam.created_at
        params.cursor_id = pageParam.id
      }
      const rows = await migrationInvoke<FeedClimbRow[]>(
        'social',
        'loadPublicFeed',
        params,
        accessToken!,
      )
      return hydrateFeedPage(rows, accessToken!, user?.id)
    },
    initialPageParam: undefined as FeedPageCursor | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.posts.length < FEED_PAGE_SIZE) return undefined
      const last = lastPage.posts[lastPage.posts.length - 1]
      if (!last?.created_at) return undefined
      return { created_at: last.created_at, id: last.id }
    },
    enabled: !!accessToken,
  })
}

/** Follow graph for Following feed tab (same as iOS SocialFeedManager). */
export function useFollowingIds() {
  const { accessToken, user } = useAuth()
  return useQuery({
    queryKey: ['social', 'following', user?.id],
    queryFn: async () => {
      const rows = await migrationInvoke<{ followed_id?: string; followedId?: string }[]>(
        'social',
        'loadFollowing',
        { user_id: user!.id },
        accessToken!,
      )
      return new Set(
        rows.map((r) => r.followed_id ?? r.followedId).filter((id): id is string => !!id),
      )
    },
    enabled: !!accessToken && !!user?.id,
  })
}

/** Follow / unfollow (same ops as iOS SocialFeedManager). */
export function useToggleFollow() {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  const followingKey = ['social', 'following', user?.id] as const
  return useMutation({
    mutationFn: async ({ targetId, follow }: { targetId: string; follow: boolean }) => {
      const op = follow ? 'followUser' : 'unfollowUser'
      await migrationInvoke(
        'social',
        op,
        { follower_id: user!.id, followed_id: targetId },
        accessToken!,
      )
    },
    onMutate: async ({ targetId, follow }) => {
      await qc.cancelQueries({ queryKey: followingKey })
      const prev = qc.getQueryData<Set<string>>(followingKey)
      qc.setQueryData<Set<string>>(followingKey, (old) => {
        const next = new Set(old ?? [])
        if (follow) next.add(targetId)
        else next.delete(targetId)
        return next
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(followingKey, ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: followingKey })
    },
  })
}

export function useMyLogs() {
  const { accessToken, user } = useAuth()
  return useQuery({
    queryKey: ['climbs', 'logs', user?.id],
    queryFn: async () => {
      const rows = await migrationInvoke<ClimbLogRow[]>(
        'climbs',
        'fetchLogs',
        { user_id: user!.id },
        accessToken!,
      )
      return rows
    },
    enabled: !!accessToken && !!user?.id,
  })
}

export function useInbox() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: async () => {
      const raw = await migrationInvoke<InboxNotification[] | { items?: InboxNotification[] }>(
        'notifications',
        'loadInbox',
        { limit: 40 },
        accessToken!,
      )
      const rows = Array.isArray(raw) ? raw : (raw.items ?? [])
      const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id))]
      if (actorIds.length === 0) return rows
      try {
        const [identities, avatarRows] = await Promise.all([
          fetchProfileIdentities(accessToken!, actorIds),
          migrationInvoke<{ user_id: string; avatar_url?: string | null }[]>(
            'community',
            'fetchAvatarUrls',
            { user_ids: actorIds },
            accessToken!,
          ),
        ])
        const byId = new Map(identities.map((i) => [i.user_id, i]))
        const avatarById = new Map(
          avatarRows
            .map((r) => [r.user_id, r.avatar_url?.trim() ?? ''] as const)
            .filter(([, url]) => /^https?:\/\//i.test(url) || url.startsWith('//')),
        )
        return rows.map((n) => {
          const id = n.actor_id
          if (!id) return n
          const ident = byId.get(id)
          return {
            ...n,
            sender_name: ident?.nickname ?? ident?.username ?? undefined,
            sender_username: ident?.username ?? undefined,
            sender_avatar: avatarById.get(id) ?? undefined,
          }
        })
      } catch {
        return rows
      }
    },
    enabled: !!accessToken,
  })
}

export function usePartners() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['community', 'partners'],
    queryFn: () =>
      migrationInvoke<PartnerPost[]>('community', 'fetchPartners', { limit: 20 }, accessToken!),
    enabled: !!accessToken,
  })
}

export function useCrewLeaderboard() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['community', 'leaderboard'],
    queryFn: () =>
      migrationInvoke<WeeklyLeaderboardRow[]>(
        'community',
        'community_fetch_sends_leaderboard',
        { _range: 'year', _limit: 20 },
        accessToken!,
      ),
    enabled: !!accessToken,
  })
}

export function useWeeklyLeaderboard() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['community', 'weekly-leaderboard'],
    queryFn: () =>
      migrationInvoke<WeeklyLeaderboardRow[]>(
        'community',
        'community_fetch_weekly_leaderboard',
        { _limit: 20 },
        accessToken!,
      ),
    enabled: !!accessToken,
  })
}

export function useSharedProjects() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['community', 'shared-projects'],
    queryFn: () =>
      migrationInvoke<SharedProjectRow[]>(
        'community',
        'community_fetch_shared_projects',
        { _limit: 12 },
        accessToken!,
      ),
    enabled: !!accessToken,
  })
}

export function useBetaSpray() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['community', 'beta-spray'],
    queryFn: () =>
      migrationInvoke<BetaSprayRow[]>(
        'community',
        'community_fetch_beta_spray',
        { _limit: 12 },
        accessToken!,
      ),
    enabled: !!accessToken,
  })
}

export function useCommunityChallenges() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['community', 'challenges'],
    queryFn: () =>
      migrationInvoke<CommunityChallengeRow[]>('community', 'fetchChallenges', { limit: 12 }, accessToken!),
    enabled: !!accessToken,
  })
}

export function usePendingCrewInvites() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['community', 'crew-invites'],
    queryFn: () =>
      migrationInvoke<CrewInviteRow[]>('community', 'fetchPendingCrewInvites', { limit: 10 }, accessToken!),
    enabled: !!accessToken,
  })
}

/** Current user's rank on the weekly crew leaderboard (1-based), or null. */
export function useMyCrewRank(userId: string | undefined) {
  const boardQ = useWeeklyLeaderboard()
  const rank = useMemo(() => {
    if (!userId || !boardQ.data) return null
    const idx = boardQ.data.findIndex((r) => r.user_id === userId)
    return idx >= 0 ? idx + 1 : null
  }, [boardQ.data, userId])
  return { ...boardQ, rank }
}

export function useSeasonalSpotlight() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['seasonal', 'spotlight'],
    queryFn: () => migrationInvoke<unknown>('seasonal', 'seasonal_challenge_spotlight', {}, accessToken!),
    enabled: !!accessToken,
  })
}

export function useLogClimb() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      migrationInvoke<ClimbLogRow>('climbs', 'logClimb', params, accessToken!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['climbs'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useLikeClimb() {
  const { accessToken, user } = useAuth()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'likeClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
  })
}

export function useUnlikeClimb() {
  const { accessToken, user } = useAuth()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'unlikeClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
  })
}

export function useSendItClimb() {
  const { accessToken, user } = useAuth()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'sendItClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
  })
}

export function useUnsendItClimb() {
  const { accessToken, user } = useAuth()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'unsendItClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
  })
}

async function hydrateComments(
  rows: ClimbComment[],
  accessToken: string,
): Promise<ClimbComment[]> {
  const userIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))]
  if (userIds.length === 0) return rows

  const [identities, avatarRows] = await Promise.all([
    fetchProfileIdentities(accessToken, userIds),
    migrationInvoke<{ user_id: string; avatar_url?: string | null }[]>(
      'community',
      'fetchAvatarUrls',
      { user_ids: userIds },
      accessToken,
    ),
  ])
  const byUserId = new Map<string, UserProfileIdentity>(identities.map((i) => [i.user_id, i]))
  const avatarByUserId = new Map(
    avatarRows
      .map((r) => [r.user_id, r.avatar_url?.trim() ?? ''] as const)
      .filter(([, url]) => /^https?:\/\//i.test(url) || url.startsWith('//')),
  )

  return rows.map((row) => {
    const uid = row.user_id
    if (!uid) return row
    const identity = byUserId.get(uid)
    const avatarUrl = avatarByUserId.get(uid)
    return {
      ...row,
      profile: {
        nickname: identity?.nickname,
        username: identity?.username,
        avatar_url: avatarUrl,
      },
    }
  })
}

export function useComments(climbId: string | undefined) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['social', 'comments', climbId],
    queryFn: async () => {
      const rows = await migrationInvoke<ClimbComment[]>(
        'social',
        'fetchComments',
        { climb_id: climbId! },
        accessToken!,
      )
      return hydrateComments(rows, accessToken!)
    },
    enabled: !!accessToken && !!climbId,
  })
}

export function useAddComment() {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { climb_id: string; body: string }) =>
      migrationInvoke('social', 'addComment', {
        ...params,
        user_id: user!.id,
      }, accessToken!),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['social', 'comments', vars.climb_id] })
      bumpFeedCommentCount(qc, user?.id, vars.climb_id)
    },
  })
}

export function usePublicRouteLogs(routeId: string | undefined) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['climbs', 'public', routeId],
    queryFn: () =>
      migrationInvoke<ClimbLogRow[]>(
        'climbs',
        'fetchPublicLogsForRoute',
        { route_id: routeId!, limit: 20 },
        accessToken!,
      ),
    enabled: !!accessToken && !!routeId,
  })
}

export function useRouteRating(routeId: string | undefined) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['routes', 'rating', routeId],
    queryFn: async () => {
      const rows = await migrationInvoke<RouteRatingSummary[]>(
        'routes',
        'route_rating_summary',
        { route_id: routeId! },
        accessToken!,
      )
      return rows[0] ?? null
    },
    enabled: !!accessToken && !!routeId,
  })
}

export function useRouteConsensus(routeId: string | undefined) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['routes', 'consensus', routeId],
    queryFn: async () => {
      const rows = await migrationInvoke<AngleConsensus[]>(
        'routes',
        'fetchConsensus',
        { route_id: routeId! },
        accessToken!,
      )
      return rows[0] ?? null
    },
    enabled: !!accessToken && !!routeId,
  })
}

export function useRouteTopoLinesForImages({
  routeId,
  imageUrls,
}: {
  routeId: string | undefined
  imageUrls: string[] | undefined
}) {
  const { accessToken } = useAuth()
  const normalized = useMemo(
    () => (imageUrls && imageUrls.length > 0 ? [...imageUrls].filter(Boolean) : []),
    [imageUrls],
  )

  return useQuery({
    queryKey: ['routes', 'topo', 'for_images', routeId, normalized.join(',')],
    queryFn: () =>
      migrationInvoke<RouteTopoLine[]>(
        'routes',
        'fetchTopoLinesForImages',
        { image_urls: normalized },
        accessToken!,
      ),
    enabled: !!accessToken && !!routeId && normalized.length > 0,
  })
}

export function useActiveHazardsForRoute(routeId: string | undefined) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['routes', 'hazards', routeId],
    queryFn: () =>
      migrationInvoke<HazardReportRow[]>(
        'routes',
        'fetchActiveHazardsForRoute',
        { route_id: routeId! },
        accessToken!,
      ),
    enabled: !!accessToken && !!routeId,
  })
}

export function useResolveHazardReport() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { reportId: string }) =>
      migrationInvoke('routes', 'resolveHazardReport', { report_id: params.reportId }, accessToken!),
    onSuccess: (_d) => {
      // Invalidate hazards for any routes the app is currently viewing.
      qc.invalidateQueries({ queryKey: ['routes', 'hazards'] })
      // Keep other route detail sections consistent.
      qc.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}

export function useSubmitHazardReport() {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      routeId: string
      hazardType: string
      severity: 'low' | 'medium' | 'high'
      title: string
      description?: string
      expiresAtIso: string
    }) =>
      migrationInvoke<HazardReportRow>(
        'routes',
        'submitHazardReport',
        {
          reported_by: user!.id,
          hazard_type: params.hazardType,
          severity: params.severity,
          title: params.title,
          description: params.description ?? null,
          expires_at: params.expiresAtIso,
          route_id: params.routeId,
        },
        accessToken!,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes', 'hazards'] })
      qc.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}

export function useLatestApproachVersion(areaId: string | undefined) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['routes', 'approach', 'latest', areaId],
    queryFn: async () =>
      migrationInvoke<ApproachGPXVersionRow[]>(
        'routes',
        'fetchLatestApproachVersion',
        { area_id: areaId! },
        accessToken!,
      ),
    enabled: !!accessToken && !!areaId,
  })
}

export function useSaveTopoLine() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      routeId: string
      imageUrl: string
      pathPoints: RouteTopoPoint[]
      color?: string
      label?: string | null
    }) =>
      migrationInvoke<RouteTopoLine>(
        'routes',
        'saveTopo',
        {
          route_id: params.routeId,
          image_url: params.imageUrl,
          path_points: params.pathPoints,
          color: params.color,
          label: params.label ?? null,
        },
        accessToken!,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes', 'topo'] })
    },
  })
}

export function useUpdateTopoLine() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      lineId: string
      imageUrl: string
      pathPoints: RouteTopoPoint[]
      color?: string
      label?: string | null
      routeIdToInvalidate?: string
    }) =>
      migrationInvoke<RouteTopoLine>(
        'routes',
        'updateTopoLine',
        {
          line_id: params.lineId,
          image_url: params.imageUrl,
          path_points: params.pathPoints,
          color: params.color,
          label: params.label ?? null,
        },
        accessToken!,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes', 'topo'] })
    },
  })
}

export function useDeleteTopoLine() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { lineId: string }) =>
      migrationInvoke('routes', 'deleteTopoLine', { line_id: params.lineId }, accessToken!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes', 'topo'] })
    },
  })
}

export function useRecordApproachGPXVersion() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      areaId: string
      storagePath: string
      supersedesId?: string | null
      notes?: string | null
    }) =>
      migrationInvoke<ApproachGPXVersionRow>(
        'routes',
        'recordApproachGPXVersion',
        {
          id: params.id,
          area_id: params.areaId,
          storage_path: params.storagePath,
          supersedes_id: params.supersedesId ?? null,
          notes: params.notes ?? null,
        },
        accessToken!,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes', 'approach'] })
    },
  })
}

export function useUpdateRoute() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      name?: string
      grade?: string
      description?: string
      lengthMeters?: number
      styleTags?: string[]
    }) =>
      migrationInvoke<ApiRoute>(
        'routes',
        'updateRoute',
        {
          id: params.id,
          name: params.name,
          grade: params.grade,
          description: params.description,
          length_meters: params.lengthMeters,
          style_tags: params.styleTags,
        },
        accessToken!,
      ),
    onSuccess: (_route, vars) => {
      qc.invalidateQueries({ queryKey: ['catalog', 'route', vars.id] })
    },
  })
}

const STEEPNESS_ANGLES = ['slab', 'vertical', 'overhung', 'roof', 'tufa', 'mixed'] as const
export type SteepnessAngle = (typeof STEEPNESS_ANGLES)[number]
export { STEEPNESS_ANGLES }

type WishlistRouteIdsPayload = { route_ids: string[] }

export function useWishlistRouteIds() {
  const { accessToken, user } = useAuth()
  return useQuery({
    queryKey: ['routes', 'wishlist', user?.id],
    queryFn: async () => {
      const payload = await migrationInvoke<WishlistRouteIdsPayload>(
        'routes',
        'fetchMyWishlistRouteIds',
        { user_id: user!.id },
        accessToken!,
      )
      const raw = payload.route_ids ?? (payload as { routeIds?: string[] }).routeIds ?? []
      return raw.map(normalizeRouteId)
    },
    enabled: !!accessToken && !!user?.id,
    staleTime: 0,
  })
}

/** Wishlist route rows for sidebar (name + grade), preserving save order. */
export function useWishlistRoutes() {
  const { accessToken, user } = useAuth()
  const idsQ = useWishlistRouteIds()
  const ids = idsQ.data ?? []
  return useQuery({
    queryKey: ['routes', 'wishlist', 'routes', user?.id, ids.join(',')],
    queryFn: async () => {
      if (ids.length === 0) return [] as ApiRoute[]
      const rows = await migrationInvoke<ApiRoute[]>(
        'routes',
        'fetchRoutesByIds',
        { ids },
        accessToken!,
      )
      const byId = new Map(rows.map((r) => [normalizeRouteId(r.id), r]))
      return ids.map((id) => byId.get(id)).filter((r): r is ApiRoute => !!r)
    },
    enabled: !!accessToken && !!user?.id && idsQ.isFetched,
    staleTime: 30_000,
  })
}

export function useToggleWishlist() {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  const wishlistKey = ['routes', 'wishlist', user?.id] as const
  return useMutation({
    mutationFn: async ({
      routeId,
      save,
    }: {
      routeId: string
      save: boolean
    }) => {
      if (!accessToken || !user?.id) {
        throw new Error('Sign in to update your wishlist.')
      }
      const id = parseRouteId(routeId)
      if (!id) {
        throw new Error('Invalid route id.')
      }
      const op = save ? 'saveRouteToWishlist' : 'unsaveRouteFromWishlist'
      await migrationInvoke(
        'routes',
        op,
        { user_id: user.id, route_id: id },
        accessToken,
      )
      return { routeId: id, save }
    },
    onMutate: async ({ routeId, save }) => {
      await qc.cancelQueries({ queryKey: [...wishlistKey] })
      const prev = qc.getQueryData<string[]>([...wishlistKey])
      const id = normalizeRouteId(routeId)
      qc.setQueryData<string[]>([...wishlistKey], (old) => {
        const next = new Set(old ?? [])
        if (save) next.add(id)
        else next.delete(id)
        return [...next]
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData([...wishlistKey], ctx.prev)
      }
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: [...wishlistKey] })
      await qc.invalidateQueries({ queryKey: ['routes', 'wishlist', 'routes'] })
    },
  })
}

export function useUpsertSteepnessVote() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { route_id: string; angle: string }) =>
      migrationInvoke('routes', 'upsertVote', params, accessToken!),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['routes', 'consensus', vars.route_id] })
    },
  })
}

export function useMarkNotificationRead() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      migrationInvoke('notifications', 'markRead', { notification_id: notificationId }, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllNotificationsRead() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => migrationInvoke('notifications', 'markAllRead', {}, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useUpdateProfile() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => patchProfile(accessToken!, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function useUpdateLog() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      migrationInvoke<ClimbLogRow>('climbs', 'updateLog', params, accessToken!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['climbs'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeleteLog() {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => migrationInvoke('climbs', 'deleteLog', { id }, accessToken!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['climbs'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
