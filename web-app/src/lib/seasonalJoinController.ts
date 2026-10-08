import { normalizeInvitationCode } from './invitationLink.ts'
import { invitationErrorMessage, submitSeasonalInvitation } from './seasonalInvitation.ts'
export type SeasonalJoinAuthority = Readonly<{accountId: string | null | undefined; revision: number}>
export type SeasonalJoinSession = Readonly<{userId: string; accessToken: string}>
export type SeasonalJoinReceipt = Readonly<{isCurrent: () => boolean}>
const genericFailure = 'Could not join. Try again.'
const categories = new Set([
  'invitation_required', 'invitation_invalid', 'invitation_used',
  'invitation_rate_limited', 'challenge_closed',
])
function classifyFailure(error: unknown): string {
  return error instanceof Error && categories.has(error.message)
    ? invitationErrorMessage(new Error(error.message)) : genericFailure
}
function validCode(code: string): boolean {
  const characters = Array.from(code)
  return characters.length <= 256 && !characters.some(character => {
    const value = character.codePointAt(0)!
    return value <= 31 || value === 127 || (value >= 0xd800 && value <= 0xdfff)
  })
}
export class SeasonalJoinController {
  #readAuthority: () => SeasonalJoinAuthority
  #resolveSession: () => Promise<SeasonalJoinSession | null>
  #invoke: (params: {challenge_id: string; invitation_code: string}, accessToken: string) => Promise<unknown>
  #generation = 0
  #busy: number | null = null
  constructor(
    readAuthority: () => SeasonalJoinAuthority,
    resolveSession: () => Promise<SeasonalJoinSession | null>,
    invoke: (params: {challenge_id: string; invitation_code: string}, accessToken: string) => Promise<unknown>,
  ) {
    this.#readAuthority = readAuthority
    this.#resolveSession = resolveSession
    this.#invoke = invoke
  }
  cancel(): void { this.#generation++; this.#busy = null }
  #current(generation: number, origin: SeasonalJoinAuthority): boolean {
    const current = this.#readAuthority()
    return generation === this.#generation && current.accountId === origin.accountId &&
      current.revision === origin.revision
  }
  #requireCurrent(generation: number, origin: SeasonalJoinAuthority): void {
    if (!this.#current(generation, origin)) throw new Error(genericFailure)
  }
  #receipt(generation: number, origin: SeasonalJoinAuthority): SeasonalJoinReceipt {
    return Object.freeze({isCurrent: () => this.#current(generation, origin)})
  }
  async submit(challengeId: string, readCode: () => string, origin: SeasonalJoinAuthority): Promise<SeasonalJoinReceipt> {
    if (this.#busy !== null) throw new Error(genericFailure)
    const owner = Object.freeze({accountId: origin.accountId, revision: origin.revision})
    const generation = ++this.#generation
    this.#busy = generation
    let failure: string | undefined
    try {
      this.#requireCurrent(generation, owner)
      if (!owner.accountId) throw new Error(genericFailure)
      const code = normalizeInvitationCode(challengeId, readCode())
      this.#requireCurrent(generation, owner)
      if (!validCode(code)) throw new Error(genericFailure)
      const session = await this.#resolveSession()
      this.#requireCurrent(generation, owner)
      if (!session || session.userId !== owner.accountId || !session.accessToken) {
        throw new Error(genericFailure)
      }
      const accessToken = session.accessToken
      await submitSeasonalInvitation(params => {
        this.#requireCurrent(generation, owner)
        return this.#invoke(params, accessToken)
      }, challengeId, code)
      this.#requireCurrent(generation, owner)
    } catch (error) {
      failure = this.#current(generation, owner) ? classifyFailure(error) : genericFailure
    } finally {
      if (this.#busy === generation) this.#busy = null
    }
    if (failure !== undefined) throw new Error(failure)
    return this.#receipt(generation, owner)
  }
}
