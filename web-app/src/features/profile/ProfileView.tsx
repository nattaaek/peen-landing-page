import { useMemo, useState } from 'react'
import { LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { useDeleteLog, useMyLogs, useMyProfile, useUpdateLog, useUpdateProfile } from '../../hooks/useMigration'
import { Icon, SendBadge } from '../../components/Icon'
import type { ClimbLogRow, SendType } from '../../types/api'

const SEND_TYPES: SendType[] = ['flash', 'onsight', 'redpoint', 'repeat', 'attempt', 'dog']

export function ProfileView({ onSignIn }: { onSignIn: () => void }) {
  const { accessToken } = useAuth()
  const profileQ = useMyProfile()
  const logsQ = useMyLogs()
  const [editOpen, setEditOpen] = useState(false)
  const [editLog, setEditLog] = useState<ClimbLogRow | null>(null)

  if (!accessToken) {
    return (
      <div className="view-profile">
        <div className="page-head">
          <div>
            <h1 className="page-title">Profile</h1>
            <p className="page-sub">Sends, grade pyramid, and activity.</p>
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
          <p className="page-sub">{profile?.bio ?? 'Your sends and stats'}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(true)}>
          Edit profile
        </button>
      </div>
      <div className="profile-hero card">
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
        <ul className="send-list send-list--interactive">
          {logs.slice(0, 12).map((log) => (
            <li key={log.id}>
              <button type="button" className="send-list-btn" onClick={() => setEditLog(log)}>
                <strong>{log.route?.name ?? 'Route'}</strong>
                <SendBadge type={log.send_type} />
                <span className="muted">{log.grade ?? log.route?.grade}</span>
                <Icon name="chevR" size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      {editOpen && profile && (
        <ProfileEditModal profile={profile} onClose={() => setEditOpen(false)} />
      )}
      {editLog && <LogEditModal log={editLog} onClose={() => setEditLog(null)} />}
    </div>
  )
}

function ProfileEditModal({
  profile,
  onClose,
}: {
  profile: { nickname?: string | null; bio?: string | null; username?: string | null }
  onClose: () => void
}) {
  const [nickname, setNickname] = useState(profile.nickname ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const update = useUpdateProfile()

  const save = async () => {
    await update.mutateAsync({ nickname: nickname.trim() || null, bio: bio.trim() || null })
    onClose()
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal" role="dialog">
        <h2>Edit profile</h2>
        <label className="field">
          <span>Nickname</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </label>
        <label className="field">
          <span>Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        </label>
        {update.isError && <p className="error">Could not save profile.</p>}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 12 }}
          disabled={update.isPending}
          onClick={() => save()}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  )
}

function LogEditModal({ log, onClose }: { log: ClimbLogRow; onClose: () => void }) {
  const [sendType, setSendType] = useState<SendType>((log.send_type as SendType) ?? 'redpoint')
  const [notes, setNotes] = useState(log.notes ?? '')
  const [isPublic, setIsPublic] = useState(log.is_public ?? true)
  const update = useUpdateLog()
  const del = useDeleteLog()
  const climbed_date = log.climbed_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)

  const save = async () => {
    await update.mutateAsync({
      id: log.id,
      climbed_date,
      send_type: sendType,
      notes,
      is_public: isPublic,
      attempts: log.attempts ?? 1,
      personal_rating: log.personal_rating,
    })
    onClose()
  }

  const remove = async () => {
    if (!confirm('Delete this send?')) return
    await del.mutateAsync(log.id)
    onClose()
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal" role="dialog">
        <h2>Edit send</h2>
        <p className="muted">
          {log.route?.name} · {log.route?.grade}
        </p>
        <div className="chip-row" style={{ margin: '12px 0' }}>
          {SEND_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${sendType === t ? 'active' : ''}`}
              onClick={() => setSendType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Public on feed</span>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 8 }}
          disabled={update.isPending}
          onClick={() => save()}
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 8, color: 'var(--danger)' }}
          disabled={del.isPending}
          onClick={() => remove()}
        >
          Delete send
        </button>
      </div>
    </>
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
