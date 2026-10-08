import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { LoginGate } from '../auth/LoginGate'
import { InvitationForm } from './InvitationForm'
import { browserInvitationSession as invitations } from '../../lib/invitationBootstrap'
import { invitationChallengeId } from '../../lib/invitationEntry'
import { CT_CLASSICS_CHALLENGE_ID, normalizeInvitationCode } from '../../lib/invitationLink'
import type { RouteLease } from '../../lib/invitationSession'
import { INVITATION_TTL_MS } from '../../lib/pendingInvitation'
import { invitationErrorMessage, submitSeasonalInvitation } from '../../lib/seasonalInvitation'
import { getSupabase } from '../../lib/supabase'
import { migrationInvoke } from '../../lib/peen-api/migration'
import type { SeasonalChallengeProgress } from '../../types/seasonalChallenge'

const categories = ['invitation_required', 'invitation_invalid', 'invitation_used',
  'invitation_rate_limited', 'challenge_closed'] as const
function safeError(failure?: unknown): Error {
  const message = failure instanceof Error ? failure.message : ''
  return new Error(categories.find(category => message.includes(category)) ?? 'Could not join. Try again.')
}
const revisionSnapshot = () => invitations.revision()
const subscribe = (notify: () => void) => invitations.subscribe(notify)
type Outcome = {
  accountId: string
  revision: number
  message: string
  status: 'joined' | 'denied'
  retryAt: number
  closed: boolean
}

