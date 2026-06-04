import { Icon } from '../../components/Icon'
import { STEEPNESS_ANGLES, useUpsertSteepnessVote } from '../../hooks/useMigration'

export function SteepnessVoteSheet({
  open,
  routeId,
  routeName,
  myAngle,
  topAngle,
  voteCount,
  onClose,
  onVoted,
}: {
  open: boolean
  routeId: string
  routeName: string
  myAngle?: string | null
  topAngle?: string | null
  voteCount?: number
  onClose: () => void
  onVoted?: () => void
}) {
  const vote = useUpsertSteepnessVote()

  if (!open) return null

  const votesLabel =
    voteCount != null && voteCount > 0
      ? `${voteCount} vote${voteCount === 1 ? '' : 's'} so far`
      : 'No votes yet — be the first'

  return (
    <>
      <div className="modal-backdrop route-stack-modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal route-stack-modal"
        role="dialog"
        aria-label="Vote steepness"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>How steep is {routeName}?</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p className="muted route-steepness-vote-intro">{votesLabel}</p>
          {topAngle && (
            <p className="route-steepness-vote-consensus">
              Community top: <strong>{topAngle}</strong>
            </p>
          )}
          <div className="steepness-grid steepness-grid-vote-sheet">
            {STEEPNESS_ANGLES.map((angle) => (
              <button
                key={angle}
                type="button"
                className={`chip ${myAngle === angle || topAngle === angle ? 'active' : ''}`}
                disabled={vote.isPending}
                onClick={() => {
                  vote.mutate(
                    { route_id: routeId, angle },
                    {
                      onSuccess: () => {
                        onVoted?.()
                        onClose()
                      },
                    },
                  )
                }}
              >
                {angle}
              </button>
            ))}
          </div>
          {vote.isError && (
            <p className="route-photos-error" style={{ marginTop: 12 }}>
              Could not save vote. Try again.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
