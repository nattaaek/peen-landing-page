import { useId, useState } from 'react'
import { Icon } from '../../components/Icon'
import { coordinateText, directionsUrl, formatPrice, hasListedVisitInfo } from '../../lib/gymVisitInfo'
import type { GymEditCapability } from '../../lib/gymWriteController'
import type { ApiGym } from '../../types/api'
import type { GymVisitInfo, GymVisitPrice } from '../../types/gymVisitInfo'
import '../../styles/gym-visit.css'

type CopyState = { kind: 'idle' } | { kind: 'copied' } | { kind: 'failed'; text: string }

function UnknownLine({ children }: { children: string }) {
  return <p className="gym-visit-unknown">{children}</p>
}

function PriceList({ rows }: { rows: GymVisitPrice[] }) {
  return (
    <ul className="gym-visit-list">
      {rows.map((p, i) => (
        <li key={`${p.label}-${i}`}>
          <span className="gym-visit-label">{p.label}</span>
          <span className="gym-visit-value">{formatPrice(p)}</span>
          {p.conditions && <span className="gym-visit-note">{p.conditions}</span>}
        </li>
      ))}
    </ul>
  )
}

function PostedInfo({ info, headingId }: { info: GymVisitInfo; headingId: string }) {
  const provenance = info.provenance
  return (
    <>
      <p className="gym-visit-posted">Posted information — confirm with the gym</p>
      <p className="gym-visit-source">
        {provenance
          ? `Source: posted sign · Verified: ${provenance.verified_at ?? 'date unknown'}`
          : 'Source unknown · Verified: date unknown'}
      </p>
      {provenance?.note && <p className="gym-visit-note">{provenance.note}</p>}

      <h4 id={`${headingId}-hours`}>Hours</h4>
      {info.hours.length ? (
        <ul className="gym-visit-list" aria-labelledby={`${headingId}-hours`}>
          {info.hours.map((h, i) => (
            <li key={`${h.label}-${i}`}>
              <span className="gym-visit-label">{h.label}</span>
              <span className="gym-visit-value">
                {h.opens_at}–{h.closes_at}
              </span>
              {h.note && <span className="gym-visit-note">{h.note}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <UnknownLine>Hours unknown</UnknownLine>
      )}

      <h4>Admission</h4>
      {info.admission.length ? <PriceList rows={info.admission} /> : <UnknownLine>Admission prices unknown</UnknownLine>}

      <h4>Rentals</h4>
      {info.rentals.length ? <PriceList rows={info.rentals} /> : <UnknownLine>Rental prices unknown</UnknownLine>}

      <h4>Grade colours</h4>
      {info.grade_legend.length ? (
        <ul className="gym-visit-grades">
          {info.grade_legend.map((g, i) => (
            <li key={`${g.grade}-${i}`}>
              <span
                className="gym-visit-swatch"
                aria-hidden="true"
                style={g.color_hex ? { background: g.color_hex } : undefined}
              />
              <span className="gym-visit-label">{g.grade}</span>
              <span>{g.color_name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <UnknownLine>Grade colours unknown</UnknownLine>
      )}
    </>
  )
}

function EditAccess({
  capability,
  hasInfo,
  onEdit,
  onRetry,
}: {
  capability: GymEditCapability
  hasInfo: boolean
  onEdit?: () => void
  onRetry?: () => void
}) {
  switch (capability.kind) {
    case 'allowed':
      return onEdit ? (
        <button type="button" className="btn btn-ghost gym-visit-edit" onClick={onEdit}>
          <Icon name="plus" size={14} /> {hasInfo ? 'Edit posted info' : 'Add posted info'}
        </button>
      ) : null
    case 'checking':
      return <p className="gym-visit-unknown" role="status">Checking edit access…</p>
    case 'unavailable':
      return (
        <div className="gym-visit-access-error" role="alert">
          <span>Couldn't check edit access for this gym.</span>
          {onRetry && (
            <button type="button" className="btn btn-ghost" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )
    default:
      return null
  }
}

export function GymVisitSection({
  gym,
  capability,
  onEdit,
  onRetryAccess,
}: {
  gym: ApiGym
  capability: GymEditCapability
  onEdit?: () => void
  onRetryAccess?: () => void
}) {
  const headingId = useId()
  const [copy, setCopy] = useState<CopyState>({ kind: 'idle' })
  const info = hasListedVisitInfo(gym.visit_info) ? gym.visit_info : null
  const hasCoord =
    gym.latitude != null && gym.longitude != null && !(gym.latitude === 0 && gym.longitude === 0)
  const coord = hasCoord ? coordinateText(gym.latitude!, gym.longitude!) : null

  const copyCoordinates = async () => {
    if (!coord) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(coord)
      setCopy({ kind: 'copied' })
    } catch {
      setCopy({ kind: 'failed', text: coord })
    }
  }

  return (
    <section className="gym-visit" aria-labelledby={headingId}>
      <div className="gym-visit-head">
        <h3 id={headingId}>Visit info</h3>
        <EditAccess capability={capability} hasInfo={!!info} onEdit={onEdit} onRetry={onRetryAccess} />
      </div>

      {info ? (
        <PostedInfo info={info} headingId={headingId} />
      ) : (
        <UnknownLine>Visit info unknown. Confirm hours and prices with the gym.</UnknownLine>
      )}

      <h4>Location</h4>
      {gym.address && <p className="gym-visit-address">{gym.address}</p>}
      {coord ? (
        <>
          <p className="gym-visit-coord">
            <Icon name="pin" size={14} /> <span translate="no">{coord}</span>
          </p>
          <div className="gym-visit-actions">
            <a
              className="btn btn-primary"
              href={directionsUrl(gym.latitude!, gym.longitude!)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Directions
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <button type="button" className="btn btn-ghost" onClick={() => void copyCoordinates()}>
              Copy coordinates
            </button>
          </div>
          <div role="status" aria-live="polite" className="gym-visit-copy-status">
            {copy.kind === 'copied' && 'Coordinates copied.'}
            {copy.kind === 'failed' && (
              <span className="error">
                Couldn't copy. Select and copy manually: <span translate="no">{copy.text}</span>
              </span>
            )}
          </div>
        </>
      ) : (
        <UnknownLine>Location unknown</UnknownLine>
      )}
    </section>
  )
}
