import type { SteepnessAngle } from '../hooks/useMigration'

export type SteepnessAngleId = SteepnessAngle

export interface SteepnessAngleMeta {
  id: SteepnessAngleId
  label: string
  caption: string
  subtitle: string
  /** Filename under `public/steepness/`; mixed uses icon fallback */
  image?: string
}

export const STEEPNESS_ANGLE_META: SteepnessAngleMeta[] = [
  { id: 'slab', label: 'Slab', caption: '~83°', subtitle: 'Friction, less than vertical', image: 'slab.png' },
  { id: 'vertical', label: 'Vertical', caption: '90°', subtitle: 'Straight up', image: 'vertical.png' },
  { id: 'overhung', label: 'Overhung', caption: '>90°', subtitle: 'Wall leans out', image: 'overhung.png' },
  { id: 'roof', label: 'Roof', caption: '180°', subtitle: 'Horizontal ceiling', image: 'roof.png' },
  { id: 'tufa', label: 'Tufa', caption: 'column', subtitle: 'Bulgy features', image: 'tufa.png' },
  { id: 'mixed', label: 'Mixed', caption: 'varies', subtitle: 'More than one style' },
]

export function steepnessAssetUrl(filename: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}steepness/${filename}`
}

/** Normalize API / legacy angle strings for comparison. */
export function normalizeSteepnessAngle(angle?: string | null): SteepnessAngleId | null {
  if (!angle) return null
  const s = angle.toLowerCase().trim()
  if (s === 'overhang') return 'overhung'
  if (STEEPNESS_ANGLE_META.some((m) => m.id === s)) return s as SteepnessAngleId
  return null
}

export function steepnessMetaFor(angle?: string | null): SteepnessAngleMeta | undefined {
  const id = normalizeSteepnessAngle(angle)
  if (!id) return undefined
  return STEEPNESS_ANGLE_META.find((m) => m.id === id)
}
