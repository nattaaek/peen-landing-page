import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useSeasonalProgress, useSeasonalSpotlight } from '../../hooks/useMigration'
import { passportBands, passportPage, PASSPORT_GRADES } from '../../lib/passport'
import { routeStatusLabel } from '../../lib/seasonalChallenge'
import { SeasonalChallengeDetailOverlay } from '../crew/SeasonalChallengeDetailOverlay'
import { PassportScene } from './PassportScene'
import type { SeasonalChallengeProgress } from '../../types/seasonalChallenge'

/** Local visual review only: never used by live account progress or enrollment. */
const preview = (): SeasonalChallengeProgress => ({
  challenge_id: 'design-preview', title: 'Poda | Best routes ever', start_date: '2026-12-01', end_date: '2027-03-31',
  enrolled: false, routes_completed_count: 0, routes_total: 30, overall_complete: false,
  routes: PASSPORT_GRADES.flatMap((grade, band) => Array.from({ length: 5 }, (_, route) => ({
    route_id: `preview-${band}-${route}`, grade_label: grade, sort_order: route, completed: false, status: 'not_logged',
    route_name: `Sample route ${route + 1}`, area_name: 'Design preview — fictional route',
  }))),
})

export function PassportView({ onSignIn, onOpenRoute }: Readonly<{ onSignIn: () => void; onOpenRoute: (id: string) => void }>) {
  const { user, accessToken } = useAuth()
  const [params, setParams] = useSearchParams()
  const spotlight = useSeasonalSpotlight()
  const isPreview = import.meta.env.DEV && params.get('demo') === 'true'
  const challengeId = params.get('challenge') ?? spotlight.data?.challenge_id
  const progress = useSeasonalProgress(isPreview ? undefined : challengeId)
  const data = isPreview ? preview() : accessToken ? progress.data : undefined
  const mode = params.get('view') === 'collection' ? 'collection' : '3d'
  const page = passportPage(params.get('page'))
  const update = (values: Record<string, string>) => setParams(prev => {
    const next = new URLSearchParams(prev)
    for (const [key, value] of Object.entries(values)) next.set(key, value)
    return next
  }, { replace: true })
  return <div className="passport-view">
    <header className="passport-header">
      <Link to="/feed" className="passport-back">← Back to Feed</Link>
      <span className="wordmark">Your climbing passport</span>
      <div className="passport-title-row"><div><h1>{data?.title ?? 'A book of good routes.'}</h1>
        <p className="footnote">{isPreview ? 'Design preview · fictional routes · no earned stamps or enrollment' : 'Your seasonal routes, one grade at a time.'}</p></div>
        <div className="seg-control" aria-label="Passport presentation">
          <button type="button" className={mode === '3d' ? 'active' : ''} aria-pressed={mode === '3d'} onClick={() => update({ view: '3d' })}>3D Passport</button>
          <button type="button" className={mode === 'collection' ? 'active' : ''} aria-pressed={mode === 'collection'} onClick={() => update({ view: 'collection' })}>Static collection</button>
        </div></div>
    </header>
    <PassportContent key={`${user?.id ?? 'guest'}:${challengeId ?? 'none'}:${isPreview}`} data={data} mode={mode} page={page}
      onPage={next => update({ page: next })} onOpenRoute={onOpenRoute} isPreview={isPreview} onSignIn={onSignIn}
      isGuest={!accessToken} />
    {!isPreview && <div className="passport-data-state">
      {!accessToken ? <><p>Sign in to load your challenge and progress.</p><button className="btn btn-primary" onClick={onSignIn}>Sign in</button></> :
        spotlight.isError || progress.isError ? <div role="alert"><p>Could not load challenge progress. Your collection has not been marked empty.</p>
          <button className="btn btn-secondary" onClick={() => { void spotlight.refetch(); if (challengeId) void progress.refetch() }}>Retry progress</button></div> :
        spotlight.isLoading || progress.isLoading ? <p role="status">Loading your challenge…</p> :
        !challengeId ? <p>No seasonal challenge is available right now.</p> : null}
    </div>}
  </div>
}

