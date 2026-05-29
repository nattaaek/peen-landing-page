import { useMemo, useState } from 'react'
import { LoginRequired } from '../auth/LoginGate'
import { useAuth } from '../auth/AuthProvider'
import { Avatar, Icon, SendBadge } from '../../components/Icon'
import { ActivityHeatmap } from '../../components/ActivityHeatmap'
import {
  useDeleteLog,
  useMyCrewRank,
  useMyLogs,
  useMyProfile,
  useUpdateLog,
  useUpdateProfile,
} from '../../hooks/useMigration'
import { computeClimbStats } from '../../lib/climbStats'
import { profileHandle } from '../../lib/peen-api/profiles'
import type { ClimbLogRow, SendType } from '../../types/api'

const SEND_TYPES: SendType[] = ['flash', 'onsight', 'redpoint', 'repeat', 'attempt', 'dog']

export function ProfileView({ onSignIn }: { onSignIn: () => void }) {
  const { accessToken, signOut, user } = useAuth()
  const profileQ = useMyProfile()
  const logsQ = useMyLogs()
  const crewRankQ = useMyCrewRank(user?.id)
  const [editOpen, setEditOpen] = useState(false)
  const [editLog, setEditLog] = useState<ClimbLogRow | null>(null)

  const logs = logsQ.data ?? []
  const stats = useMemo(() => computeClimbStats(logs), [logs])

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
        <div className="profile-stat-grid profile-stat-grid--teaser" aria-hidden>
          {[
            { label: 'Sends', value: '—' },
            { label: 'This year', value: '—' },
            { label: 'Hardest sent', value: '—' },
            { label: 'Public sends', value: '—' },
          ].map((s) => (
            <div key={s.label} className="rail-card profile-stat-card">
              <div className="profile-stat-label">{s.label}</div>
              <div className="profile-stat-value-lg">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const profile = profileQ.data

  const displayName = profile?.nickname ?? profile?.username ?? 'Climber'
  const handle = profileHandle(profile ?? {})
  const crewRank = crewRankQ.rank
  const crewRankLabel = crewRankQ.isLoading ? '…' : crewRank != null ? `#${crewRank}` : '—'

  return (
    <div className="view-profile">
      <div className="page-head">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar name={displayName} size={68} />
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>
              {displayName}
            </h1>
            <p className="page-sub">
              {handle && <span>{handle}</span>}
              {profile?.bio ? (
                <>
                  {handle ? ' · ' : ''}
                  {profile.bio}
                </>
              ) : (
                !handle && 'Your sends and stats'
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => signOut()}>
            Sign out
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditOpen(true)}>
            Edit profile
          </button>
        </div>
      </div>

      <div className="profile-stat-grid">
        <div className="rail-card profile-stat-card">
          <div className="profile-stat-label">Sends</div>
          <div className="profile-stat-value-lg">{stats.total}</div>
          <div className="muted" style={{ fontSize: 12 }}>all-time</div>
        </div>
        <div className="rail-card profile-stat-card">
          <div className="profile-stat-label">This year</div>
          <div className="profile-stat-value-lg">{stats.thisYear}</div>
        </div>
        <div className="rail-card profile-stat-card">
          <div className="profile-stat-label">Hardest sent</div>
          <div className="profile-stat-value-lg">{stats.hardest}</div>
        </div>
        <div className="rail-card profile-stat-card">
          <div className="profile-stat-label">Crew rank</div>
          <div className="profile-stat-value-lg">{crewRankLabel}</div>
          <div className="muted" style={{ fontSize: 12 }}>this week</div>
        </div>
      </div>

      <div style={{ padding: '0 24px 18px' }}>
        <ActivityHeatmap logs={logs} />
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
  profile: {
    nickname?: string | null
    bio?: string | null
    username?: string | null
    is_profile_public?: boolean
  }
  onClose: () => void
}) {
  const [nickname, setNickname] = useState(profile.nickname ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [isPublic, setIsPublic] = useState(profile.is_profile_public !== false)
  const update = useUpdateProfile()

  const save = async () => {
    await update.mutateAsync({
      nickname: nickname.trim() || null,
      bio: bio.trim() || null,
      is_profile_public: isPublic,
    })
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
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Public profile (full stats visible to others)</span>
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
