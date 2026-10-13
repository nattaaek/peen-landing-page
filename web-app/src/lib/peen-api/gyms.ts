import { migrationInvoke } from './migration'
import { parsePlaceCrewSummary, type GymWriter, type PlaceCrewSummaryView } from '../gymWriteController'

/** `POST /v1/migration/routes`. Each call is one request; the client never retries a gym write. */
export const httpGymWriter: GymWriter = {
  createGym: (params, accessToken) => migrationInvoke<unknown>('routes', 'createGym', { ...params }, accessToken),
  createGymWithVisitInfo: (params, accessToken) =>
    migrationInvoke<unknown>('routes', 'createGymWithVisitInfo', { ...params }, accessToken),
  updateGymVisitInfo: (params, accessToken) =>
    migrationInvoke<unknown>('routes', 'updateGymVisitInfo', { ...params }, accessToken),
}

export class PlaceCrewSummaryUnreadableError extends Error {
  constructor() {
    super('Could not check who can edit this gym.')
    this.name = 'PlaceCrewSummaryUnreadableError'
  }
}

export async function fetchGymCrewSummary(gymId: string, accessToken: string): Promise<PlaceCrewSummaryView> {
  const raw = await migrationInvoke<unknown>(
    'place-crew',
    'fetchPlaceCrewSummary',
    { place_kind: 'gym', place_id: gymId },
    accessToken,
  )
  const summary = parsePlaceCrewSummary(raw, gymId)
  if (!summary) throw new PlaceCrewSummaryUnreadableError()
  return summary
}
