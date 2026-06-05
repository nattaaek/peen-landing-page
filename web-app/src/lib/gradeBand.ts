import { gradeRank } from './cragStats'

export type GradeBandStyle = { fill: string; text: string }

/** Matches iOS `RouteListGradeBand.style(for:)`. */
export function gradeBandStyle(grade: string): GradeBandStyle {
  const rank = gradeRank(grade)
  if (rank == null) {
    return { fill: '#DAE5F2', text: '#1F4D86' }
  }
  const r6a = gradeRank('6a') ?? 0
  const r7a = gradeRank('7a') ?? 0
  const r7c = gradeRank('7c') ?? 0
  const r8bPlus = gradeRank('8b+') ?? Number.MAX_SAFE_INTEGER

  if (rank < r6a) return { fill: '#D8E9DE', text: '#2A6B3A' }
  if (rank < r7a) return { fill: '#DAE5F2', text: '#1F4D86' }
  if (rank < r7c) return { fill: '#F7E3B7', text: '#7A5510' }
  if (rank < r8bPlus) return { fill: '#F4D2BD', text: '#A03F12' }
  return { fill: '#E0CCEE', text: '#5C2A89' }
}
