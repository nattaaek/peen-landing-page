import { normalizeApiGym } from './gymVisitInfo.ts'
import type { GymCreatePlan, GymVisitUpdateParams } from './gymVisitInfo.ts'
import type { ApiGym } from '../types/api'

export interface GymWriteScope {
  accountId: string
  accessToken: string
}

/** Port for the three gym write ops. The adapter must issue exactly one request per call. */
export interface GymWriter {
  createGym(params: Extract<GymCreatePlan, { op: 'createGym' }>['params'], accessToken: string): Promise<unknown>
  createGymWithVisitInfo(
    params: Extract<GymCreatePlan, { op: 'createGymWithVisitInfo' }>['params'],
    accessToken: string,
  ): Promise<unknown>
  updateGymVisitInfo(params: GymVisitUpdateParams, accessToken: string): Promise<unknown>
}

export class GymWriteBusyError extends Error {
  constructor() {
    super('Already saving. Wait for the current save to finish.')
    this.name = 'GymWriteBusyError'
  }
}

/** The account changed, or the sheet was closed, before the write finished. Callers drop it silently. */
export class GymWriteStaleError extends Error {
  constructor() {
    super('This save no longer applies to the current account or screen.')
    this.name = 'GymWriteStaleError'
  }
}

/**
 * The writer resolved (HTTP success), so the server committed the write, but the body is not a
 * gym row. `serverId` is the row id when the body still carried one.
 */
export class GymWriteUnreadableError extends Error {
  readonly serverId: string | null

  constructor(serverId: string | null) {
    super('Saved, but the response could not be read.')
    this.name = 'GymWriteUnreadableError'
    this.serverId = serverId
  }
}

/** A write in this session was acknowledged but unreadable. Writing again could duplicate it. */
export class GymWriteAcknowledgedError extends Error {
  constructor() {
    super('The last save was accepted but not read back. Check the gym list before saving again.')
    this.name = 'GymWriteAcknowledgedError'
  }
}

export interface AcknowledgedGymWrite {
  serverId: string | null
}

function readGymResponse(raw: unknown, knownId: string | null): ApiGym {
  const gym = normalizeApiGym(raw)
  if (gym) return gym
  const bodyId = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as { id?: unknown }).id : null
  throw new GymWriteUnreadableError(
    knownId ?? (typeof bodyId === 'string' && bodyId.trim() ? bodyId : null),
  )
}

/** Calls exactly the planned op once. No fallback to `createGym` and no retry. */
export async function submitGymCreate(writer: GymWriter, plan: GymCreatePlan, accessToken: string): Promise<ApiGym> {
  const raw = plan.op === 'createGym'
    ? await writer.createGym(plan.params, accessToken)
    : await writer.createGymWithVisitInfo(plan.params, accessToken)
  return readGymResponse(raw, null)
}

export async function submitGymVisitUpdate(
  writer: GymWriter,
  params: GymVisitUpdateParams,
  accessToken: string,
): Promise<ApiGym> {
  return readGymResponse(await writer.updateGymVisitInfo(params, accessToken), params.id)
}

type GuardedWork<T> = (scope: GymWriteScope, isCurrent: () => boolean) => Promise<T>

/**
 * Single-flight write guard bound to one account. `cancel()` (close, unmount, account switch)
 * makes any in-flight result stale so it cannot reach the caller's state or callbacks.
 * A current write that ends in `GymWriteUnreadableError` locks further writes for that account
 * until `reconcile` finds the saved row with a read.
 */
export class GymWriteController {
  #readScope: () => GymWriteScope | null
  #generation = 0
  #inflight = false
  #acknowledged: (AcknowledgedGymWrite & { accountId: string }) | null = null

  constructor(readScope: () => GymWriteScope | null) {
    this.#readScope = readScope
  }

  get busy(): boolean {
    return this.#inflight
  }

  get acknowledged(): AcknowledgedGymWrite | null {
    const ack = this.#acknowledged
    return ack && ack.accountId === this.#readScope()?.accountId ? { serverId: ack.serverId } : null
  }

  cancel(): void {
    this.#generation += 1
    this.#inflight = false
  }

  run<T>(work: GuardedWork<T>): Promise<T> {
    return this.#guarded('write', work)
  }

  /**
   * Read-only recovery for an acknowledged write. `find` must not write. A found row clears the
   * lock; `null` (not found, or no server id to match) keeps it.
   */
  async reconcile(
    find: (ack: AcknowledgedGymWrite, scope: GymWriteScope, isCurrent: () => boolean) => Promise<ApiGym | null>,
  ): Promise<ApiGym | null> {
    const ack = this.acknowledged
    if (!ack) return null
    const gym = await this.#guarded('read', (scope, isCurrent) => find(ack, scope, isCurrent))
    if (gym) this.#acknowledged = null
    return gym
  }

  async #guarded<T>(mode: 'write' | 'read', work: GuardedWork<T>): Promise<T> {
    if (this.#inflight) throw new GymWriteBusyError()
    const scope = this.#readScope()
    if (!scope) throw new Error('Sign in to save gym info.')
    if (mode === 'write' && this.#acknowledged?.accountId === scope.accountId) throw new GymWriteAcknowledgedError()
    const generation = this.#generation
    const isCurrent = () =>
      generation === this.#generation && this.#readScope()?.accountId === scope.accountId
    this.#inflight = true
    try {
      const value = await work(scope, isCurrent)
      if (!isCurrent()) throw new GymWriteStaleError()
      return value
    } catch (error) {
      if (!isCurrent()) throw new GymWriteStaleError()
      if (mode === 'write' && error instanceof GymWriteUnreadableError) {
        this.#acknowledged = { accountId: scope.accountId, serverId: error.serverId }
      }
      throw error
    } finally {
      if (generation === this.#generation) this.#inflight = false
    }
  }
}

// ---- Edit capability ----

export interface PlaceCrewSummaryView {
  my_role: string | null
}

/** Parses `fetchPlaceCrewSummary`. A response for another place, or without `my_role`, is unusable (`null`). */
export function parsePlaceCrewSummary(raw: unknown, gymId: string): PlaceCrewSummaryView | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.place_kind !== 'gym' || typeof r.place_id !== 'string') return null
  if (r.place_id.toLowerCase() !== gymId.toLowerCase()) return null
  if (!('my_role' in r) || (r.my_role !== null && typeof r.my_role !== 'string')) return null
  return { my_role: r.my_role as string | null }
}

export type GymEditCapability =
  | { kind: 'guest' }
  | { kind: 'checking' }
  | { kind: 'allowed'; via: 'creator' | 'crew' }
  | { kind: 'denied' }
  | { kind: 'unavailable' }

export type CrewSummaryState =
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'success'; summary: PlaceCrewSummaryView | null }

const MANAGING_ROLES = new Set(['owner', 'moderator'])

/** Mirrors the server rule: gym creator, or place crew role owner/moderator (catalog owners get `owner`). */
export function resolveGymEditCapability(
  viewerId: string | null,
  gym: Pick<ApiGym, 'created_by'>,
  crew: CrewSummaryState,
): GymEditCapability {
  if (!viewerId) return { kind: 'guest' }
  if (gym.created_by && gym.created_by === viewerId) return { kind: 'allowed', via: 'creator' }
  if (crew.status === 'pending') return { kind: 'checking' }
  if (crew.status === 'error' || !crew.summary) return { kind: 'unavailable' }
  return crew.summary.my_role && MANAGING_ROLES.has(crew.summary.my_role)
    ? { kind: 'allowed', via: 'crew' }
    : { kind: 'denied' }
}
