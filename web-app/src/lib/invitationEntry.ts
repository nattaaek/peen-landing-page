import { CT_CLASSICS_CHALLENGE_ID, parseInvitationLink } from './invitationLink.ts'
import type { InvitationSession } from './invitationSession.ts'

const pathPattern = /^\/app\/invite\/(ct-classics-2026|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?![\s\S])/

export type EntryLocation = Readonly<{
  href: string
  pathname: string
  search: string
  hash: string
}>
type EntryEvents = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>

export function invitationChallengeId(pathname: string): string | null {
  const match = pathPattern.exec(pathname)
  if (!match) return null
  return match[1] === 'ct-classics-2026'
    ? CT_CLASSICS_CHALLENGE_ID
    : match[1].toLowerCase()
}

export function captureInvitationEntry(
  session: InvitationSession,
  location: EntryLocation,
  replace: (path: string) => void,
): boolean {
  const { href, pathname, search, hash } = location
  if (pathname !== '/app/invite' && !pathname.startsWith('/app/invite/')) {
    return false
  }

  const challengeId = invitationChallengeId(pathname)
  replace(challengeId === null ? '/app/invite/invalid' : pathname)

  let agrees: boolean
  try {
    const parsed = new URL(href)
    agrees = parsed.pathname === pathname && parsed.search === search &&
      parsed.hash === hash
  } catch {
    agrees = false
  }

  if (challengeId === null || !agrees || search !== '') {
    session.clear()
    return false
  }

  if (hash !== '' || href.includes('#') || href.includes('?')) {
    const invitation = parseInvitationLink(href)
    if (invitation === null || invitation.challengeId !== challengeId) {
      session.clear()
      return false
    }
    return session.capture(href, session.accountId() ?? null)
  }

  if (href === `https://peen.app${pathname}` &&
      session.current()?.challengeId === challengeId) {
    return true
  }
  session.clear()
  return false
}

export function watchInvitationEntries(
  session: InvitationSession,
  events: EntryEvents,
  read: () => EntryLocation,
  replace: (path: string) => void,
): () => void {
  const sync = () => { captureInvitationEntry(session, read(), replace) }
  events.addEventListener('popstate', sync)
  events.addEventListener('hashchange', sync)
  return () => {
    events.removeEventListener('popstate', sync)
    events.removeEventListener('hashchange', sync)
  }
}
