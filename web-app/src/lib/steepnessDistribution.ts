export type AngleVoteCount = { angle: string; count: number }

export type SteepnessChartBuckets = {
  slab: number
  vertical: number
  overhang: number
  roof: number
  total: number
}

/** Map API angle labels into the four prototype chart buckets. */
export function bucketAngleVoteCounts(counts: AngleVoteCount[]): SteepnessChartBuckets {
  const buckets: SteepnessChartBuckets = { slab: 0, vertical: 0, overhang: 0, roof: 0, total: 0 }
  for (const row of counts) {
    const n = Math.max(0, row.count)
    if (n === 0) continue
    const a = row.angle.toLowerCase()
    if (a === 'slab') buckets.slab += n
    else if (a === 'vertical') buckets.vertical += n
    else if (a === 'roof') buckets.roof += n
    else if (a === 'overhang' || a === 'overhung' || a === 'tufa' || a === 'mixed') buckets.overhang += n
  }
  buckets.total = buckets.slab + buckets.vertical + buckets.overhang + buckets.roof
  return buckets
}

export function steepnessChartPercents(
  buckets: SteepnessChartBuckets,
): { slab: number; vertical: number; overhang: number; roof: number } {
  if (buckets.total <= 0) {
    return { slab: 0, vertical: 0, overhang: 0, roof: 0 }
  }
  const pct = (n: number) => Math.round((n / buckets.total) * 100)
  let slab = pct(buckets.slab)
  let vertical = pct(buckets.vertical)
  let overhang = pct(buckets.overhang)
  let roof = pct(buckets.roof)
  const sum = slab + vertical + overhang + roof
  if (sum !== 100 && buckets.total > 0) {
    const diff = 100 - sum
    const maxKey = (['slab', 'vertical', 'overhang', 'roof'] as const).reduce((best, k) =>
      buckets[k] > buckets[best] ? k : best,
    )
    if (maxKey === 'slab') slab += diff
    else if (maxKey === 'vertical') vertical += diff
    else if (maxKey === 'overhang') overhang += diff
    else roof += diff
  }
  return { slab, vertical, overhang, roof }
}