export function InvitationLanding() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const cache = useQueryClient()
  const revision = useSyncExternalStore(subscribe, revisionSnapshot)
  const accountId = auth.user?.id ?? null
  const observedAccount = invitations.accountId()
  const challengeId = invitationChallengeId(window.location.pathname)
  const validPath = challengeId !== null &&
    window.location.pathname === `/app${location.pathname}` &&
    location.search === '' && location.hash === ''
  const ready = validPath && !auth.loading && observedAccount === accountId
  const lease = useRef<RouteLease | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [loginRequested, setLoginRequested] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const currentOutcome = ready && outcome?.accountId === accountId &&
    outcome.revision === revision ? outcome : null
  const pending = invitations.peek()
  const initialCode = ready && invitations.revision() === revision &&
    pending?.challengeId === challengeId ? pending.code : ''

  useEffect(() => {
    const owned = invitations.claimRoute()
    lease.current = owned
    invitations.current()
    const timer = window.setInterval(() => {
      invitations.current()
      setNow(Date.now())
    }, 1000)
    return () => {
      window.clearInterval(timer)
      if (lease.current === owned) lease.current = null
      // Deferred so a replacement instance committed in the same pass claims first.
      queueMicrotask(() => { invitations.releaseRoute(owned) })
    }
  }, [])

  function authoritative(expectedRevision: number, owned: RouteLease | null): boolean {
    invitations.current()
    return owned !== null && lease.current === owned && invitations.ownsRoute(owned) &&
      validPath && !auth.loading && accountId !== null && invitations.accountId() === accountId && invitations.revision() === expectedRevision &&
      window.location.pathname === `/app${location.pathname}`
  }
  async function sdkSession(expectedRevision: number, owned: RouteLease | null) {
    if (!authoritative(expectedRevision, owned)) throw safeError()
    const result = auth.devAuthBypass
      ? { data: { session: auth.session }, error: null }
      : await getSupabase().auth.getSession()
    if (!authoritative(expectedRevision, owned) || result.error ||
        result.data.session?.user.id !== accountId || !result.data.session.access_token) {
      throw safeError()
    }
    return result.data.session
  }

  const progress = useQuery<SeasonalChallengeProgress>({
    queryKey: ['seasonal', 'invitation-progress', challengeId, accountId, revision],
    enabled: ready && accountId !== null,
    retry: false,
    // Reading signal lets react-query cancel a departed lifetime's fetch so reattachment refetches.
    queryFn: async ({ signal }) => {
      const owned = lease.current
      const live = () => !signal.aborted && authoritative(revision, owned)
      try {
        const session = await sdkSession(revision, owned)
        if (!live() || !challengeId) throw safeError()
        const data = await migrationInvoke<SeasonalChallengeProgress>(
          'seasonal', 'seasonal_challenge_progress', { p_challenge_id: challengeId }, session.access_token,
        )
        if (!live() || data.challenge_id !== challengeId) throw safeError()
        return data
      } catch {
        throw safeError()
      }
    },
  })
  const matchingProgress = ready && progress.data?.challenge_id === challengeId
    ? progress.data : null
  const canJoin = Boolean(matchingProgress && !matchingProgress.enrolled &&
    currentOutcome?.status !== 'joined' && !currentOutcome?.closed &&
    !(currentOutcome && now < currentOutcome.retryAt))

  async function join(raw: string) {
    const owned = lease.current
    if (!canJoin || !challengeId || !accountId || !authoritative(revision, owned) ||
        (currentOutcome && Date.now() < currentOutcome.retryAt)) throw safeError()
    const code = normalizeInvitationCode(challengeId, raw)
    if (!invitations.capture(`https://peen.app/app/invite/${challengeId}#code=${encodeURIComponent(code)}`, accountId)) {
      throw safeError()
    }
    const token = invitations.beginJoin(accountId)
    const joinRevision = invitations.revision()
    if (!token) throw safeError()
    const accepts = () => authoritative(joinRevision, owned) && invitations.accepts(token, accountId) &&
      invitations.revision() === joinRevision
    try {
      const session = await sdkSession(joinRevision, owned)
      if (!accepts() || session.user.id !== accountId || !session.access_token) throw safeError()
      await submitSeasonalInvitation(params => {
        if (!accepts()) throw safeError()
        return migrationInvoke<Record<string, never>>('seasonal', 'joinChallenge', params, session.access_token)
      }, challengeId, code)
      if (!accepts() || !invitations.finishJoin(token, accountId, true)) throw safeError()
      const clearedRevision = invitations.revision()
      if (!authoritative(clearedRevision, owned)) throw safeError()
      setOutcome({ accountId, revision: clearedRevision, message: 'Challenge joined. Your code has been cleared.',
        status: 'joined', retryAt: 0, closed: false })
      const keys = [
        ['seasonal', 'invitation-progress', challengeId, accountId],
        ['seasonal', 'progress', challengeId, accountId],
        ['seasonal', 'spotlight'], ['community', 'challenges'],
      ]
      for (const queryKey of keys) {
        if (!authoritative(clearedRevision, owned)) break
        void cache.invalidateQueries({ queryKey, exact: queryKey[1] === 'progress' })
      }
    } catch (failure) {
      const error = safeError(failure)
      if (accepts() && invitations.finishJoin(token, accountId, false) && authoritative(joinRevision, owned)) {
        setOutcome({ accountId, revision: joinRevision, message: invitationErrorMessage(error), status: 'denied',
          retryAt: error.message === 'invitation_rate_limited' ? Date.now() + INVITATION_TTL_MS : 0,
          closed: error.message === 'challenge_closed' })
      }
      throw error
    }
  }

  const cancel = () => {
    const owned = lease.current
    if (owned !== null && invitations.releaseRoute(owned)) navigate('/crew')
  }
  const title = matchingProgress?.title ?? (challengeId === CT_CLASSICS_CHALLENGE_ID
    ? 'CT Classics 2026' : 'Seasonal challenge')
  return <main className="invitation-panel" aria-labelledby="invitation-title">
    <h1 id="invitation-title">{validPath ? title : 'Invitation unavailable'}</h1>
    {!validPath ? <p role="status">Open a fresh invitation or return to Crew to enter a code.</p> : <>
      <p className="caption">{accountId ? `Account: ${auth.user?.email ?? accountId}` : 'Sign in to prepare your invitation.'}</p>
      <p className="caption">Reading an invitation does not join the challenge. Expired invitations require fresh code entry.</p>
      {currentOutcome && <p role="status">{currentOutcome.message}</p>}
      {currentOutcome?.status === 'joined' || matchingProgress?.enrolled ?
        <Link className="btn btn-primary" to={`/passport?challenge=${challengeId}`}>View challenge progress</Link> :
        validPath && !auth.loading && accountId === null ?
          <InvitationForm key={`${revision}:guest:${challengeId}`} required isGuest onSubmit={join}
            onSignIn={() => setLoginRequested(true)} /> :
          canJoin ? <InvitationForm key={`${revision}:${accountId}:${challengeId}`} required isGuest={false}
            initialCode={initialCode} accountLabel={auth.user?.email ?? accountId ?? undefined} onSubmit={join} /> :
            <p role="status">{currentOutcome?.closed ? 'Registration is closed.' :
              currentOutcome && now < currentOutcome.retryAt ? 'Wait before trying again. You can enter a fresh code when the wait ends.' :
                progress.isError ? 'Could not load this challenge. Retry or open a fresh invitation.' : 'Preparing challenge…'}</p>}
      {ready && accountId && progress.isError && <button type="button" className="btn btn-secondary"
        onClick={() => { if (authoritative(revision, lease.current)) void progress.refetch() }}>Retry loading challenge</button>}
      <LoginGate open={validPath && !auth.loading && accountId === null && loginRequested}
        message="Sign in, then explicitly join with your invitation."
        onClose={() => setLoginRequested(false)} />
    </>}
    <button type="button" className="btn btn-secondary" onClick={cancel}>Cancel and return to Crew</button>
  </main>
}
