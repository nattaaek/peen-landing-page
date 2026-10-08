export const CT_CLASSICS_CHALLENGE_ID = 'b2c3d4e5-0001-4000-8000-000000000001'

export interface InvitationLink {
  readonly challengeId: string
  readonly code: string
}

const invitationPattern = /^https:\/\/peen\.app\/app\/invite\/(ct-classics-2026|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})#code=([^&#]+)(?![\s\S])/
const suffixPattern = /^[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}$/

export function parseInvitationLink(raw: string): InvitationLink | null {
  if (raw.includes('?') || raw.includes('\\')) return null
  const match = invitationPattern.exec(raw)
  if (!match) return null

  let code: string
  try {
    code = decodeURIComponent(match[2]).trim()
  } catch {
    return null
  }

  const characters = Array.from(code)
  if (characters.length < 1 || characters.length > 256) return null
  if (characters.some(character => {
    const value = character.charCodeAt(0)
    return value <= 31 || value === 127
      || (character.length === 1 && value >= 0xD800 && value <= 0xDFFF)
  })) return null

  return {
    challengeId: match[1] === 'ct-classics-2026'
      ? CT_CLASSICS_CHALLENGE_ID
      : match[1].toLowerCase(),
    code,
  }
}

export function normalizeInvitationCode(challengeId: string, raw: string): string {
  const code = raw.trim()
  return challengeId === CT_CLASSICS_CHALLENGE_ID && suffixPattern.test(code)
    ? `PODA-${code}`
    : code
}
