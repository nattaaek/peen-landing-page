import { FEED_GRADES } from '../features/feed/feedConstants'

export function gradeIndex(grade: string): number {
  const normalized = grade.trim().toLowerCase()
  const idx = (FEED_GRADES as readonly string[]).indexOf(normalized)
  return idx
}

export function hardestGradeFromLogs(
  logs: { grade?: string; route?: { grade?: string } }[],
): string {
  let bestIdx = -1
  let best = '—'
  for (const log of logs) {
    const g = (log.grade ?? log.route?.grade)?.trim()
    if (!g) continue
    const idx = gradeIndex(g)
    if (idx < 0) {
      if (best === '—') best = g
      continue
    }
    if (idx > bestIdx) {
      bestIdx = idx
      best = g
    }
  }
  return best
}

export function computeClimbStats(
  logs: { grade?: string; route?: { grade?: string }; created_at?: string }[],
) {
  const year = new Date().getFullYear()
  const grades = new Map<string, number>()
  let thisYear = 0
  for (const log of logs) {
    const g = log.grade ?? log.route?.grade ?? '?'
    grades.set(g, (grades.get(g) ?? 0) + 1)
    if (log.created_at && new Date(log.created_at).getFullYear() === year) thisYear++
  }
  const byGrade = [...grades.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const hardest = hardestGradeFromLogs(logs)
  return { total: logs.length, thisYear, hardest, byGrade }
}
