import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { migrationInvoke } from '../lib/peen-api/migration'
import { fetchMyProfile } from '../lib/peen-api/profiles'
import type { ClimbLogRow, FeedClimbRow, InboxNotification, PartnerPost } from '../types/api'
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
    queryFn: () =>
      migrationInvoke<FeedClimbRow[]>('social', 'loadPublicFeed', { limit }, accessToken!),
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
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (climbId: string) =>
      migrationInvoke('social', 'likeClimb', { climb_id: climbId }, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
}
