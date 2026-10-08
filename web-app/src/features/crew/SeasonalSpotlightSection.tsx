import type { SeasonalSpotlight } from '../../types/seasonalChallenge'
import { seasonalSpotlightState } from '../../lib/seasonalSpotlightState'
import { SeasonalSpotlightCard } from './SeasonalSpotlightCard'

export function SeasonalSpotlightSection({ spotlight, isLoading, isError, onRetry, onOpen }: Readonly<{
  spotlight?: SeasonalSpotlight | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onOpen: (id: string) => void
}>) {
  const state = seasonalSpotlightState(Boolean(spotlight), isLoading, isError)
  if (state === 'error') return <div role="alert">
    <p>Could not load seasonal challenges. Please try again.</p>
    <button type="button" className="btn btn-secondary" onClick={onRetry}>Retry challenges</button>
  </div>
  if (state === 'loading') return <p className="muted">Loading challenge…</p>
  if (spotlight) return <SeasonalSpotlightCard spotlight={spotlight} onOpen={() => onOpen(spotlight.challenge_id)} />
  return <p className="muted">No seasonal challenge is active right now.</p>
}