function PassportContent({ data, mode, page, onPage, onOpenRoute, isPreview, onSignIn, isGuest }: Readonly<{
  data?: SeasonalChallengeProgress; mode: string; page: 'cover' | 'front' | 'back'
  onPage: (page: string) => void; onOpenRoute: (id: string) => void; isPreview: boolean; onSignIn: () => void; isGuest: boolean
}>) {
  const [selected, setSelected] = useState<number | null>(null)
  const [joinOpen, setJoinOpen] = useState(false)
  const bands = passportBands(data?.routes ?? [])
  const visibleBands = page === 'back' ? [3, 4, 5] : [0, 1, 2]
  const choose = (index: number) => { setSelected(index); onPage(index < 3 ? 'front' : 'back') }
  return <>
    {mode === '3d' ? <PassportScene page={page} onOpen={() => onPage('front')} onPocket={choose} /> :
      <div className="passport-static">
        <img src={`${import.meta.env.BASE_URL}passport/cover.png`} alt="Poda Best routes ever — Central Thailand edition" />
        <div><span className="wordmark">Route collection</span><h2>Six grades. Your own pace.</h2>
          <p>Each grade has its own five-route pocket. Completing one grade does not require the others.</p>
          <p className="footnote">{data ? `${data.routes_completed_count}/${data.routes_total} routes confirmed by ${isPreview ? 'the fictional preview' : 'the challenge service'}.` : 'Sign in to view confirmed route progress.'}</p></div>
      </div>}
    <nav className="passport-page-controls" aria-label="Book pages">
      <button className="btn btn-secondary" onClick={() => { setSelected(null); onPage('cover') }} disabled={page === 'cover'}>Close book</button>
      <span aria-live="polite">{page === 'cover' ? 'Cover' : page === 'front' ? 'Page 1 · 6a–6c' : 'Page 2 · 7a–7c'}</span>
      <button className="btn btn-primary" onClick={() => { setSelected(null); onPage(page === 'cover' ? 'front' : page === 'front' ? 'back' : 'front') }}>{page === 'cover' ? 'Open passport' : 'Turn page'}</button>
    </nav>
    <section className="passport-collection" aria-label="Grade pockets">
      <div className="passport-grade-controls">{bands.map((band, index) => <button type="button" key={band.grade}
        aria-pressed={selected === index} className={`passport-grade ${selected === index ? 'selected' : ''}`} onClick={() => choose(index)}>
        <strong>{band.grade}</strong><span>{data ? `${band.completed}/${band.routes.length}` : 'Not loaded'}</span>
      </button>)}</div>
      <div className="passport-pockets">{(selected !== null ? [selected] : mode === 'collection' ? [0, 1, 2, 3, 4, 5] : visibleBands).map(index => {
        const band = bands[index]
        return <article className="passport-pocket" key={band.grade}>
          <header><h3>{band.grade}</h3><span className="footnote">{data ? `${band.completed}/${band.routes.length} routes` : 'Progress unavailable'}</span></header>
          <div className="passport-stamps" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span className={band.routes[i]?.completed ? 'confirmed' : ''} key={i}>{band.routes[i]?.completed ? '✓' : i + 1}</span>)}</div>
          {!band.routes.length ? <p className="footnote">{data ? 'No routes supplied for this grade.' : 'Load a challenge to see its routes.'}</p> : <ul>{band.routes.map(route => <li key={route.route_id}>
            <button type="button" disabled={isPreview} onClick={() => onOpenRoute(route.route_id)}><span><strong>{route.route_name ?? 'Route'}</strong><small>{route.area_name}</small></span><span className="passport-route-status">{routeStatusLabel(route)}</span></button>
          </li>)}</ul>}
          <p className="caption">Physical patch shown as a preview. Digital rewards are not issued here.</p>
        </article>
      })}</div>
    </section>
    <footer className="passport-footer"><div><h3>{data?.enrolled ? 'You’re enrolled in this season' : 'Ready for your next route?'}</h3>
      <p className="footnote">{data?.enrolled ? 'Your route status comes from your challenge progress.' : 'Challenge access is confirmed separately with the organizer’s invitation code.'}</p></div>
      <button className="btn btn-primary" disabled={!data || isPreview} onClick={() => setJoinOpen(true)}>{data?.enrolled ? 'View challenge' : 'View invitation & challenge'}</button>
      <button className="btn btn-secondary" disabled title="Reward issuance is not available on the web">Rewards · coming later</button>
      <button className="btn btn-secondary" disabled title="Earned passport history is not available on the web">Passport history · coming later</button>
    </footer>
    {joinOpen && data && !isPreview && <SeasonalChallengeDetailOverlay challengeId={data.challenge_id} onClose={() => setJoinOpen(false)} onOpenRoute={onOpenRoute} isGuest={isGuest} onSignIn={onSignIn} />}
  </>
}
