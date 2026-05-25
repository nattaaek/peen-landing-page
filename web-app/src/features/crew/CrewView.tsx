import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar, Icon } from '../../components/Icon'
import { TopoLines } from '../../components/TopoLines'
import { BrowseCragsLink, LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { useCrewLeaderboard, usePartners, useSeasonalSpotlight } from '../../hooks/useMigration'

type CrewTab = 'Crew' | 'Partners' | 'Challenges'

export function CrewView({ onSignIn }: { onSignIn: () => void }) {
  const { accessToken } = useAuth()
  const location = useLocation()
  const [tab, setTab] = useState<CrewTab>('Crew')
  const partnersQ = usePartners()
  const boardQ = useCrewLeaderboard()
  const seasonalQ = useSeasonalSpotlight()

  useEffect(() => {
    const t = (location.state as { tab?: CrewTab } | null)?.tab
    if (t) setTab(t)
  }, [location.state])

  if (!accessToken) {
    return (
      <div className="view-crew">
        <div className="page-head">
          <div>
            <div className="wordmark">PEEN · COMMUNITY</div>
            <h1 className="page-title">Climb together</h1>
          </div>
        </div>
        <LoginRequired
          icon="crew"
          title="Sign in to find your crew"
          body="Build a crew, post partner availability, and join seasonal challenges."
          onSignIn={onSignIn}
          secondary={<BrowseCragsLink />}
        />
        <div className="crew-guest-hero">
          <div className="wordmark crew-guest-hero-kicker">A taste of what&apos;s inside</div>
          <div className="crew-challenge-hero">
            <TopoLines />
            <div className="wordmark" style={{ color: 'rgba(255,255,255,0.6)' }}>
              SEASONAL
            </div>
            <h2>Central Thailand Classics</h2>
            <p>Send classics across Crazy Horse, Lampang, and Lopburi. Sign in to join.</p>
            <button type="button" className="btn btn-primary" onClick={onSignIn}>
              <Icon name="google" size={16} /> Sign in to join
            </button>
          </div>
        </div>
      </div>
    )
  }

  const partners = partnersQ.data ?? []
  const board = boardQ.data ?? []
  const seasonal = seasonalQ.data as Record<string, unknown> | null | undefined

  return (
    <div className="view-crew">
      <div className="page-head">
        <div>
          <div className="wordmark">PEEN · COMMUNITY</div>
          <h1 className="page-title">Climb together</h1>
        </div>
        <div className="segmented">
          {(['Crew', 'Partners', 'Challenges'] as const).map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Crew' && (
        <div className="crew-grid">
          <section className="rail-card crew-card-wide">
            <h4>Your crew</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Invite climbers from the leaderboard and shared projects (coming soon on web).
            </p>
          </section>
          <section className="rail-card">
            <h4>This week · sends leaderboard</h4>
            {boardQ.isLoading && <p className="muted">Loading…</p>}
            <ul className="leader-list">
              {(board as { nickname?: string; send_count?: number }[]).slice(0, 8).map((row, i) => (
                <li key={i}>
                  <span className="leader-rank">{i + 1}</span>
                  <Avatar name={row.nickname ?? 'Climber'} size={32} />
                  <span className="leader-name">{row.nickname ?? 'Climber'}</span>
                  <strong>{row.send_count ?? 0}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === 'Partners' && (
        <section className="crew-partners">
          <h3 className="crew-section-title">Partners this weekend</h3>
          {partnersQ.isLoading && <p className="muted">Loading partners…</p>}
          <div className="partner-grid">
            {partners.map((p) => (
              <div key={p.id} className="card partner-card">
                <Avatar name={p.crag_name ?? 'Partner'} size={40} />
                <strong>{p.crag_name ?? 'Crag TBD'}</strong>
                <p className="muted">{p.when_text ?? 'Flexible'}</p>
                <p>
                  {p.grade_band ?? 'Any grade'} · {p.seats ?? 1} spot{(p.seats ?? 1) === 1 ? '' : 's'}
                </p>
                {p.styles?.length ? (
                  <div className="chip-row">
                    {p.styles.map((s) => (
                      <span key={s} className="chip outline">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {!partnersQ.isLoading && partners.length === 0 && (
              <p className="muted">No partner posts yet. Post availability from iOS for now.</p>
            )}
          </div>
        </section>
      )}

      {tab === 'Challenges' && (
        <section className="crew-challenges">
          {seasonalQ.isLoading && <p className="muted">Loading challenge…</p>}
          {seasonal != null ? (
            <div className="crew-challenge-hero crew-challenge-hero--signed-in">
              <TopoLines />
              <div className="wordmark">SEASONAL CHALLENGE</div>
              <h2>{String(seasonal.title ?? seasonal.name ?? 'Active challenge')}</h2>
              <p className="muted" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {seasonal.description != null
                  ? String(seasonal.description)
                  : 'Progress and route checklist match the iOS Challenges tab.'}
              </p>
              {seasonal.progress != null && seasonal.total != null && (
                <p style={{ fontWeight: 700, marginTop: 12 }}>
                  {String(seasonal.progress)} / {String(seasonal.total)} routes
                </p>
              )}
            </div>
          ) : (
            <p className="muted">No active seasonal challenge right now.</p>
          )}
        </section>
      )}
    </div>
  )
}
