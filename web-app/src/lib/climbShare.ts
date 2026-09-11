import { buildClimbShareUrl } from './climbDeepLink'

export function buildClimbShareCaption(opts: {
  routeName?: string | null
  grade?: string | null
}): string {
  const routeName = opts.routeName?.trim() || 'this route'
  const grade = opts.grade?.trim()
  const gradePart = grade ? ` (${grade})` : ''
  return `Just sent ${routeName}${gradePart} on Peen! @getpeen #PeenSend`
}

export async function shareClimb({
  climbId,
  routeName,
  grade,
  onToast,
}: {
  climbId: string
  routeName?: string | null
  grade?: string | null
  onToast?: (message: string) => void
}): Promise<void> {
  const caption = buildClimbShareCaption({ routeName, grade })
  const url = buildClimbShareUrl(climbId)
  const title = routeName?.trim() || 'Peen send'

  if (navigator.share) {
    try {
      await navigator.share({ title, text: caption, url })
      return
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }

  try {
    await navigator.clipboard.writeText(`${caption}\n${url}`)
    onToast?.('Caption + link copied')
  } catch {
    onToast?.('Could not share send')
  }
}
