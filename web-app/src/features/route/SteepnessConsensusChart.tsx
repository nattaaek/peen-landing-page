import { useMemo } from 'react'
import {
  bucketAngleVoteCounts,
  steepnessChartPercents,
  type AngleVoteCount,
} from '../../lib/steepnessDistribution'

function approximatePercents(topAngle?: string | null) {
  const base = { slab: 6, vertical: 12, overhang: 72, roof: 10 }
  const a = (topAngle ?? '').toLowerCase()
  if (a === 'slab') return { slab: 66, vertical: 12, overhang: 10, roof: 12 }
  if (a === 'vertical') return { slab: 10, vertical: 66, overhang: 12, roof: 12 }
  if (a === 'roof') return { slab: 12, vertical: 10, overhang: 18, roof: 60 }
  if (a === 'tufa' || a === 'mixed') return { slab: 10, vertical: 12, overhang: 68, roof: 10 }
  return base
}

export function SteepnessConsensusChart({
  topAngle,
  voteCounts,
}: {
  topAngle?: string | null
  voteCounts?: AngleVoteCount[] | null
}) {
  const pct = useMemo(() => {
    if (voteCounts && voteCounts.length > 0) {
      return steepnessChartPercents(bucketAngleVoteCounts(voteCounts))
    }
    return approximatePercents(topAngle)
  }, [voteCounts, topAngle])

  const tiles = [
    { key: 'slab', label: 'Slab', pct: pct.slab },
    { key: 'vertical', label: 'Vertical', pct: pct.vertical },
    { key: 'overhang', label: 'Overhang', pct: pct.overhang },
    { key: 'roof', label: 'Roof', pct: pct.roof },
  ] as const

  return (
    <div className="steepness-chart-grid">
      {tiles.map((t) => {
        const isTop =
          topAngle?.toLowerCase() === t.key ||
          (t.key === 'overhang' && ['overhang', 'overhung', 'tufa', 'mixed'].includes(topAngle?.toLowerCase() ?? ''))
        return (
          <div key={t.key}>
            <div className="steepness-chart-bar">
              <div
                className={`steepness-chart-fill${isTop ? ' steepness-chart-fill-top' : ''}`}
                style={{ height: `${t.pct}%` }}
              />
            </div>
            <div className={`steepness-chart-label${isTop ? ' steepness-chart-label-top' : ''}`}>{t.label}</div>
            <div className="steepness-chart-pct">{t.pct}%</div>
          </div>
        )
      })}
    </div>
  )
}
