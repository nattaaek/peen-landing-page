import { captureInvitationEntry, invitationChallengeId, watchInvitationEntries } from './invitationEntry.ts'
import { InvitationSession } from './invitationSession.ts'

function replaceInvitationPath(path: string): void {
  try {
    window.history.replaceState(window.history.state, '', path)
  } catch {
    throw new Error('Invitation URL cleanup failed')
  }
}

const readLocation = () => ({
  href: window.location.href,
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
})

function createBrowserInvitationSession(): InvitationSession {
  const location = readLocation()
  const candidate = location.pathname === '/app/invite' ||
    location.pathname.startsWith('/app/invite/')
  if (candidate && (location.search !== '' || location.hash !== '' ||
      location.href.includes('#') || location.href.includes('?'))) {
    replaceInvitationPath(invitationChallengeId(location.pathname) === null
      ? '/app/invite/invalid' : location.pathname)
  }

  let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
  try {
    storage = window.sessionStorage
  } catch {
    storage = null
  }
  const session = new InvitationSession(storage, Date.now)
  captureInvitationEntry(session, location, replaceInvitationPath)
  return session
}

export const browserInvitationSession: InvitationSession = createBrowserInvitationSession()

watchInvitationEntries(browserInvitationSession, window, readLocation, replaceInvitationPath)
