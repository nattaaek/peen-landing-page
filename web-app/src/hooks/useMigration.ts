import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { migrationInvoke } from '../lib/peen-api/migration'
import {
  fetchMyProfile,
  fetchProfileIdentities,
  patchProfile,
} from '../lib/peen-api/profiles'
import type {
  AngleConsensus,
  ClimbComment,
  ClimbLogRow,
  FeedClimbRow,
  FeedReactionCountRow,
  InboxNotification,
  PartnerPost,
  PublicFeedPayload,
  RouteRatingSummary,
} from '../types/api'
import { useAuth } from '../features/auth/AuthProvider'

export function useMyProfile() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => fetchMyProfile(accessToken!),
    enabled: !!accessToken,
  })
}

export const FEED_PAGE_SIZE = 20

export type FeedPageCursor = { created_at: string; id: string }

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
      .filter(([, url]) => url.startsWith('http')),
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
    queryKey: ['feed', 'public', 'infinite', user?.id],
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
    queryFn: () =>
      migrationInvoke<InboxNotification[]>('notifications', 'loadInbox', { limit: 40 }, accessToken!),
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
      migrationInvoke<unknown[]>('community', 'community_fetch_sends_leaderboard', {}, accessToken!),
    enabled: !!accessToken,
  })
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'likeClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useUnlikeClimb() {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'unlikeClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useSendItClimb() {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'sendItClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useUnsendItClimb() {
  const { accessToken, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'unsendItClimb', {
        climb_id: climbId,
        user_id: user!.id,
      }, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useComments(climbId: string | undefined) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['social', 'comments', climbId],
    queryFn: () =>
      migrationInvoke<ClimbComment[]>('social', 'fetchComments', { climb_id: climbId! }, accessToken!),
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
      qc.invalidateQueries({ queryKey: ['feed'] })
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

const STEEPNESS_ANGLES = ['slab', 'vertical', 'overhung', 'roof', 'tufa', 'mixed'] as const
export type SteepnessAngle = (typeof STEEPNESS_ANGLES)[number]
export { STEEPNESS_ANGLES }

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
