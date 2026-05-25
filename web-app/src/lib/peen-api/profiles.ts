import { apiJson } from './client'
import type { UserProfile } from '../../types/api'

export async function fetchMyProfile(accessToken: string): Promise<UserProfile> {
  return apiJson<UserProfile>('/v1/profiles/me', { accessToken })
}

export async function patchProfile(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<UserProfile> {
  return apiJson<UserProfile>('/v1/profiles/me', {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(body),
  })
}

export async function searchProfiles(
  accessToken: string,
  prefix: string,
  limit = 8,
): Promise<{ user_id: string; nickname?: string; username?: string }[]> {
  const q = new URLSearchParams({ prefix, limit: String(limit) })
  return apiJson(`/v1/profiles/search?${q}`, { accessToken })
}
