import { useMemo } from 'react'
import { Icon } from '../../components/Icon'
import { TopoLines } from '../../components/TopoLines'
import {
  useJoinSeasonalChallenge,
  useSeasonalProgress,
} from '../../hooks/useMigration'
import {
  challengeProgressPct,
  daysLeftUntilEnd,
  groupRoutesByGrade,
  routeStatusLabel,
  seasonWindowPhrase,
} from '../../lib/seasonalChallenge'
import type { SeasonalChallengeProgress, SeasonalRouteProgress } from '../../types/seasonalChallenge'

function SeasonalRouteRow({
  item,
  onOpenRoute,
}: {
  item: SeasonalRouteProgress
  onOpenRoute?: (routeId: string) => void
}) {
  const title = item.route_name ?? 'Route'
  const location = item.area_name
  const grade = item.route_grade
  const status = routeStatusLabel(item)
  const tappable = !!onOpenRoute && !!item.route_id

  const inner = (
    <>
      <span className={`seasonal-route-icon ${item.completed ? 'done' : ''}`} aria-hidden>
        {item.completed ? <Icon name="check" size={18} /> : <span className="seasonal-route-pending-dot" />}
      </span>
      <div className="seasonal-route-main">
        <div className={`seasonal-route-title ${item.completed ? 'done' : ''}`}>{title}</div>
        {location ? (
          <div className="seasonal-route-location">
            <Icon name="pin" size={11} /> {location}
          </div>
        ) : null}
        {item.editorial_note ? (
          <div className="seasonal-route-note">{item.editorial_note}</div>
        ) : null}
      </div>
      <div className="seasonal-route-meta">
        {grade ? <div className="seasonal-route-grade">{grade}</div> : null}
        <div className={`seasonal-route-status ${item.completed ? 'done' : ''}`}>{status}</div>
      </div>
      {tappable ? (
        <Icon name="chevR" size={14} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
      ) : null}
    </>
  )

  if (tappable) {
    return (
      <button
        type="button"
        className="seasonal-route-row"
        onClick={() => onOpenRoute!(item.route_id)}
      >
        {inner}
      </button>
    )
  }

  return <div className="seasonal-route-row">{inner}</div>
}

function GradeBucket({
  grade,
  routes,
  onOpenRoute,
}: {
  grade: string
  routes: SeasonalRouteProgress[]
  onOpenRoute?: (routeId: string) => void
}) {
  const total = routes.length
  const done = routes.filter((r) => r.completed).length
  const pct = total === 0 ? 0 : (done / total) * 100
  const label = grade.replace(/ \/ /g, '/').toUpperCase()

  return (
    <div className="seasonal-grade-bucket">
      <div className="seasonal-grade-head">
        <span className="seasonal-grade-label">{label}</span>
        <span className={`seasonal-grade-count ${done === total && total > 0 ? 'done' : ''}`}>
          {done === total && total > 0 ? 'Complete' : `${done}/${total}`}
        </span>
      </div>
      <div className="seasonal-grade-bar">
        <div className="seasonal-grade-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="seasonal-grade-routes">
        {routes.map((item, idx) => (
          <div key={item.route_id} className={idx < routes.length - 1 ? 'seasonal-route-divider' : ''}>
            <SeasonalRouteRow item={item} onOpenRoute={onOpenRoute} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChallengeBody({
  progress,
  onOpenRoute,
  onSignIn,
  isGuest,
}: {
  progress: SeasonalChallengeProgress
  onOpenRoute?: (routeId: string) => void
  onSignIn?: () => void
  isGuest: boolean
}) {
  const joinM = useJoinSeasonalChallenge()
  const buckets = useMemo(() => groupRoutesByGrade(progress.routes), [progress.routes])
  const pct = challengeProgressPct(progress)
  const daysLeft = daysLeftUntilEnd(progress.end_date)
  const windowPhrase = seasonWindowPhrase(progress.start_date, progress.end_date)

  return (
    <div className="seasonal-challenge-body">
      <div className="seasonal-challenge-hero-panel">
        <TopoLines />
        <div className="seasonal-challenge-hero-count">{progress.routes_total}</div>
        <div className="seasonal-challenge-hero-tag">routes to send</div>
      </div>

      {daysLeft != null && daysLeft >= 0 ? (
        <div className="seasonal-challenge-eyebrow">Seasonal · {daysLeft}d left</div>
      ) : null}

      <h2 className="seasonal-challenge-title">{progress.title}</h2>
      {progress.challenge_subtitle ? (
        <p className="seasonal-challenge-subtitle">{progress.challenge_subtitle}</p>
      ) : null}
      {windowPhrase ? <p className="seasonal-challenge-window">{windowPhrase}</p> : null}

      <div className="seasonal-progress-card">
        <div className="seasonal-progress-head">
          <span>Your progress</span>
          <strong>
            {progress.routes_completed_count}/{progress.routes_total}
          </strong>
        </div>
        <div className="seasonal-progress-bar">
          <div className="seasonal-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="seasonal-progress-pct">{pct}% complete</div>
      </div>

      {!progress.enrolled ? (
        <div className="seasonal-join-block">
          <p className="muted">
            Join to track progress and unlock the finisher badge for this season.
          </p>
          {isGuest ? (
            <button type="button" className="btn btn-primary" onClick={onSignIn}>
              Sign in to join
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={joinM.isPending}
              onClick={() => joinM.mutate(progress.challenge_id)}
            >
              {joinM.isPending ? 'Joining…' : 'Join challenge'}
            </button>
          )}
          {joinM.isError ? (
            <p className="seasonal-error">Could not join. Try again.</p>
          ) : null}
        </div>
      ) : null}

      <div className="seasonal-routes-section">
        <h3>Routes by grade</h3>
        {buckets.map((b) => (
          <GradeBucket
            key={b.grade}
            grade={b.grade}
            routes={b.routes}
            onOpenRoute={onOpenRoute}
          />
        ))}
      </div>
    </div>
  )
}

export function SeasonalChallengeDetailOverlay({
  challengeId,
  onClose,
  onOpenRoute,
  onSignIn,
  isGuest,
}: {
  challengeId: string
  onClose: () => void
  onOpenRoute?: (routeId: string) => void
  onSignIn?: () => void
  isGuest: boolean
}) {
  const progressQ = useSeasonalProgress(challengeId)

  const handleOpenRoute = (routeId: string) => {
    onClose()
    onOpenRoute?.(routeId)
  }

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div
        className="slideover seasonal-challenge-slideover"
        role="dialog"
        aria-label="Seasonal challenge"
      >
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div className="route-detail-head-title">Seasonal challenge</div>
          <span style={{ width: 36 }} />
        </div>
        <div className="slideover-body">
          {progressQ.isLoading && <p className="muted seasonal-loading">Loading challenge…</p>}
          {progressQ.isError && !progressQ.isLoading && (
            <p className="seasonal-error">Could not load this challenge.</p>
          )}
          {progressQ.data ? (
            <ChallengeBody
              progress={progressQ.data}
              onOpenRoute={handleOpenRoute}
              onSignIn={onSignIn}
              isGuest={isGuest}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
