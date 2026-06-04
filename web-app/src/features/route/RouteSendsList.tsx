import { Avatar, SendBadge, Stars } from '../../components/Icon'
import type { ClimbLogRow } from '../../types/api'

function relativeDay(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

function displayName(log: ClimbLogRow): string {
  return log.profile?.nickname ?? log.profile?.username ?? 'Climber'
}

export function RouteSendsList({
  logs,
  loading,
  fallbackGrade,
  compact,
}: {
  logs: ClimbLogRow[]
  loading: boolean
  fallbackGrade?: string
  compact?: boolean
}) {
  if (loading) {
    return <div className="route-sends-row muted">Loading sends…</div>
  }
  if (logs.length === 0) {
    return <div className="route-sends-row muted">No public sends on this route yet.</div>
  }

  const shown = compact ? logs.slice(0, 3) : logs

  return (
    <>
      {shown.map((log, i) => {
        const name = displayName(log)
        const tries = log.attempts ?? 1
        const rating = log.personal_rating ?? 0
        return (
          <div
            key={log.id}
            className="route-sends-row"
            style={{
              borderBottom: i < shown.length - 1 ? '1px solid var(--separator)' : 'none',
            }}
          >
            <Avatar name={name} size={32} />
            <div className="route-sends-meta">
              <div className="route-sends-name-row">
                <span className="route-sends-name">{name}</span>
                <SendBadge type={log.send_type} />
              </div>
              <div className="route-sends-sub muted">
                <span>
                  {tries} {tries === 1 ? 'try' : 'tries'}
                </span>
                {rating > 0 && (
                  <>
                    <span> · </span>
                    <Stars value={rating} />
                  </>
                )}
                {log.climbed_date && (
                  <>
                    <span> · </span>
                    <span>{relativeDay(log.climbed_date)}</span>
                  </>
                )}
              </div>
              {!compact && log.grade && (
                <div className="route-sends-grade">{log.grade}</div>
              )}
            </div>
            {compact && (
              <span className="route-sends-grade">{log.grade ?? fallbackGrade}</span>
            )}
          </div>
        )
      })}
    </>
  )
}
