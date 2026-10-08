import { browserInvitationSession as invitations } from './bootstrap'
import { StrictMode, useContext, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider, AUTH_MODE_KEY, authMode, FixtureAccountControls, useAuth } from './AuthProvider'
import { InvitationLanding } from '../../src/features/crew/InvitationLanding'
import { INVITATION_SESSION_KEY } from '../../src/lib/invitationSession'
import '../../src/styles/tokens.css'
import '../../src/styles/app.css'
import '../../src/styles/extra.css'

const SEASONAL_API = 'http://127.0.0.1:18089/v1/migration/seasonal'
const INVITE_PATH = '/app/invite/ct-classics-2026'
const VALID_CODE = 'PODA-SYN1-SYN2-SYN3'
const USED_CODE = 'SYN-USED'
const INVALID_CODE = 'SYN-NOPE-0000'
type TransportMode = 'normal' | 'slow' | 'failure'
type LogEntry = { op: string; account: string; challenge: string; outcome: string }

const transport = {
  mode: 'normal' as TransportMode, log: [] as LogEntry[], joinRequests: 0,
  enrollments: new Map<string, number>(), redeemedBy: null as string | null, version: 0,
}
const transportListeners = new Set<() => void>()
function transportChanged() {
  transport.version++
  for (const listener of transportListeners) listener()
}
const subscribeTransport = (listener: () => void) => {
  transportListeners.add(listener)
  return () => { transportListeners.delete(listener) }
}
const subscribeInvitations = (listener: () => void) => invitations.subscribe(listener)
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : input.toString()
  if (!url.startsWith(SEASONAL_API)) throw new Error('Synthetic fixture rejects nonlocal requests')
  if (typeof init?.body !== 'string') throw new TypeError('Synthetic fixture requires a JSON string body')
  const { op, params } = JSON.parse(init.body) as { op: string; params: Record<string, string | undefined> }
  const account = (new Headers(init.headers).get('authorization') ?? '').replace(/^Bearer synthetic-/, '')
  const challenge = params.p_challenge_id ?? params.challenge_id ?? ''
  const record = (outcome: string) => {
    transport.log.push({ op, account, challenge, outcome })
    transportChanged()
  }
  if (op === 'joinChallenge') transport.joinRequests++
  if (transport.mode === 'slow') await new Promise(resolve => setTimeout(resolve, 1500))
  if (transport.mode === 'failure') {
    record('network failure')
    throw new TypeError('Failed to fetch')
  }
  if (op === 'joinChallenge') {
    const code = params.invitation_code
    if (code === VALID_CODE && (transport.redeemedBy === null || transport.redeemedBy === account)) {
      transport.redeemedBy = account
      transport.enrollments.set(account, (transport.enrollments.get(account) ?? 0) + 1)
      record('enrolled')
      return reply({})
    }
    const error = code === VALID_CODE || code === USED_CODE ? 'invitation_used' : 'invitation_invalid'
    record(error)
    return reply({ error }, 400)
  }
  if (op === 'seasonal_challenge_progress') {
    const enrolled = (transport.enrollments.get(account) ?? 0) > 0
    record(enrolled ? 'progress: enrolled' : 'progress: not enrolled')
    return reply({ challenge_id: params.p_challenge_id, slug: 'ct-classics-2026', title: 'CT Classics 2026 (synthetic)',
      achievement_id: 'synthetic', start_date: '2026-05-01', end_date: '2026-12-31', requires_invitation: true, enrolled,
      routes: [], routes_completed_count: 0, routes_total: 30, overall_complete: false, eligible_for_prize: false,
      prize_claim_status: 'none' })
  }
  record('unsupported')
  return reply({ error: 'unsupported' }, 400)
}

function persistedBookkeeping() {
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(INVITATION_SESSION_KEY) ?? 'null')
    if (typeof value !== 'object' || value === null) return null
    const { createdAt, accountId } = value as { createdAt?: unknown; accountId?: unknown }
    return { createdAt: String(createdAt), accountId: accountId === null ? 'null' : String(accountId) }
  } catch { return null }
}

