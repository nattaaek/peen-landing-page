import { useMemo } from 'react'
import { LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { useMyLogs, useMyProfile } from '../../hooks/useMigration'
import { SendBadge } from '../../components/Icon'

export function ProfileView({ onSignIn }: { onSignIn: () => void }) {
  const { accessToken } = useAuth()
  const profileQ = useMyProfile()
  const logsQ = useMyLogs()

  if (!accessToken) {
    return (
      <div className="view-profile">
        <div className="page-head">
          <div>
            <h1 className="page-title">Profile</h1>
            <p className="page-sub">Sends, grade pyramid, and activity heatmap.</p>
          </div>
        </div>
        <LoginRequired
          icon="profile"
          title="Your climbing identity"
          body="Sign in to see sends, grade pyramid, and recent activity — synced with iOS."
          onSignIn={onSignIn}
        />
      </div>
    )
  }

  const logs = logsQ.data ?? []
  const stats = useMemo(() => computeStats(logs), [logs])
  const profile = profileQ.data

  return (
    <div className="view-profile">
      <div className="page-head">
        <div>
          <h1 className="page-title">{profile?.nickname ?? profile?.username ?? 'Climber'}</h1>
          {profile?.bio && <p className="page-sub">{profile.bio}</p>}
        </div>
      </div>
      <div className="profile-hero card">
        <h2 className="h4" style={{ margin: '0 0 12px' }}>
          Stats
        </h2>
        {profile?.bio && <p className="muted">{profile.bio}</p>}
        <div className="stat-row">
          <Stat label="Sends" value={String(stats.total)} />
          <Stat label="This year" value={String(stats.thisYear)} />
          <Stat label="Hardest" value={stats.topGrade} />
        </div>
      </div>
      <section style={{ padding: 24 }}>
        <h3>Grade pyramid</h3>
        <div className="pyramid">
          {stats.byGrade.map(([grade, count]) => (
            <div key={grade} className="pyramid-row">
              <span>{grade}</span>
              <div className="bar" style={{ width: `${Math.min(100, count * 12)}%` }} />
              <span>{count}</span>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: '0 24px 24px' }}>
        <h3>Recent sends</h3>
        {logsQ.isLoading && <p className="muted">Loading…</p>}
        <ul className="send-list">
          {logs.slice(0, 12).map((log) => (
            <li key={log.id}>
              <strong>{log.route?.name ?? 'Route'}</strong>
              <SendBadge type={log.send_type} />
              <span className="muted">{log.grade ?? log.route?.grade}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-pill">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function computeStats(logs: { grade?: string; route?: { grade?: string }; created_at?: string }[]) {
  const year = new Date().getFullYear()
  const grades = new Map<string, number>()
  let thisYear = 0
  for (const log of logs) {
    const g = log.grade ?? log.route?.grade ?? '?'
    grades.set(g, (grades.get(g) ?? 0) + 1)
    if (log.created_at && new Date(log.created_at).getFullYear() === year) thisYear++
  }
  const byGrade = [...grades.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const topGrade = byGrade[0]?.[0] ?? '—'
  return { total: logs.length, thisYear, topGrade, byGrade }
}
