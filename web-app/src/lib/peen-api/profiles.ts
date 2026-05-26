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

export interface UserProfileIdentity {
  user_id: string
  username: string
  nickname: string
}

/** Batch display handles (same as iOS ProfileService.fetchIdentities). */
export async function fetchProfileIdentities(
  accessToken: string,
  userIds: string[],
): Promise<UserProfileIdentity[]> {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (unique.length === 0) return []
  return apiJson<UserProfileIdentity[]>('/v1/profiles/identities', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ user_ids: unique }),
  })
}

export function profileDisplayName(identity: {
  nickname?: string | null
  username?: string | null
}): string {
  const nick = identity.nickname?.trim()
  if (nick) return nick
  const user = identity.username?.trim()
  if (user) return user
  return 'Climber'
}

/** `@username` for feed headers (design: "Praew @praew"). */
export function profileHandle(identity: { username?: string | null }): string {
  const user = identity.username?.trim()
  return user ? `@${user}` : ''
}
