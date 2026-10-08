import type { InvitationLink } from './invitationLink.ts'

export const INVITATION_TTL_MS = 900_000

export interface InvitationJoinToken {
  readonly generation: number
  readonly accountId: string
  readonly challengeId: string
}

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?![\s\S])/

function copyInvitation(value: InvitationLink): InvitationLink | null {
  if (typeof value !== 'object' || value === null) return null
  const { challengeId, code: rawCode } = value
  if (typeof challengeId !== 'string' || !uuidPattern.test(challengeId)) return null
  if (typeof rawCode !== 'string') return null
  const code = rawCode.trim()
  const characters = Array.from(code)
  if (characters.length < 1 || characters.length > 256) return null
  if (characters.some(character => {
    const value = character.charCodeAt(0)
    return value <= 31 || value === 127
  })) return null
  return { challengeId, code }
}

export class PendingInvitation {
  #invitation: InvitationLink | null = null
  #accountId: string | null = null
  #createdAt: number | null = null
  #lastObservedAt: number | null = null
  #generation = 0
  #activeToken: InvitationJoinToken | null = null

  #checkClock(now: number): boolean {
    if (!Number.isFinite(now) ||
        (this.#lastObservedAt !== null && now < this.#lastObservedAt)) {
      this.clear()
      return false
    }
    if (this.#invitation !== null) {
      this.#lastObservedAt = now
      if (this.#createdAt !== null && now - this.#createdAt >= INVITATION_TTL_MS) {
        this.clear()
      }
    }
    return true
  }

  #observeAccount(accountId: string | null): void {
    if (this.#invitation === null) return
    if (this.#accountId === null) {
      this.#accountId = accountId
    } else if (this.#accountId !== accountId) {
      this.clear()
    }
  }

  replace(invitation: InvitationLink, accountId: string | null, now: number): boolean {
    if (!this.#checkClock(now) || this.#activeToken !== null) return false
    const copy = copyInvitation(invitation)
    if (copy === null) return false
    this.#observeAccount(accountId)
    if (this.#invitation !== null &&
        this.#invitation.challengeId === copy.challengeId &&
        this.#invitation.code === copy.code) return true

    this.clear()
    this.#invitation = copy
    this.#accountId = accountId
    this.#createdAt = now
    this.#lastObservedAt = now
    return true
  }

  current(now: number): InvitationLink | null {
    if (!this.#checkClock(now) || this.#invitation === null) return null
    return { ...this.#invitation }
  }

  observeAccount(accountId: string | null, now: number): void {
    if (this.#checkClock(now)) this.#observeAccount(accountId)
  }

  beginJoin(accountId: string | null, now: number): InvitationJoinToken | null {
    if (!this.#checkClock(now)) return null
    this.#observeAccount(accountId)
    if (this.#invitation === null || this.#activeToken !== null || accountId === null) {
      return null
    }
    const token: InvitationJoinToken = Object.freeze({
      generation: this.#generation,
      accountId,
      challengeId: this.#invitation.challengeId,
    })
    this.#activeToken = token
    return token
  }

  accepts(token: InvitationJoinToken, accountId: string | null, now: number): boolean {
    if (!this.#checkClock(now)) return false
    this.#observeAccount(accountId)
    return this.#invitation !== null &&
      this.#activeToken !== null && token === this.#activeToken &&
      accountId !== null && accountId === this.#accountId &&
      token.accountId === accountId && token.generation === this.#generation &&
      token.challengeId === this.#invitation.challengeId
  }

  finishJoin(
    token: InvitationJoinToken,
    accountId: string | null,
    now: number,
    succeeded: boolean,
  ): boolean {
    if (!this.accepts(token, accountId, now)) return false
    if (succeeded) this.clear()
    else this.#activeToken = null
    return true
  }

  clear(): void {
    this.#generation++
    this.#invitation = null
    this.#accountId = null
    this.#createdAt = null
    this.#lastObservedAt = null
    this.#activeToken = null
  }
}
