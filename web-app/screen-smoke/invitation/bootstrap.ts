import { captureInvitationEntry, invitationChallengeId, watchInvitationEntries } from '../../src/lib/invitationEntry.ts'
import { InvitationSession } from '../../src/lib/invitationSession.ts'

// The strict invitation parser only accepts the production origin, so the local fixture origin is mapped onto it.
const SYNTHETIC_PRODUCTION_ORIGIN = 'https://peen.app'

function replaceInvitationPath(path: string): void {
  window.history.replaceState(window.history.state, '', path)
}

const readLocation = () => ({
  href: SYNTHETIC_PRODUCTION_ORIGIN + window.location.href.slice(window.location.origin.length),
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
})

function createFixtureInvitationSession(): InvitationSession {
  const location = readLocation()
  if ((location.pathname === '/app/invite' || location.pathname.startsWith('/app/invite/')) &&
      (location.search !== '' || location.hash !== '')) {
    replaceInvitationPath(invitationChallengeId(location.pathname) === null
      ? '/app/invite/invalid' : location.pathname)
  }
  const session = new InvitationSession(window.sessionStorage, Date.now)
  captureInvitationEntry(session, location, replaceInvitationPath)
  return session
}

export const browserInvitationSession: InvitationSession = createFixtureInvitationSession()

watchInvitationEntries(browserInvitationSession, window, readLocation, replaceInvitationPath)
