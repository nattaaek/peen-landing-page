import { useEffect, useMemo, useState } from 'react'
import { Icon, SendBadge } from '../../components/Icon'
import { useCatalogRoute } from '../../hooks/useCatalog'
import {
  STEEPNESS_ANGLES,
  useActiveHazardsForRoute,
  usePublicRouteLogs,
  useLatestApproachVersion,
  useRouteTopoLinesForImages,
  useResolveHazardReport,
  useSubmitHazardReport,
  useRouteConsensus,
  useRouteRating,
  useToggleWishlist,
  useUpsertSteepnessVote,
  useWishlistRouteIds,
  useUpdateRoute,
} from '../../hooks/useMigration'
import { normalizeRouteId, wishlistIdsToSet } from '../../lib/routeIds'
import type { ApiRoute, RouteTopoLine } from '../../types/api'

function TopoImageWithLines({
  imageUrl,
  lines,
}: {
  imageUrl: string
  lines: RouteTopoLine[]
}) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src={imageUrl} alt="Topo photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {lines.length > 0 && (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          {lines.map((line) => {
            const pts = line.path_points ?? []
            if (pts.length === 0) return null
            const d = pts
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ')
            const first = pts[0]

            return (
              <g key={line.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={0.01}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                />
                {line.label ? (
                  <text
                    x={first.x}
                    y={first.y}
                    fill={line.color}
                    fontSize={0.035}
                    fontWeight={700}
                    dominantBaseline="central"
                    textAnchor="start"
                  >
                    {line.label}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

function SteepnessConsensusChart({
  topAngle,
}: {
  topAngle?: string | null
}) {
  // Designer prototype shows a 4-tile distribution. We only have `top_angle` + `votes`,
  // so we approximate the tile heights based on the top angle.
  const pct = useMemo(() => {
    const base = { slab: 6, vertical: 12, overhang: 72, roof: 10 }
    const a = (topAngle ?? '').toLowerCase()
    if (a === 'slab') return { slab: 66, vertical: 12, overhang: 10, roof: 12 }
    if (a === 'vertical') return { slab: 10, vertical: 66, overhang: 12, roof: 12 }
    if (a === 'roof') return { slab: 12, vertical: 10, overhang: 18, roof: 60 }
    if (a === 'tufa' || a === 'mixed') return { slab: 10, vertical: 12, overhang: 68, roof: 10 }
    // Includes 'overhang'/'overhung'
    return base
  }, [topAngle])

  const tiles = [
    { key: 'slab', label: 'Slab', pct: pct.slab },
    { key: 'vertical', label: 'Vertical', pct: pct.vertical },
    { key: 'overhang', label: 'Overhang', pct: pct.overhang },
    { key: 'roof', label: 'Roof', pct: pct.roof },
  ] as const

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {tiles.map((t) => {
        const isTop =
          (topAngle?.toLowerCase() === t.key) ||
          (t.key === 'overhang' && ['overhang', 'overhung', 'tufa', 'mixed'].includes(topAngle?.toLowerCase() ?? ''))
        return (
          <div key={t.key}>
            <div
              style={{
                height: 56,
                background: 'var(--surface)',
                borderRadius: 8,
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid var(--separator)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: isTop ? 'var(--tint)' : 'rgba(31,31,32,0.18)',
                  height: `${t.pct}%`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                marginTop: 6,
                textAlign: 'center',
                color: isTop ? 'var(--tint)' : 'var(--fg-2)',
              }}
            >
              {t.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', textAlign: 'center' }}>{t.pct}%</div>
          </div>
        )
      })}
    </div>
  )
}

export function RouteDetailOverlay({
  routeId,
  onClose,
  onLog,
  isGuest,
  onSignIn,
}: {
  routeId: string
  onClose: () => void
  onLog: (route: ApiRoute) => void
  isGuest: boolean
  onSignIn: () => void
}) {
  const [showTopoPlaceholder, setShowTopoPlaceholder] = useState(false)
  const [showHazardReport, setShowHazardReport] = useState(false)
  const [showEditRoute, setShowEditRoute] = useState(false)
  const [hazardType, setHazardType] = useState('rockfall')
  const [hazardSeverity, setHazardSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [hazardTitle, setHazardTitle] = useState('')
  const [hazardDescription, setHazardDescription] = useState('')
  const [activeHeroImageUrl, setActiveHeroImageUrl] = useState<string | null>(null)

  const routeQ = useCatalogRoute(routeId)
  const route = routeQ.data

  const sendsQ = usePublicRouteLogs(isGuest ? undefined : routeId)
  const ratingQ = useRouteRating(isGuest ? undefined : routeId)
  const consensusQ = useRouteConsensus(isGuest ? undefined : routeId)
  const vote = useUpsertSteepnessVote()

  const wishlistQ = useWishlistRouteIds()
  const toggleWishlist = useToggleWishlist()
  const wishlistIds = useMemo(() => wishlistIdsToSet(wishlistQ.data), [wishlistQ.data])
  const isInWishlist = routeId ? wishlistIds.has(normalizeRouteId(routeId)) : false

  const recentSends = sendsQ.data ?? []
  const recentTop3 = recentSends.slice(0, 3)

  const heroImageUrls = useMemo(() => {
    const urls = [
      ...(route?.gallery_images ?? []),
      ...(route?.images ?? []),
    ].filter(Boolean)
    return Array.from(new Set(urls))
  }, [route])

  useEffect(() => {
    setActiveHeroImageUrl(heroImageUrls[0] ?? null)
  }, [heroImageUrls])

  const topoQ = useRouteTopoLinesForImages({ routeId, imageUrls: heroImageUrls })

  const hazardsQ = useActiveHazardsForRoute(isGuest ? undefined : routeId)
  const resolveHazard = useResolveHazardReport()

  const latestApproachQ = useLatestApproachVersion(route?.area?.id)
  const submitHazard = useSubmitHazardReport()
  const updateRoute = useUpdateRoute()

  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLengthMeters, setEditLengthMeters] = useState<string>('')

  useEffect(() => {
    if (!showEditRoute) return
    if (!route) return
    setEditName(route.name ?? '')
    setEditGrade(route.grade ?? '')
    setEditDescription(route.description ?? '')
    setEditLengthMeters(route.length_meters != null ? String(route.length_meters) : '')
  }, [showEditRoute, route])

  const hazardTypeOptions = [
    { value: 'wildlife', label: 'Wildlife' },
    { value: 'rockfall', label: 'Rockfall' },
    { value: 'fixed_gear', label: 'Fixed Gear' },
    { value: 'access', label: 'Access' },
    { value: 'weather', label: 'Weather' },
    { value: 'other', label: 'Other' },
  ] as const

  const defaultExpiryDaysByType: Record<(typeof hazardTypeOptions)[number]['value'], number> = {
    wildlife: 7,
    rockfall: 30,
    fixed_gear: 90,
    access: 30,
    weather: 30,
    other: 30,
  }

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover" role="dialog">
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--fg-2)' }}>
            {route?.area?.name ?? route?.gym?.name ?? 'Route'}
          </div>
          <button type="button" className="icon-btn" aria-label="Share" onClick={() => {}}>
            <Icon name="share" size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="More"
            onClick={() => {
              if (isGuest) {
                onSignIn()
                return
              }
              setShowEditRoute(true)
            }}
          >
            <Icon name="more" size={18} />
          </button>
        </div>

        <div className="slideover-body">
          {routeQ.isLoading && <p className="muted">Loading route…</p>}
          {route && (
            <>
              <div
                style={{
                  height: 200,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--separator)',
                  overflow: 'hidden',
                  background: '#EDE7DE',
                  position: 'relative',
                }}
              >
                {activeHeroImageUrl ? (
                  <TopoImageWithLines
                    imageUrl={activeHeroImageUrl}
                    lines={(topoQ.data ?? []).filter((l) => l.image_url === activeHeroImageUrl)}
                  />
                ) : (
                  <div className="route-hero-placeholder" />
                )}
              </div>

              {heroImageUrls.length > 1 && (
                <div style={{ padding: '10px 24px 0', marginTop: -4 }}>
                  <div className="scroll-x" style={{ paddingBottom: 0 }}>
                    {heroImageUrls.map((url) => {
                      const active = url === activeHeroImageUrl
                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setActiveHeroImageUrl(url)}
                          className="icon-btn"
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            border: `1px solid ${active ? 'var(--tint)' : 'var(--separator)'}`,
                            background: '#fff',
                            padding: 0,
                            overflow: 'hidden',
                          }}
                          aria-label="Select photo"
                        >
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ padding: '16px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <h2 style={{ margin: 0, fontSize: 28, letterSpacing: -0.4 }}>{route.name}</h2>
                  {route.grade && (
                    <span className="chip" style={{ fontSize: 14, fontWeight: 700, height: 30 }}>
                      {route.grade}
                    </span>
                  )}
                </div>

                {ratingQ.data && (
                  <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                    ★ {ratingQ.data.avg_rating?.toFixed(1) ?? '—'} ({ratingQ.data.rating_count ?? 0} ratings)
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {(route.style_tags ?? []).slice(0, 4).map((s) => (
                    <span key={s} className="chip outline">
                      {s}
                    </span>
                  ))}
                  {route.length_meters != null && (
                    <span className="chip outline">{route.length_meters}m</span>
                  )}
                  {consensusQ.data?.top_angle && (
                    <span className="chip" style={{ background: 'var(--tint)', color: '#fff' }}>
                      {consensusQ.data.top_angle}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: '16px 24px 0' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: 220 }}
                    onClick={() => (isGuest ? onSignIn() : onLog(route))}
                  >
                    <Icon name="plus" size={16} /> Log a send
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: '0 0 auto' }}
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    disabled={toggleWishlist.isPending}
                    onClick={() => {
                      if (isGuest) {
                        onSignIn()
                        return
                      }
                      toggleWishlist.mutate({
                        routeId: normalizeRouteId(routeId),
                        save: !isInWishlist,
                      })
                    }}
                  >
                    <Icon name={isInWishlist ? 'bookmarkFilled' : 'bookmark'} size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: '0 0 auto' }}
                    onClick={() => {
                      if (isGuest) {
                        onSignIn()
                        return
                      }
                      setShowTopoPlaceholder(true)
                    }}
                  >
                    <Icon name="topo" size={16} /> Topo
                  </button>
                </div>
              </div>

              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ marginTop: 22 }}>
                  <h4 style={{ margin: 0 }}>Conditions</h4>
                  <div className="rail-card" style={{ marginTop: 12, padding: 14, display: 'flex', gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(140deg,#FFD27A,#FF9F33)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Icon name="sun" size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>Dry</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>Conditions details coming soon on web.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Icon name="chevR" size={18} />
                    </div>
                  </div>
                </div>

                {route.description && (
                  <p style={{ lineHeight: 1.5, marginTop: 16 }}>{route.description}</p>
                )}

                {!isGuest && (
                  <div style={{ marginTop: 22 }}>
                    <h4 style={{ margin: 0 }}>Recent sends</h4>
                    <div className="rail-card" style={{ padding: 0, marginTop: 12 }}>
                      {sendsQ.isLoading ? (
                        <div style={{ padding: 14 }} className="muted">
                          Loading sends…
                        </div>
                      ) : recentTop3.length === 0 ? (
                        <div style={{ padding: 14 }} className="muted">
                          No public sends on this route yet.
                        </div>
                      ) : (
                        recentTop3.map((log, i) => (
                          <div
                            key={log.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 16px',
                              borderBottom: i < recentTop3.length - 1 ? '1px solid var(--separator)' : 'none',
                            }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--separator)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {(log.profile?.nickname?.trim()?.[0] ?? '?').toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{log.profile?.nickname ?? 'Climber'}</div>
                              <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                                {log.grade ?? route.grade}
                              </div>
                            </div>
                            <SendBadge type={log.send_type} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {isGuest && (
                  <p className="muted" style={{ marginTop: 12 }}>
                    <button type="button" className="link-btn" onClick={onSignIn}>
                      Sign in
                    </button>{' '}
                    to see recent sends and vote on steepness.
                  </p>
                )}

                {!isGuest && (
                  <>
                    <div style={{ marginTop: 22 }}>
                      <h4 style={{ margin: 0 }}>Steepness consensus</h4>
                      <div className="rail-card" style={{ padding: 14, marginTop: 12 }}>
                        <SteepnessConsensusChart
                          topAngle={consensusQ.data?.top_angle}
                        />
                        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 8 }}>
                          Based on {consensusQ.data?.votes ?? 0} climber votes · agree?
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                        Vote how steep this route feels (same angles as iOS).
                      </p>
                      <div className="steepness-grid">
                        {STEEPNESS_ANGLES.map((angle) => (
                          <button
                            key={angle}
                            type="button"
                            className={`chip ${consensusQ.data?.top_angle === angle ? 'active' : ''}`}
                            disabled={vote.isPending}
                            onClick={() => vote.mutate({ route_id: route.id, angle })}
                          >
                            {angle}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ marginTop: 22 }}>
                  <h4 style={{ margin: 0 }}>Hazards</h4>
                  <div className="rail-card" style={{ padding: 14, marginTop: 12 }}>
                    {isGuest ? (
                      <div className="muted">
                        <button type="button" className="link-btn" onClick={onSignIn}>
                          Sign in
                        </button>{' '}
                        to view and resolve hazard reports.
                      </div>
                    ) : hazardsQ.isLoading ? (
                      <div className="muted">Loading hazards…</div>
                    ) : hazardsQ.data && hazardsQ.data.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowHazardReport(true)}>
                            Report hazard
                          </button>
                        </div>
                        {hazardsQ.data.map((h) => {
                          const color =
                            h.severity === 'low' ? '#F6D14D' : h.severity === 'high' ? '#D55A1F' : '#F08A24'
                          return (
                            <div
                              key={h.id}
                              style={{
                                border: '1px solid var(--separator)',
                                borderRadius: 12,
                                padding: 12,
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 12,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ height: 22, padding: '0 10px', borderRadius: 999, background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                                    {h.severity}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 700 }}>
                                    {h.hazard_type.replaceAll('_', ' ')}
                                  </span>
                                </div>
                                <div style={{ fontWeight: 800, marginTop: 8 }}>{h.title}</div>
                                {h.description ? <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.4 }}>{h.description}</div> : null}
                              </div>
                              <div style={{ flex: '0 0 auto' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ height: 36 }}
                                  disabled={resolveHazard.isPending}
                                  onClick={() => resolveHazard.mutate({ reportId: h.id })}
                                >
                                  Resolve
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="muted" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>No active hazard reports.</div>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowHazardReport(true)}>
                          Report hazard
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <h4 style={{ margin: 0 }}>Approach</h4>
                  <div className="rail-card" style={{ padding: 14, marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>From carpark</div>
                        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                          {route.area?.approach_minutes_from_carpark != null
                            ? `${route.area.approach_minutes_from_carpark} min`
                            : '—'}
                        </div>
                        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                          Walk-in angle: {route.area?.walk_in_angle ?? '—'}
                        </div>
                      </div>
                      <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                        <div style={{ fontWeight: 800 }}>Latest GPX</div>
                        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                          {route.area?.id && latestApproachQ.isLoading ? 'Loading…' : latestApproachQ.data && latestApproachQ.data[0] ? new Date(latestApproachQ.data[0].uploaded_at).toLocaleDateString() : '—'}
                        </div>
                        {route.area?.id && latestApproachQ.data && latestApproachQ.data[0]?.notes ? (
                          <div className="muted" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4 }}>
                            {latestApproachQ.data[0].notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showTopoPlaceholder && (
        <>
          <div className="modal-backdrop" onClick={() => setShowTopoPlaceholder(false)} role="presentation" />
          <div className="modal" role="dialog" aria-label="Topo placeholder">
            <div className="modal-head">
              <h3>Topo</h3>
              <button type="button" className="icon-btn" onClick={() => setShowTopoPlaceholder(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="modal-body">
              {topoQ.isLoading ? (
                <div className="muted">Loading topo lines…</div>
              ) : heroImageUrls.length === 0 ? (
                <div className="muted">No route photos available.</div>
              ) : (
                <div>
                  Loaded topo lines for {heroImageUrls.length} photo{heroImageUrls.length === 1 ? '' : 's'}.
                  <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                    Overlay rendering on images is implemented in the next parity step.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTopoPlaceholder(false)}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {showHazardReport && (
        <>
          <div className="modal-backdrop" onClick={() => setShowHazardReport(false)} role="presentation" />
          <div className="modal" role="dialog" aria-label="Report hazard">
            <div className="modal-head">
              <h3>Report hazard</h3>
              <button type="button" className="icon-btn" onClick={() => setShowHazardReport(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Hazard type</label>
                <select value={hazardType} onChange={(e) => setHazardType(e.target.value)}>
                  {hazardTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ height: 12 }} />
              <div className="field">
                <label>Severity</label>
                <select value={hazardSeverity} onChange={(e) => setHazardSeverity(e.target.value as 'low' | 'medium' | 'high')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ height: 12 }} />
              <div className="field">
                <label>Title</label>
                <input value={hazardTitle} onChange={(e) => setHazardTitle(e.target.value)} placeholder="Short summary" />
              </div>
              <div style={{ height: 12 }} />
              <div className="field">
                <label>Description (optional)</label>
                <textarea value={hazardDescription} onChange={(e) => setHazardDescription(e.target.value)} placeholder="Add more context" />
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-secondary" onClick={() => setShowHazardReport(false)} disabled={submitHazard.isPending}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const title = hazardTitle.trim()
                  if (!title) return
                  const days = defaultExpiryDaysByType[hazardType as keyof typeof defaultExpiryDaysByType] ?? 30
                  const expiresAtIso = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
                  submitHazard.mutate(
                    {
                      routeId,
                      hazardType,
                      severity: hazardSeverity,
                      title,
                      description: hazardDescription.trim() ? hazardDescription.trim() : undefined,
                      expiresAtIso,
                    },
                    {
                      onSuccess: () => {
                        setShowHazardReport(false)
                        setHazardTitle('')
                        setHazardDescription('')
                      },
                    },
                  )
                }}
                disabled={submitHazard.isPending || hazardTitle.trim().length === 0}
              >
                {submitHazard.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </>
      )}

      {showEditRoute && (
        <>
          <div className="modal-backdrop" onClick={() => setShowEditRoute(false)} role="presentation" />
          <div className="modal" role="dialog" aria-label="Edit route">
            <div className="modal-head">
              <h3>Edit route</h3>
              <button type="button" className="icon-btn" onClick={() => setShowEditRoute(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Route name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div style={{ height: 12 }} />
              <div className="field">
                <label>Grade</label>
                <input value={editGrade} onChange={(e) => setEditGrade(e.target.value)} placeholder="e.g. 6a" />
              </div>
              <div style={{ height: 12 }} />
              <div className="field">
                <label>Description (optional)</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Short description" />
              </div>
              <div style={{ height: 12 }} />
              <div className="field">
                <label>Length meters (optional)</label>
                <input
                  value={editLengthMeters}
                  onChange={(e) => setEditLengthMeters(e.target.value)}
                  placeholder="e.g. 32"
                />
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditRoute(false)} disabled={updateRoute.isPending}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={updateRoute.isPending || editName.trim().length === 0}
                onClick={() => {
                  const lengthNum = editLengthMeters.trim() ? Number(editLengthMeters.trim()) : undefined
                  updateRoute.mutate({
                    id: routeId,
                    name: editName.trim(),
                    grade: editGrade.trim() || undefined,
                    description: editDescription.trim() || undefined,
                    lengthMeters: lengthNum != null && !Number.isNaN(lengthNum) ? lengthNum : undefined,
                  }, {
                    onSuccess: () => setShowEditRoute(false),
                  })
                }}
              >
                {updateRoute.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
