import type { FeedClimbRow } from '../../types/api'
import {
  DEFAULT_GRADE_RANGE,
  FEED_GRADES,
  type SortChoice,
  type WhenChoice,
} from './feedConstants'

export function gradeIndex(grade?: string | null): number {
  if (!grade) return -1
  const g = grade.trim().toLowerCase()
  return FEED_GRADES.indexOf(g as (typeof FEED_GRADES)[number])
}

export function postDaysAgo(iso?: string): number {
  if (!iso) return 999
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / 86_400_000)
}

export function cragNameForPost(post: FeedClimbRow): string | undefined {
  return post.route?.area?.name ?? post.route?.gym?.name ?? undefined
}

export function uniqueCragsFromPosts(posts: FeedClimbRow[]): string[] {
  return [...cragCountsFromPosts(posts).keys()].sort((a, b) => a.localeCompare(b))
}

export function cragCountsFromPosts(posts: FeedClimbRow[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const p of posts) {
    const name = cragNameForPost(p)
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return counts
}

export type FeedFilterState = {
  styleSet: Set<string>
  gradeRange: [number, number]
  cragSet: Set<string>
  whenChoice: WhenChoice
  sortBy: SortChoice
}

export function countActiveFilters(state: FeedFilterState): number {
  const gradeActive =
    state.gradeRange[0] > DEFAULT_GRADE_RANGE[0] ||
    state.gradeRange[1] < DEFAULT_GRADE_RANGE[1]
  return (
    state.styleSet.size +
    (gradeActive ? 1 : 0) +
    state.cragSet.size +
    (state.whenChoice !== 'any' ? 1 : 0)
  )
}

export function filterFeedPosts(posts: FeedClimbRow[], state: FeedFilterState): FeedClimbRow[] {
  const gradeActive =
    state.gradeRange[0] > DEFAULT_GRADE_RANGE[0] ||
    state.gradeRange[1] < DEFAULT_GRADE_RANGE[1]

  return posts.filter((post) => {
    const sendType = (post.send_type ?? 'attempt').toLowerCase()
    if (state.styleSet.size > 0 && !state.styleSet.has(sendType)) return false

    if (gradeActive) {
      const gi = gradeIndex(post.route?.grade)
      if (gi < 0 || gi < state.gradeRange[0] || gi > state.gradeRange[1]) return false
    }

    if (state.cragSet.size > 0) {
      const crag = cragNameForPost(post)
      if (!crag || !state.cragSet.has(crag)) return false
    }

    if (state.whenChoice !== 'any') {
      const d = postDaysAgo(post.created_at)
      if (state.whenChoice === '24h' && d > 0) return false
      if (state.whenChoice === '7d' && d > 7) return false
      if (state.whenChoice === '30d' && d > 30) return false
    }

    return true
  })
}

export function sortFeedPosts(posts: FeedClimbRow[], sortBy: SortChoice): FeedClimbRow[] {
  const list = [...posts]
  if (sortBy === 'likes') {
    list.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0))
    return list
  }
  if (sortBy === 'hardest') {
    list.sort((a, b) => gradeIndex(b.route?.grade) - gradeIndex(a.route?.grade))
    return list
  }
  if (sortBy === 'attempts') {
    list.sort((a, b) => (b.attempts ?? 0) - (a.attempts ?? 0))
    return list
  }
  list.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })
  return list
}
