import { normalizeInvitationCode } from './invitationLink.ts'

export function invitationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message === 'invitation_required' || message === 'Enter an invitation code for this season.') return 'Enter an invitation code for this season.'
  if (message === 'invitation_invalid' || message === 'This code is invalid or expired.') return 'This code is invalid or expired.'
  if (message === 'invitation_used' || message === 'This code has already been used.') return 'This code has already been used.'
  if (message === 'invitation_rate_limited' || message === 'Too many attempts. Try again in 15 minutes.') return 'Too many attempts. Try again in 15 minutes.'
  if (message === 'challenge_closed' || message === 'Registration is closed for this season.') return 'Registration is closed for this season.'
  return 'Could not join. Try again.'
}

export function invitationFormKey(challengeId: string, accountId: string | undefined, enrolled: boolean): string {
  return `${challengeId}:${accountId ?? 'guest'}:${enrolled}`
}
export async function submitSeasonalInvitation<T>(invoke: (params: {challenge_id: string; invitation_code: string}) => Promise<T>, challengeId: string, code: string): Promise<T> {
  return invoke({challenge_id: challengeId, invitation_code: normalizeInvitationCode(challengeId, code)})
}
