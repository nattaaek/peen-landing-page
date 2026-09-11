import { buildClimbShareUrl } from './climbDeepLink'

/** Mirrors peen-ios `InstagramReelCaptionBuilder.brandHandle`. */
export const CLIMB_SHARE_BRAND_HANDLE = '@getpeen'

/** Mirrors peen-ios `InstagramReelCaptionBuilder.baseHashtags` (use `#PeenSend`, not `#Peen`). */
export const CLIMB_SHARE_BASE_HASHTAGS = ['#PeenSend', '#climbing'] as const

/** Area/gym display name from a feed climb route (shared by FeedCard + AscentDetailOverlay). */
export function climbLocationName(
  route?:
    | {
        area?: { name?: string | null } | null
        gym?: { name?: string | null } | null
      }
    | null,
): string | null {
  if (!route) return null
  return route.area?.name ?? route.gym?.name ?? null
}

/** `#bangkok` style slug from location text (first segment before comma). */
export function cityHashtag(from?: string | null): string | null {
  const raw = from?.trim()
  if (!raw) return null
  const segment = (raw.split(',')[0] ?? raw).trim()
  const slug = segment
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '')
  return slug ? `#${slug}` : null
}

/**
 * Own-send share caption (Specifier P1-1 + peen-ios InstagramReelCaptionBuilder).
 * Includes route (fallback `Send`), optional location, deep-link URL, `@getpeen`, `#PeenSend`.
 */
export function buildClimbShareCaption(opts: {
  routeName?: string | null
  locationName?: string | null
  url: string
}): string {
  const route = opts.routeName?.trim() || 'Send'
  const location = opts.locationName?.trim() ?? ''
  const line1 = location
    ? `${CLIMB_SHARE_BRAND_HANDLE} · ${route} @ ${location} · logged on Peen`
    : `${CLIMB_SHARE_BRAND_HANDLE} · ${route} · logged on Peen`

  const tags: string[] = [...CLIMB_SHARE_BASE_HASHTAGS]
  const city = cityHashtag(opts.locationName)
  if (city) tags.push(city)

  return `${line1}\n${opts.url}\n${tags.join(' ')}`
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: unknown }).name === 'AbortError'
  )
}

export async function shareClimb({
  climbId,
  routeName,
  locationName,
  onToast,
}: {
  climbId: string
  routeName?: string | null
  locationName?: string | null
  onToast?: (message: string) => void
}): Promise<void> {
  const url = buildClimbShareUrl(climbId)
  const text = buildClimbShareCaption({ routeName, locationName, url })

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ url, text })
      return
    } catch (err) {
      // Sheet cancel is non-fatal; other share failures fall through to clipboard.
      if (isAbortError(err)) return
    }
  }

  try {
    if (!navigator.clipboard?.writeText) {
      onToast?.('Could not share send')
      return
    }
    await navigator.clipboard.writeText(text)
    onToast?.('Caption + link copied')
  } catch {
    onToast?.('Could not share send')
  }
}
