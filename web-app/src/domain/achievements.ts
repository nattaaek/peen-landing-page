import type { IconName } from '../components/Icon'
import { FEED_GRADES } from '../features/feed/feedConstants'

export type AchievementDef = {
  id: string
  title: string
  icon: IconName
}

export type UserAchievementRow = {
  achievement_id: string
  unlocked_at?: string
  user_id?: string
}

export type AchievementView = AchievementDef & {
  isUnlocked: boolean
  unlockedAt?: string
}

const FLAVOR = ['Gremlin', 'Menace', 'Goblin', 'Problem', 'Beast', 'Destroyer', 'Demon', 'Monster']

function gradeMilestoneId(grade: string): string {
  let s = grade.trim().toLowerCase().replace(/\+/g, '_plus').replace(/[.\s/]+/g, '_')
  while (s.includes('__')) s = s.replace('__', '_')
  return `sport_send_french_${s.replace(/^_|_$/g, '')}`
}

const CORE: AchievementDef[] = [
  { id: 'first_send', title: 'First Blood', icon: 'mountain' },
  { id: 'ten_sends', title: 'Warm‑Up Complete', icon: 'trophy' },
  { id: 'twentyfive_sends', title: 'Send Dealer', icon: 'starSolid' },
  { id: 'fifty_sends', title: 'Send Machine', icon: 'bolt' },
  { id: 'hundred_sends', title: 'Century Club', icon: 'trophy' },
  { id: 'two_hundred_sends', title: 'Send Lord', icon: 'star' },
  { id: 'unique_5', title: 'Route Taster', icon: 'layers' },
  { id: 'unique_10', title: 'Route Collector', icon: 'layers' },
  { id: 'unique_25', title: 'Hit List', icon: 'bookmark' },
  { id: 'unique_50', title: 'Route Hoarder', icon: 'bookmarkFilled' },
  { id: 'unique_100', title: 'Archive Keeper', icon: 'bookmarkFilled' },
  { id: 'streak_3', title: 'On a Roll', icon: 'bolt' },
  { id: 'seven_day_streak', title: 'Fire Week', icon: 'bolt' },
  { id: 'streak_14', title: 'Two‑Week Tear', icon: 'bolt' },
  { id: 'streak_30', title: 'Daily Demon', icon: 'bolt' },
  { id: 'ten_send_month', title: 'Calendar Diff', icon: 'calendar' },
  { id: 'month20', title: 'Full Send Month', icon: 'calendar' },
  { id: 'month30', title: 'Send Calendar', icon: 'calendar' },
  { id: 'first_flash', title: 'Lightning Hands', icon: 'bolt' },
  { id: 'flash5', title: 'Quickdraw', icon: 'bolt' },
  { id: 'flash10', title: 'Bolt Bandit', icon: 'bolt' },
  { id: 'first_onsight', title: 'Third Eye', icon: 'eye' },
  { id: 'onsight5', title: 'No Beta Needed', icon: 'eye' },
  { id: 'onsight10', title: 'Oracle', icon: 'eye' },
]

const SPORT_GRADES: AchievementDef[] = FEED_GRADES.map((grade, i) => {
  const word = FLAVOR[i % FLAVOR.length]
  return {
    id: gradeMilestoneId(grade),
    title: `Sport ${grade} ${word}`,
    icon: 'grade',
  }
})

const BY_ID = new Map<string, AchievementDef>(
  [...CORE, ...SPORT_GRADES].map((d) => [d.id, d]),
)

function humanizeId(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function achievementDef(id: string): AchievementDef {
  return BY_ID.get(id) ?? { id, title: humanizeId(id), icon: 'trophy' }
}

export function mergeAchievements(unlocked: UserAchievementRow[]): AchievementView[] {
  const unlockedMap = new Map(unlocked.map((r) => [r.achievement_id, r]))
  const known = new Set(BY_ID.keys())
  const merged: AchievementView[] = [...CORE, ...SPORT_GRADES].map((def) => {
    const row = unlockedMap.get(def.id)
    return {
      ...def,
      isUnlocked: row != null,
      unlockedAt: row?.unlocked_at,
    }
  })
  for (const row of unlocked) {
    if (!known.has(row.achievement_id)) {
      const def = achievementDef(row.achievement_id)
      merged.push({
        ...def,
        isUnlocked: true,
        unlockedAt: row.unlocked_at,
      })
    }
  }
  return merged
}

/** Up to 5 badges for profile strip (recent unlocks first). */
export function featuredAchievements(achievements: AchievementView[]): AchievementView[] {
  return achievements
    .filter((a) => a.isUnlocked)
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))
    .slice(0, 5)
}

export function parseUserAchievements(raw: unknown): UserAchievementRow[] {
  if (!Array.isArray(raw)) return []
  const out: UserAchievementRow[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const id = (r.achievement_id ?? r.achievementId) as string | undefined
    if (!id) continue
    out.push({
      achievement_id: id,
      unlocked_at: (r.unlocked_at ?? r.unlockedAt) as string | undefined,
      user_id: (r.user_id ?? r.userId) as string | undefined,
    })
  }
  return out
}
