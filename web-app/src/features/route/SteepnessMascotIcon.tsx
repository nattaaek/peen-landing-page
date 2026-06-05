import { Icon } from '../../components/Icon'
import { steepnessAssetUrl, type SteepnessAngleMeta } from '../../domain/steepnessAngles'

export function SteepnessMascotIcon({
  meta,
  size = 72,
}: {
  meta: SteepnessAngleMeta
  size?: number
}) {
  const radius = size >= 56 ? 14 : 8

  if (!meta.image) {
    return (
      <span
        className="steepness-mascot steepness-mascot-mixed"
        style={{ width: size, height: size, borderRadius: radius }}
        aria-hidden
      >
        <Icon name="layers" size={Math.round(size * 0.38)} />
      </span>
    )
  }

  return (
    <img
      className="steepness-mascot"
      src={steepnessAssetUrl(meta.image)}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: radius }}
    />
  )
}
