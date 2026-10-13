const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/

export type ChallengeProfile = { user_id?: string | null; nickname?: string | null }

/**
 * Player-facing name for the signed-in account on challenge screens, or null when none is safe to show.
 * The profile query is not keyed by account, so a profile belonging to another account is ignored.
 */
export function challengeNickname(accountId: string | null | undefined, profile: ChallengeProfile | null | undefined): string | null {
  if (!accountId || !profile || profile.user_id !== accountId) return null
  const nickname = profile.nickname?.trim()
  if (!nickname || UUID.test(nickname) || EMAIL.test(nickname)) return null
  return nickname
}

export function challengeAccountLine(nickname: string | null): string {
  return nickname ? `Signed in as ${nickname}` : 'Signed in'
}

export function challengeJoiningName(nickname: string | null): string {
  return nickname ?? 'Climber'
}
