import { Icon } from '../../components/Icon'
import type { SteepnessAngleMeta } from '../../domain/steepnessAngles'
import { SteepnessMascotIcon } from './SteepnessMascotIcon'

export function SteepnessVoteTile({
  meta,
  selected,
  disabled,
  compact,
  onSelect,
}: {
  meta: SteepnessAngleMeta
  selected: boolean
  disabled?: boolean
  compact?: boolean
  onSelect: () => void
}) {
  const mascotSize = compact ? 48 : 72

  return (
    <button
      type="button"
      className={`steepness-vote-tile${selected ? ' selected' : ''}${compact ? ' compact' : ''}`}
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${meta.label}, ${meta.subtitle}`}
    >
      {selected && (
        <span className="steepness-vote-tile-check" aria-hidden>
          <Icon name="check" size={11} />
        </span>
      )}
      <SteepnessMascotIcon meta={meta} size={mascotSize} />
      <span className="steepness-vote-tile-label">{meta.label}</span>
      {!compact && <span className="steepness-vote-tile-caption">{meta.caption}</span>}
    </button>
  )
}