const scan = (code: string) => { window.location.hash = `#code=${encodeURIComponent(code)}` }
function fullScanLoad() {
  // Assigning a URL that differs only by fragment is a same-document navigation, so leave the path first.
  if (window.location.pathname === INVITE_PATH) window.history.replaceState(null, '', '/app/crew')
  window.location.assign(`${INVITE_PATH}#code=${encodeURIComponent(VALID_CODE)}`)
}
function setAuthMode(mode: 'synthetic' | 'real-unconfigured') {
  window.sessionStorage.setItem(AUTH_MODE_KEY, mode)
  window.location.reload()
}

function FixturePanel() {
  useSyncExternalStore(subscribeTransport, () => transport.version)
  useSyncExternalStore(subscribeInvitations, () => invitations.revision())
  const switchAccount = useContext(FixtureAccountControls)
  const auth = useAuth()
  const observed = invitations.accountId()
  const bookkeeping = persistedBookkeeping()
  return <aside aria-label="Fixture controls" style={{ position: 'fixed', right: 8, bottom: 8, width: 360, maxHeight: '70vh',
    overflow: 'auto', background: '#fff', color: '#111', border: '2px solid #b3261e', padding: 8, fontSize: 12, zIndex: 1000 }}>
    <strong>SYNTHETIC LOCAL FIXTURE: synthetic auth and mocked transport; not optical camera scan, not real OAuth</strong>
    <p>Auth mode: {authMode} · user: {auth.loading ? 'loading' : auth.user?.id ?? 'guest'}</p>
    <div>
      <button type="button" onClick={() => scan(VALID_CODE)}>Same-tab scan: valid code</button>
      <button type="button" onClick={() => scan(USED_CODE)}>Same-tab scan: used code</button>
      <button type="button" onClick={() => scan(INVALID_CODE)}>Same-tab scan: invalid code</button>
      <button type="button" onClick={fullScanLoad}>Full scan URL load</button>
    </div>
    <label>Transport <select defaultValue={transport.mode} onChange={event => {
      transport.mode = event.target.value as TransportMode
      transportChanged()
    }}>
      <option value="normal">normal</option>
      <option value="slow">slow 1500ms</option>
      <option value="failure">network failure</option>
    </select></label>
    {switchAccount && <div>
      <button type="button" onClick={() => switchAccount('synthetic-alice')}>Sign in synthetic-alice</button>
      <button type="button" onClick={() => switchAccount('synthetic-bob')}>Switch to synthetic-bob</button>
      <button type="button" onClick={() => {
        switchAccount('synthetic-alice'); switchAccount('synthetic-bob'); switchAccount('synthetic-alice')
      }}>A-B-A switch</button>
    </div>}
    <button type="button" onClick={() => { void auth.signOut() }}>Sign out</button>
    <button type="button" onClick={() => setAuthMode(authMode === 'synthetic' ? 'real-unconfigured' : 'synthetic')}>
      {authMode === 'synthetic' ? 'Use real unconfigured AuthProvider' : 'Use synthetic auth'}
    </button>
    <p data-testid="bookkeeping">Observed account: {observed === undefined ? 'unresolved' : observed ?? 'guest'} ·
      persisted: {bookkeeping ? `createdAt ${bookkeeping.createdAt}, accountId ${bookkeeping.accountId}` : 'none'}</p>
    <p data-testid="join-count">joinChallenge requests: {transport.joinRequests}</p>
    <p data-testid="enrollments">Enrollments: {[...transport.enrollments].map(([account, count]) => `${account}=${count}`).join(', ') || 'none'}</p>
    <ol data-testid="transport-log">{transport.log.map((entry, index) =>
      <li key={index}>{entry.op} · {entry.account || 'anonymous'} · {entry.challenge} · {entry.outcome}</li>)}</ol>
  </aside>
}

function SyntheticCrew() {
  return <main className="invitation-panel">
    <h1>Crew (synthetic)</h1>
    <Link to="/invite/ct-classics-2026">Open the CT Classics invite path</Link>
  </main>
}

createRoot(document.getElementById('root')!).render(<StrictMode>
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <BrowserRouter basename="/app">
      <AuthProvider>
        <Routes>
          <Route path="invite/*" element={<InvitationLanding />} />
          <Route path="crew" element={<SyntheticCrew />} />
        </Routes>
        <FixturePanel />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
</StrictMode>)
