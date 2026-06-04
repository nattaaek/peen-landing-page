import { apiJson } from './client'
import type { InstagramFeaturedMedia } from '../../types/api'

export async function fetchInstagramFeaturedReels(
  accessToken: string,
  limit = 20,
): Promise<InstagramFeaturedMedia[]> {
  const capped = Math.min(Math.max(limit, 1), 50)
  const q = new URLSearchParams({ limit: String(capped) })
  return apiJson<InstagramFeaturedMedia[]>(`/v1/social/instagram/reels?${q}`, { accessToken })
}

export async function fetchFeaturedAchievementIds(
  accessToken: string,
  userIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const res = await apiJson<{ featured: Record<string, string> }>(
    '/v1/profiles/featured-achievement-ids',
    {
      method: 'POST',
      accessToken,
      body: JSON.stringify({ user_ids: unique }),
    },
  )
  return new Map(Object.entries(res.featured ?? {}))
}
