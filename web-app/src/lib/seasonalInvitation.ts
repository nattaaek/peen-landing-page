export function invitationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('invitation_required')) return 'Enter an invitation code for this season.'
  if (message.includes('invitation_invalid')) return 'This code is invalid or expired.'
  if (message.includes('invitation_used')) return 'This code has already been used.'
  if (message.includes('invitation_rate_limited')) return 'Too many attempts. Try again in 15 minutes.'
  if (message.includes('challenge_closed')) return 'Registration is closed for this season.'
  return 'Could not join. Try again.'
}

export function invitationFormKey(challengeId: string, accountId: string | undefined, enrolled: boolean): string {
  return `${challengeId}:${accountId ?? 'guest'}:${enrolled}`
}
export async function submitSeasonalInvitation<T>(invoke: (params: {challenge_id: string; invitation_code: string}) => Promise<T>, challengeId: string, code: string): Promise<T> {
  return invoke({challenge_id: challengeId, invitation_code: code.trim()})
}
