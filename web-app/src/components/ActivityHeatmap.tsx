import { useMemo } from 'react'
import type { ClimbLogRow } from '../types/api'

const WEEKS = 12
const DAYS = 7

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function cellColor(count: number): string {
  if (count <= 0) return 'var(--surface)'
  if (count === 1) return 'rgba(69, 155, 81, 0.3)'
  if (count <= 3) return 'rgba(69, 155, 81, 0.6)'
  return 'var(--peen-green)'
}

export function ActivityHeatmap({ logs }: { logs: ClimbLogRow[] }) {
  const { grid, sessionCount, climbCount, streak, monthLabels } = useMemo(() => {
    const today = startOfDay(new Date())
    const weekday = (today.getDay() + 6) % 7
    const startOfWeek = addDays(today, -weekday)
    const gridStart = addDays(startOfWeek, -7 * (WEEKS - 1))

    const activityByDay = new Map<string, number>()
    const sessionDays = new Set<string>()
    for (const log of logs) {
      const raw = log.climbed_date ?? log.created_at
      if (!raw) continue
      const key = startOfDay(new Date(raw)).toISOString()
      activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1)
      sessionDays.add(key)
    }

    let streak = 0
    for (let i = 0; i < 400; i++) {
      const key = startOfDay(addDays(today, -i)).toISOString()
      if (sessionDays.has(key)) streak++
      else if (i > 0) break
    }

    const weeks: { date: Date; count: number }[][] = []
    for (let w = 0; w < WEEKS; w++) {
      const week: { date: Date; count: number }[] = []
      for (let d = 0; d < DAYS; d++) {
        const date = addDays(gridStart, w * 7 + d)
        const key = startOfDay(date).toISOString()
        week.push({ date, count: activityByDay.get(key) ?? 0 })
      }
      weeks.push(week)
    }

    const labels: { label: string; week: number }[] = []
    let lastMonth = -1
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short' })
    for (let w = 0; w < WEEKS; w++) {
      const d = addDays(gridStart, w * 7)
      const m = d.getMonth()
      if (m !== lastMonth) {
        labels.push({ label: fmt.format(d), week: w })
        lastMonth = m
      }
    }

    return {
      grid: weeks,
      sessionCount: sessionDays.size,
      climbCount: logs.length,
      streak,
      monthLabels: labels,
    }
  }, [logs])

  const today = startOfDay(new Date())

  return (
    <section className="activity-heatmap rail-card">
      <div className="activity-heatmap-head">
        <div>
          <h3 style={{ margin: 0, fontSize: 17 }}>Activity</h3>
          <p className="muted" style={{ fontSize: 12, margin: '4px 0 0' }}>
            {sessionCount} session{sessionCount === 1 ? '' : 's'} · {climbCount} climb
            {climbCount === 1 ? '' : 's'}
          </p>
        </div>
        {streak > 0 && (
          <span className="activity-streak">
            <span aria-hidden>🔥</span> {streak} day streak
          </span>
        )}
      </div>

      <div
        className="activity-heatmap-months"
        style={{ gridTemplateColumns: `18px repeat(${WEEKS}, minmax(0, 1fr))` }}
      >
        <span />
        {Array.from({ length: WEEKS }, (_, w) => {
          const label = monthLabels.find((m) => m.week === w)?.label
          return (
            <span key={w} className="activity-heatmap-month">
              {label ?? ''}
            </span>
          )
        })}
      </div>

      <div className="activity-heatmap-body">
        {Array.from({ length: DAYS }, (_, d) => (
          <div
            key={d}
            className="activity-heatmap-row"
            style={{ gridTemplateColumns: `18px repeat(${WEEKS}, minmax(0, 1fr))` }}
          >
            <span className="activity-heatmap-day-label">{d % 2 === 0 ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][d] : ''}</span>
            {grid.map((week, w) => {
              const cell = week[d]
              const isFuture = cell.date > today
              return (
                <span
                  key={w}
                  className="activity-heatmap-cell"
                  style={{
                    background: isFuture ? 'var(--surface)' : cellColor(cell.count),
                    opacity: isFuture ? 0.35 : 1,
                  }}
                  title={`${cell.date.toLocaleDateString()}: ${cell.count} climb${cell.count === 1 ? '' : 's'}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="activity-heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 4].map((n) => (
          <span key={n} className="activity-heatmap-cell" style={{ background: cellColor(n) }} />
        ))}
        <span>More</span>
      </div>
    </section>
  )
}
