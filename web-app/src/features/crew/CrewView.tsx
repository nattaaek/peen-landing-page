import { LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { useCrewLeaderboard, usePartners, useSeasonalSpotlight } from '../../hooks/useMigration'

export function CrewView({ onSignIn }: { onSignIn: () => void }) {
  const { accessToken } = useAuth()
  const partnersQ = usePartners()
  const boardQ = useCrewLeaderboard()
  const seasonalQ = useSeasonalSpotlight()

  if (!accessToken) {
    return (
      <LoginRequired
        title="Crew & partners"
        hint="Sign in to see your crew leaderboard, partner posts, and seasonal challenges."
        onSignIn={onSignIn}
      />
    )
  }

  const partners = partnersQ.data ?? []
  const board = boardQ.data ?? []

  return (
    <div className="view-crew">
      <div className="view-head">
        <h1>Crew</h1>
      </div>
      {seasonalQ.data != null && (
        <section className="card" style={{ margin: '0 24px 20px' }}>
          <h3>Seasonal challenge</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            Active challenge loaded from peen-api.
          </p>
        </section>
      )}
      <section style={{ padding: '0 24px' }}>
        <h3>Leaderboard</h3>
        {boardQ.isLoading && <p className="muted">Loading…</p>}
        <ul className="leader-list">
          {(board as { nickname?: string; send_count?: number }[]).slice(0, 8).map((row, i) => (
            <li key={i}>
              <span>{row.nickname ?? 'Climber'}</span>
              <strong>{row.send_count ?? 0} sends</strong>
            </li>
          ))}
        </ul>
      </section>
      <section style={{ padding: '24px' }}>
        <h3>Partners this weekend</h3>
        {partnersQ.isLoading && <p className="muted">Loading partners…</p>}
        <div className="partner-grid">
          {partners.map((p) => (
            <div key={p.id} className="card partner-card">
              <strong>{p.crag_name ?? 'Crag TBD'}</strong>
              <p className="muted">{p.when_text ?? 'Flexible'}</p>
              <p>{p.grade_band ?? 'Any grade'} · {p.seats ?? 1} spots</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
