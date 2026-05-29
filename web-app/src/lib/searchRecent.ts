const STORAGE_KEY = 'peen-search-recent'
const MAX_RECENT = 8

export function readRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function pushRecentSearch(query: string): void {
  const q = query.trim()
  if (!q) return
  const prev = readRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase())
  localStorage.setItem(STORAGE_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)))
}

export function clearRecentSearches(): void {
  localStorage.removeItem(STORAGE_KEY)
}

const STATIC_QUICK = ['Crazy Horse', '7a', 'Tonsai', 'Mantra']

export function buildQuickSearchChips(input: {
  recent: string[]
  wishlistRouteNames: string[]
  homeAreaName?: string | null
  max?: number
}): { label: string; chips: string[]; showClear: boolean } {
  const max = input.max ?? 4
  if (input.recent.length > 0) {
    return {
      label: 'Recent searches',
      chips: input.recent.slice(0, max),
      showClear: true,
    }
  }
  const suggested: string[] = []
  const seen = new Set<string>()
  const add = (s: string) => {
    const t = s.trim()
    if (!t) return
    const key = t.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    suggested.push(t)
  }
  if (input.homeAreaName) add(input.homeAreaName.replace(/ Buttress$/, '').replace(/ Limestone$/, ''))
  for (const name of input.wishlistRouteNames) add(name)
  for (const s of STATIC_QUICK) {
    if (suggested.length >= max) break
    add(s)
  }
  return {
    label: suggested.length > 0 ? 'Suggested for you' : 'Quick searches',
    chips: suggested.slice(0, max),
    showClear: false,
  }
}
