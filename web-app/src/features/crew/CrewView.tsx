import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Icon } from '../../components/Icon'
import { TopoLines } from '../../components/TopoLines'
import { pastSeasonMeta } from '../../lib/seasonalChallenge'
import { BrowseCragsLink, LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import {
  useBetaSpray,
  useCrewLeaderboard,
  usePartners,
  usePendingCrewInvites,
  useSeasonalPastChallenges,
  useSeasonalSpotlight,
  useSharedProjects,
  useWeeklyLeaderboard,
} from '../../hooks/useMigration'
import { SeasonalChallengeDetailOverlay } from './SeasonalChallengeDetailOverlay'
import { SeasonalSpotlightCard } from './SeasonalSpotlightCard'

type CrewTab = 'Crew' | 'Partners' | 'Challenges'
type CrewLocationState = { tab?: CrewTab; challengeId?: string }

export function CrewView({
  onSignIn,
  onOpenRoute,
}: {
  onSignIn: () => void
  onOpenRoute?: (routeId: string) => void
}) {
  const { accessToken } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<CrewTab>('Crew')
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)
  const [partnerWhen, setPartnerWhen] = useState<string>('Any')
  const [partnerStyle, setPartnerStyle] = useState<string>('Any')

  const partnersQ = usePartners()
  const weeklyQ = useWeeklyLeaderboard()
  const yearlyQ = useCrewLeaderboard()
  const projectsQ = useSharedProjects()
  const betaQ = useBetaSpray()
  const invitesQ = usePendingCrewInvites()
  const seasonalQ = useSeasonalSpotlight()
  const pastQ = useSeasonalPastChallenges()

  useEffect(() => {
    const state = location.state as CrewLocationState | null
    if (state?.tab) setTab(state.tab)
    if (state?.challengeId) {
      setTab('Challenges')
      setSelectedChallengeId(state.challengeId)
    }
  }, [location.state])

  const partners = partnersQ.data ?? []
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const styleOk =
        partnerStyle === 'Any' ||
        (p.styles ?? []).some((s) => s.toLowerCase() === partnerStyle.toLowerCase())
      const whenOk =
        partnerWhen === 'Any' ||
        (p.when_text ?? '').toLowerCase().includes(partnerWhen.toLowerCase())
      return styleOk && whenOk
    })
  }, [partners, partnerStyle, partnerWhen])

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

  const weekly = weeklyQ.data ?? []
  const yearly = yearlyQ.data ?? []
  const projects = projectsQ.data ?? []
  const beta = betaQ.data ?? []
  const invites = invitesQ.data ?? []
  const seasonal = seasonalQ.data
  const pastSeasons = pastQ.data ?? []

  const leaderboardName = (row: (typeof weekly)[0]) =>
    row.display_name ?? row.nickname ?? row.username ?? 'Climber'

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
            <div className="crew-avatars-row">
              {weekly.slice(0, 6).map((row, i) => (
                <div key={row.user_id} style={{ marginLeft: i ? -10 : 0 }}>
                  <Avatar name={leaderboardName(row)} size={44} />
                </div>
              ))}
              <button
                type="button"
                className="crew-invite-add"
                aria-label="Invite climber"
                onClick={() => setTab('Partners')}
              >
                <Icon name="plus" size={18} />
              </button>
              <div style={{ marginLeft: 16, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                  {weekly.length} climbers this week
                  {invites.length > 0 ? ` · ${invites.length} pending invite${invites.length === 1 ? '' : 's'}` : ''}
                </div>
                <div style={{ fontWeight: 700 }}>Peen crew</div>
              </div>
            </div>
          </section>

          <section className="rail-card">
            <h4>This week · leaderboard</h4>
            {weeklyQ.isLoading && <p className="muted">Loading…</p>}
            <ul className="leader-list">
              {weekly.slice(0, 8).map((row, i) => (
                <li key={row.user_id}>
                  <span className={`leader-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                  <Avatar name={leaderboardName(row)} size={32} />
                  <span className="leader-name">{leaderboardName(row)}</span>
                  <strong className="mono-num">{row.sends ?? row.send_count ?? 0}</strong>
                  {row.delta && <span className="leader-delta">{row.delta}</span>}
                </li>
              ))}
            </ul>
            {!weeklyQ.isLoading && weekly.length === 0 && (
              <p className="muted" style={{ fontSize: 13 }}>No sends logged this week yet.</p>
            )}
          </section>

          <section className="rail-card">
            <h4>Year sends</h4>
            {yearlyQ.isLoading && <p className="muted">Loading…</p>}
            <ul className="leader-list">
              {yearly.slice(0, 5).map((row, i) => (
                <li key={row.user_id ?? i}>
                  <span className="leader-rank">{i + 1}</span>
                  <Avatar name={leaderboardName(row)} size={32} />
                  <span className="leader-name">{leaderboardName(row)}</span>
                  <strong className="mono-num">{row.send_count ?? row.sends ?? 0}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="rail-card">
            <h4>Shared projects</h4>
            {projectsQ.isLoading && <p className="muted">Loading…</p>}
            {projects.map((p) => (
              <div key={p.id} className="crew-project-row">
                <div className="crew-project-grade">{p.grade ?? '—'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    className="crew-link"
                    onClick={() => p.route_id && onOpenRoute?.(p.route_id)}
                    disabled={!p.route_id}
                  >
                    {p.route ?? 'Route'}
                  </button>
                  <div className="muted" style={{ fontSize: 12 }}>{p.crag ?? '—'}</div>
                </div>
                <span className="muted" style={{ fontSize: 12 }}>{p.count ?? 0} on it</span>
              </div>
            ))}
            {!projectsQ.isLoading && projects.length === 0 && (
              <p className="muted" style={{ fontSize: 13 }}>No shared projects yet.</p>
            )}
          </section>

          <section className="rail-card">
            <h4>Beta spray</h4>
            {betaQ.isLoading && <p className="muted">Loading…</p>}
            {beta.map((b) => (
              <p key={b.id} className="beta-spray-item">
                <b>{b.display_name ?? b.username ?? 'Climber'}</b> on{' '}
                {b.route_id ? (
                  <button type="button" className="crew-link" onClick={() => onOpenRoute?.(b.route_id!)}>
                    {b.route ?? 'route'}
                  </button>
                ) : (
                  <span style={{ color: 'var(--tint)', fontWeight: 700 }}>{b.route ?? 'route'}</span>
                )}
                : &ldquo;{b.body}&rdquo;
              </p>
            ))}
            {!betaQ.isLoading && beta.length === 0 && (
              <p className="muted" style={{ fontSize: 13 }}>No beta posts yet.</p>
            )}
          </section>
        </div>
      )}

      {tab === 'Partners' && (
        <section className="crew-partners">
          <div className="chip-row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
            {['Any', 'Sat', 'Sun', 'Weekend'].map((w) => (
              <button
                key={w}
                type="button"
                className={`chip outline ${partnerWhen === w ? 'active' : ''}`}
                onClick={() => setPartnerWhen(w)}
              >
                {w}
              </button>
            ))}
            {['Any', 'Sport', 'Boulder', 'Trad'].map((s) => (
              <button
                key={s}
                type="button"
                className={`chip outline ${partnerStyle === s ? 'active' : ''}`}
                onClick={() => setPartnerStyle(s)}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginLeft: 'auto', height: 36 }}
              onClick={() => navigate('/profile')}
            >
              <Icon name="plus" size={14} /> Post from iOS
            </button>
          </div>
          <h3 className="crew-section-title">Partners this weekend</h3>
          {partnersQ.isLoading && <p className="muted">Loading partners…</p>}
          <div className="partner-grid">
            {filteredPartners.map((p) => (
              <div key={p.id} className="card partner-card">
                <Avatar name={p.crag_name ?? 'Partner'} size={40} />
                <strong>{p.crag_name ?? 'Crag TBD'}</strong>
                <p className="muted">{p.when_text ?? 'Flexible'}</p>
                <p>
                  {p.grade_band ?? 'Any grade'} · {p.seats ?? 1} spot{(p.seats ?? 1) === 1 ? '' : 's'}
                </p>
                {p.transport && <p className="muted">{p.transport}</p>}
                {p.styles?.length ? (
                  <div className="chip-row">
                    {p.styles.map((s) => (
                      <span key={s} className="chip outline">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, height: 36 }}>
                    Message
                  </button>
                  <button type="button" className="btn btn-primary" style={{ flex: 1, height: 36 }}>
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!partnersQ.isLoading && filteredPartners.length === 0 && (
            <p className="muted">No partner posts match these filters.</p>
          )}
        </section>
      )}

      {tab === 'Challenges' && (
        <section className="crew-challenges">
          {seasonalQ.isLoading && !seasonal && <p className="muted">Loading challenge…</p>}
          {seasonal ? (
            <SeasonalSpotlightCard
              spotlight={seasonal}
              onOpen={() => setSelectedChallengeId(seasonal.challenge_id)}
            />
          ) : !seasonalQ.isLoading ? (
            <p className="muted">No seasonal challenge is active right now.</p>
          ) : null}

          {pastSeasons.length > 0 ? (
            <div className="past-seasons-block">
              <div className="past-seasons-label">Past seasons</div>
              <div className="past-seasons-list">
                {pastSeasons.map((row) => (
                  <button
                    key={row.challenge_id}
                    type="button"
                    className="past-season-row"
                    onClick={() => setSelectedChallengeId(row.challenge_id)}
                  >
                    <div className="past-season-main">
                      <div className="past-season-title">{row.title}</div>
                      <div className="past-season-meta">{pastSeasonMeta(row)}</div>
                    </div>
                    <Icon name="chevR" size={14} style={{ color: 'var(--fg-3)' }} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {selectedChallengeId ? (
        <SeasonalChallengeDetailOverlay
          challengeId={selectedChallengeId}
          onClose={() => setSelectedChallengeId(null)}
          onOpenRoute={onOpenRoute}
          onSignIn={onSignIn}
          isGuest={!accessToken}
        />
      ) : null}
    </div>
  )
}
