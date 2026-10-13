import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../features/auth/AuthProvider'
import { PeenAPIError } from '../lib/peen-api/client'
import { fetchGymCrewSummary } from '../lib/peen-api/gyms'
import {
  GymWriteAcknowledgedError,
  GymWriteBusyError,
  GymWriteController,
  GymWriteStaleError,
  GymWriteUnreadableError,
  resolveGymEditCapability,
  type CrewSummaryState,
  type GymEditCapability,
  type GymWriteScope,
} from '../lib/gymWriteController'
import type { ApiGym } from '../types/api'

export const CATALOG_GYMS_KEY = ['catalog', 'gyms'] as const

export function useGymEditCapability(gym: ApiGym | null): { capability: GymEditCapability; retry: () => void } {
  const { user, accessToken, loading } = useAuth()
  const viewerId = !loading && accessToken ? (user?.id ?? null) : null
  const gymId = gym?.id ?? null
  const needsCrew = !!gymId && !!viewerId && gym?.created_by !== viewerId
  const query = useQuery({
    queryKey: ['place-crew', 'summary', 'gym', gymId, viewerId] as const,
    queryFn: () => fetchGymCrewSummary(gymId!, accessToken!),
    enabled: needsCrew,
    retry: false,
    staleTime: 30_000,
  })
  const crew: CrewSummaryState = query.isError
    ? { status: 'error' }
    : query.isSuccess
      ? { status: 'success', summary: query.data }
      : { status: 'pending' }
  const capability = gym ? resolveGymEditCapability(viewerId, gym, crew) : ({ kind: 'denied' } as const)
  const { refetch } = query
  return { capability, retry: useCallback(() => void refetch(), [refetch]) }
}

function saveErrorMessage(error: unknown): string {
  if (error instanceof PeenAPIError) {
    if (error.status === 501 || /op not implemented/i.test(error.message)) {
      return "This server can't save posted visit info yet. Nothing was saved and your entries are kept."
    }
    if (error.status === 401) return 'Your session expired. Sign in again, then retry. Your entries are kept.'
    return `Couldn't save: ${error.message}`
  }
  if (error instanceof TypeError) return "Couldn't reach Peen. Check your connection and try again."
  return error instanceof Error ? error.message : "Couldn't save. Try again."
}

const ACKNOWLEDGED_WITH_ID =
  "Peen accepted this save, but its reply couldn't be read. Saving again is turned off so nothing is duplicated. Check the gym list to load what was saved."
const ACKNOWLEDGED_WITHOUT_ID =
  "Peen accepted this save, but its reply couldn't be read, so this sheet can't tell which gym was saved. Saving again is turned off so nothing is duplicated. Check the gym list, then close this sheet and look for the gym in Crags before adding it again."
const RECONCILE_NOT_FOUND =
  "The refreshed gym list doesn't show the saved gym yet. Check again in a moment. Saving again stays off so nothing is duplicated."
const RECONCILE_NO_ID =
  'The gym list is refreshed. Close this sheet and look for the gym in Crags before adding it again. Saving again stays off so nothing is duplicated.'
const RECONCILE_FAILED =
  "Couldn't refresh the gym list. Check your connection, then check again. Saving again stays off so nothing is duplicated."

/** `acknowledged`: the server accepted a write whose reply did not decode. Only a read can resolve it. */
export type GymSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'failed'; message: string }
  | { status: 'acknowledged'; serverId: string | null; checking: boolean; message: string }

function scopeBox() {
  let current: GymWriteScope | null = null
  return {
    controller: new GymWriteController(() => current),
    setScope: (next: GymWriteScope | null) => {
      current = next
    },
  }
}

/**
 * One guarded write session per mounted sheet. Unmount or an account switch cancels it, so a
 * late completion never touches this sheet's state or callbacks. Successful saves refetch the
 * public gym catalog before resolving, so callers show the persisted row, not the request.
 * An acknowledged-but-unreadable write blocks further saves; `reconcile` only reads the catalog.
 */
export function useGymWriteSession() {
  const { user, accessToken, loading } = useAuth()
  const accountId = user?.id ?? null
  const qc = useQueryClient()
  const [{ controller, setScope }] = useState(scopeBox)
  useLayoutEffect(() => {
    setScope(accountId && accessToken && !loading ? { accountId, accessToken } : null)
  }, [setScope, accountId, accessToken, loading])
  useEffect(() => () => controller.cancel(), [controller, accountId])

  const [state, setState] = useState<GymSaveState>({ status: 'idle' })

  const save = useCallback(
    async (write: (scope: GymWriteScope) => Promise<ApiGym>): Promise<ApiGym | null> => {
      if (controller.busy || controller.acknowledged) return null
      setState({ status: 'saving' })
      try {
        const gym = await controller.run(async (current, isCurrent) => {
          const saved = await write(current)
          if (isCurrent()) await qc.invalidateQueries({ queryKey: CATALOG_GYMS_KEY })
          return saved
        })
        setState({ status: 'idle' })
        return gym
      } catch (e) {
        if (e instanceof GymWriteStaleError || e instanceof GymWriteBusyError || e instanceof GymWriteAcknowledgedError) {
          return null
        }
        if (e instanceof GymWriteUnreadableError) {
          setState({
            status: 'acknowledged',
            serverId: e.serverId,
            checking: false,
            message: e.serverId ? ACKNOWLEDGED_WITH_ID : ACKNOWLEDGED_WITHOUT_ID,
          })
          return null
        }
        setState({ status: 'failed', message: saveErrorMessage(e) })
        return null
      }
    },
    [controller, qc],
  )

  const reconcile = useCallback(async (): Promise<ApiGym | null> => {
    const ack = controller.acknowledged
    if (!ack || controller.busy) return null
    const acknowledged = (checking: boolean, message: string): GymSaveState =>
      ({ status: 'acknowledged', serverId: ack.serverId, checking, message })
    setState((s) => (s.status === 'acknowledged' ? { ...s, checking: true } : s))
    try {
      const gym = await controller.reconcile(async (found, _scope, isCurrent) => {
        await qc.invalidateQueries({ queryKey: CATALOG_GYMS_KEY, refetchType: 'all' }, { throwOnError: true })
        if (!isCurrent() || !found.serverId) return null
        const id = found.serverId.toLowerCase()
        return qc.getQueryData<ApiGym[]>(CATALOG_GYMS_KEY)?.find((g) => g.id.toLowerCase() === id) ?? null
      })
      setState(gym ? { status: 'idle' } : acknowledged(false, ack.serverId ? RECONCILE_NOT_FOUND : RECONCILE_NO_ID))
      return gym
    } catch (e) {
      if (e instanceof GymWriteStaleError || e instanceof GymWriteBusyError) return null
      setState(acknowledged(false, RECONCILE_FAILED))
      return null
    }
  }, [controller, qc])

  const pending = state.status === 'saving'
  const error = state.status === 'failed' ? state.message : null
  const acknowledged = state.status === 'acknowledged' ? state : null
  return { save, reconcile, pending, error, acknowledged }
}
