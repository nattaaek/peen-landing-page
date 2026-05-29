/** Session-local comment likes (design parity; no server sync yet). */
const STORAGE_KEY = 'peen-web-comment-likes'

function load(): Record<string, true> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, true>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function save(map: Record<string, true>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode */
  }
}

export function isCommentLiked(commentId: string): boolean {
  return !!load()[commentId]
}

export function toggleCommentLike(commentId: string): boolean {
  const map = load()
  if (map[commentId]) {
    delete map[commentId]
    save(map)
    return false
  }
  map[commentId] = true
  save(map)
  return true
}
