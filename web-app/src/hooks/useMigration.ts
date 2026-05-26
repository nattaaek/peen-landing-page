import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  InboxNotification,
  PartnerPost,
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

export function usePublicFeed(limit = 30) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ['feed', 'public', limit],
    queryFn: async () => {
      const rows = await migrationInvoke<FeedClimbRow[]>(
        'social',
        'loadPublicFeed',
        { limit },
        accessToken!,
      )
      const userIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))]
      if (userIds.length === 0) return rows

      const [identities, avatarRows] = await Promise.all([
        fetchProfileIdentities(accessToken!, userIds),
        migrationInvoke<{ user_id: string; avatar_url?: string | null }[]>(
          'community',
          'fetchAvatarUrls',
          { user_ids: userIds },
          accessToken!,
        ),
      ])
      const byUserId = new Map(identities.map((i) => [i.user_id, i]))
      const avatarByUserId = new Map(
        avatarRows
          .map((r) => [r.user_id, r.avatar_url?.trim() ?? ''] as const)
          .filter(([, url]) => url.startsWith('http')),
      )

      return rows.map((row) => {
        const uid = row.user_id
        if (!uid) return row
        const identity = byUserId.get(uid)
        const avatarUrl = avatarByUserId.get(uid) ?? row.profile?.avatar_url
        if (!identity && !avatarUrl) return row
        return {
          ...row,
          profile: {
            id: uid,
            nickname: identity?.nickname,
            username: identity?.username,
            avatar_url: avatarUrl,
          },
        }
      })
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
