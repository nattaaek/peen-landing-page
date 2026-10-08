import {
  CT_CLASSICS_CHALLENGE_ID, parseInvitationLink,
  type InvitationLink,
} from './invitationLink.ts'
import {
  INVITATION_TTL_MS, PendingInvitation,
  type InvitationJoinToken,
} from './pendingInvitation.ts'

export const INVITATION_SESSION_KEY = 'peen.pending-invitation.v1'
declare const routeLeaseBrand: unique symbol
export type RouteLease = { readonly [routeLeaseBrand]: true }
type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
interface RecoveryRecord extends InvitationLink {
  version: 1
  createdAt: number
  accountId: string | null
}
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?![\s\S])/

function readRecord(raw: string, now: number): RecoveryRecord | null {
  if (raw.length > 8192 || !Number.isFinite(now)) return null
  let value: unknown
  try { value = JSON.parse(raw) } catch { return null }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const { version, challengeId, code, createdAt, accountId } = record
  if (version !== 1 || typeof challengeId !== 'string' ||
      !uuidPattern.test(challengeId) || typeof code !== 'string' ||
      code !== code.trim()) return null
  const characters = Array.from(code)
  if (characters.length < 1 || characters.length > 256 ||
      characters.some(character => {
        const value = character.charCodeAt(0)
        return value <= 31 || value === 127
      })) return null
  if (accountId !== null && (typeof accountId !== 'string' ||
      accountId.length === 0 || accountId.length > 128)) return null
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt) ||
      createdAt > now || now - createdAt >= INVITATION_TTL_MS) return null
  return { version: 1, challengeId: challengeId.toLowerCase(), code, createdAt, accountId }
}

export class InvitationSession {
  #storage: SessionStorage | null
  #now: () => number
  #holder = new PendingInvitation()
  #owner: string | null = null
  #createdAt: number | null = null
  #observedAccount: string | null | undefined = undefined
  #revision = 0
  #listeners = new Set<() => void>()
  #hasContext = false
  #projection: InvitationLink | null = null
  #notifying = false
  #route: RouteLease | null = null

  subscribe(callback: () => void): () => void {
    this.#listeners.add(callback)
    return () => { this.#listeners.delete(callback) }
  }

  revision(): number { return this.#revision }

  accountId(): string | null | undefined { return this.#observedAccount }

  peek(): InvitationLink | null {
    return this.#projection === null ? null : { ...this.#projection }
  }

  #publish(): void {
    this.#revision++
    if (this.#notifying) return
    this.#notifying = true
    try {
      // Nested changes commit immediately; each listener runs at most once per delivery.
      for (const callback of [...this.#listeners]) {
        if (!this.#listeners.has(callback)) continue
        try { callback() } catch { /* Listener failure cannot interrupt session state. */ }
      }
    } finally { this.#notifying = false }
  }

  constructor(storage: SessionStorage | null, now: () => number) {
    this.#storage = storage
    this.#now = now
    let raw: string | null = null
    try { raw = storage?.getItem(INVITATION_SESSION_KEY) ?? null } catch {
      // Unavailable storage leaves an empty, usable memory holder.
    }
    if (raw === null) return
    const time = now()
    const record = readRecord(raw, time)
    if (record !== null &&
        this.#holder.replace(record, record.accountId, record.createdAt)) {
      this.#owner = record.accountId
      this.#createdAt = record.createdAt
    }
    this.#sync(time)
  }

  #remove(): void {
    try { this.#storage?.removeItem(INVITATION_SESSION_KEY) } catch {
      try { this.#storage?.setItem(INVITATION_SESSION_KEY, 'null') } catch {
        // If both operations fail, physical deletion cannot be guaranteed.
      }
    }
  }

  #sync(time: number, accountId?: string | null, changed = false): InvitationLink | null {
    const invitation = this.#holder.current(time)
    changed = changed || this.#hasContext !== (invitation !== null)
    this.#hasContext = invitation !== null
    this.#projection = invitation === null ? null : { ...invitation }
    if (invitation === null) {
      this.#owner = null
      this.#createdAt = null
      this.#remove()
      if (changed) this.#publish()
      return null
    }
    if (accountId !== undefined) this.#owner = accountId
    try {
      this.#storage?.setItem(INVITATION_SESSION_KEY, JSON.stringify({
        version: 1,
        challengeId: invitation.challengeId,
        code: invitation.code,
        createdAt: this.#createdAt,
        accountId: this.#owner,
      }))
    } catch {
      // The holder retains its original bounded lifetime on write failure.
    }
    if (changed) this.#publish()
    return invitation
  }

  capture(raw: string, accountId: string | null): boolean {
    const time = this.#now()
    const invitation = parseInvitationLink(raw)
    if (invitation === null) {
      this.#sync(time)
      return false
    }
    const previous = this.#holder.current(time)
    const same = previous !== null &&
      previous.challengeId === invitation.challengeId &&
      previous.code === invitation.code &&
      (this.#owner === null || this.#owner === accountId)
    const accepted = this.#holder.replace(invitation, accountId, time)
    if (accepted) {
      if (!same) this.#createdAt = time
      this.#owner = accountId
    }
    this.#sync(time, undefined, accepted && !same)
    return accepted
  }

  current(): InvitationLink | null {
    return this.#sync(this.#now())
  }

  observeAccount(accountId: string | null): void {
    const time = this.#now()
    const changed = this.#observedAccount !== accountId
    this.#observedAccount = accountId
    this.#holder.observeAccount(accountId, time)
    this.#sync(time, accountId, changed)
  }

  beginJoin(accountId: string | null): InvitationJoinToken | null {
    const time = this.#now()
    const token = this.#holder.beginJoin(accountId, time)
    this.#sync(time, accountId)
    return token
  }

  accepts(token: InvitationJoinToken, accountId: string | null): boolean {
    const time = this.#now()
    const accepted = this.#holder.accepts(token, accountId, time)
    this.#sync(time, accountId)
    return accepted
  }

  finishJoin(
    token: InvitationJoinToken,
    accountId: string | null,
    succeeded: boolean,
  ): boolean {
    const time = this.#now()
    const accepted = this.#holder.finishJoin(token, accountId, time, succeeded)
    this.#sync(time, accountId)
    return accepted
  }

  clear(): void {
    this.#holder.clear()
    this.#sync(this.#now())
  }

  claimRoute(): RouteLease {
    const lease = Object.freeze({}) as RouteLease
    this.#route = lease
    return lease
  }

  ownsRoute(lease: RouteLease): boolean { return this.#route === lease }

  releaseRoute(lease: RouteLease): boolean {
    if (this.#route !== lease) return false
    // Released before clearing so observers notified by clear() may claim a successor.
    this.#route = null
    this.clear()
    // A successor claimed during clear() owns the route, so the departing caller must not act.
    return this.#route === null
  }

  returnPath(): string {
    const invitation = this.current()
    if (invitation === null) return '/app/'
    const target = invitation.challengeId === CT_CLASSICS_CHALLENGE_ID
      ? 'ct-classics-2026' : invitation.challengeId
    return `/app/invite/${target}`
  }
}
