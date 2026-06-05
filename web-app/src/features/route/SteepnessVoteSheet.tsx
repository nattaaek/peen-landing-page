import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { ModalPortal } from '../../components/ModalPortal'
import {
  normalizeSteepnessAngle,
  STEEPNESS_ANGLE_META,
  type SteepnessAngleId,
} from '../../domain/steepnessAngles'
import { useUpsertSteepnessVote } from '../../hooks/useMigration'
import { SteepnessMascotIcon } from './SteepnessMascotIcon'
import { SteepnessVoteTile } from './SteepnessVoteTile'

export function SteepnessVoteSheet({
  open,
  routeId,
  routeName,
  savedAngle,
  initialDraft,
  onClose,
  onVoted,
}: {
  open: boolean
  routeId: string
  routeName: string
  /** Current vote from API (for Done without changes). */
  savedAngle?: string | null
  /** Pre-select when opening from an inline mascot tile. */
  initialDraft?: SteepnessAngleId | null
  onClose: () => void
  onVoted?: () => void
}) {
  const vote = useUpsertSteepnessVote()
  const [draft, setDraft] = useState<SteepnessAngleId | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDraft(initialDraft ?? normalizeSteepnessAngle(savedAngle))
    setSaveError(null)
  }, [open, savedAngle, initialDraft])

  if (!open) return null

  const draftMeta = draft ? STEEPNESS_ANGLE_META.find((m) => m.id === draft) : undefined

  const commit = () => {
    setSaveError(null)
    if (!draft) {
      onClose()
      return
    }
    if (normalizeSteepnessAngle(savedAngle) === draft) {
      onClose()
      return
    }
    vote.mutate(
      { route_id: routeId, angle: draft },
      {
        onSuccess: () => {
          onVoted?.()
          onClose()
        },
        onError: () => setSaveError('Could not save vote. Try again.'),
      },
    )
  }

  return (
    <ModalPortal>
      <div className="modal-backdrop route-stack-modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal route-stack-modal steepness-vote-modal"
        role="dialog"
        aria-label="Vote steepness"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head steepness-vote-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
          <h3>Steepness</h3>
          <button
            type="button"
            className="btn btn-primary btn-sm steepness-vote-done"
            onClick={commit}
            disabled={vote.isPending}
          >
            {vote.isPending ? 'Saving…' : 'Done'}
          </button>
        </div>
        <div className="modal-body steepness-vote-body">
          <p className="steepness-vote-intro">
            Pick how steep <strong>{routeName}</strong> climbs. Tap Done to save — your choice stays until you
            confirm.
          </p>
          {saveError && <p className="route-photos-error">{saveError}</p>}
          <div className="steepness-vote-grid">
            {STEEPNESS_ANGLE_META.map((meta) => (
              <SteepnessVoteTile
                key={meta.id}
                meta={meta}
                selected={draft === meta.id}
                disabled={vote.isPending}
                onSelect={() => setDraft(meta.id)}
              />
            ))}
          </div>
          <div className="steepness-vote-summary">
            <div className="steepness-vote-summary-label">Your vote</div>
            {draftMeta ? (
              <div className="steepness-vote-summary-row">
                <SteepnessMascotIcon meta={draftMeta} size={28} />
                <div>
                  <div className="steepness-vote-summary-title">{draftMeta.label}</div>
                  <div className="steepness-vote-summary-sub muted">
                    {draftMeta.caption} · {draftMeta.subtitle}
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted steepness-vote-summary-empty">Tap a tile to add your vote.</p>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
