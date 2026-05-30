import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Icon, SendBadge } from '../../components/Icon'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useCatalogRoute } from '../../hooks/useCatalog'
import { ApproachGuideDrawer } from '../crags/ApproachGuideDrawer'
import {
  STEEPNESS_ANGLES,
  useActiveHazardsForRoute,
  useAngleVoteCounts,
  usePublicRouteLogs,
  useLatestApproachVersion,
  useMySteepnessVote,
  useRouteTopoLines,
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
import { buildRouteShareUrl } from '../../lib/routeDeepLink'
import { imageUrlMatches } from '../../lib/topoFittedLayout'
import { firstImageUrlWithTopo, normalizeTopoLines } from '../../lib/topoLines'
import { normalizeRouteId, parseRouteId, wishlistIdsToSet } from '../../lib/routeIds'
import { wishlistErrorMessage } from '../../lib/wishlistErrors'
import type { ApiRoute, RouteTopoLine } from '../../types/api'
import { RouteConditionsCard } from './RouteConditionsCard'
import { RouteDetailHero } from './RouteDetailHero'
import { RouteDetailStatGrid } from './RouteDetailStatGrid'
import { RouteTopoModal } from './RouteTopoModal'
import { SteepnessConsensusChart } from './SteepnessConsensusChart'
import { TopoLineEditor } from './TopoLineEditor'

async function shareRoute(route: ApiRoute, onToast?: (message: string) => void) {
  const place = route.area?.name ?? route.gym?.name ?? 'Peen'
  const text = `${route.name}${route.grade ? ` (${route.grade})` : ''} — ${place}`
  const url = buildRouteShareUrl(route.id)
  if (navigator.share) {
    try {
      await navigator.share({ title: route.name, text, url })
      return
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    onToast?.('Route link copied')
  } catch {
    onToast?.('Could not share route')
  }
}

export function RouteDetailOverlay({
  routeId: routeIdProp,
  onClose,
  onLog,
  isGuest,
  onSignIn,
  onToast,
}: {
  routeId: string
  onClose: () => void
  onLog: (route: ApiRoute) => void
  isGuest: boolean
  onSignIn: () => void
  onToast?: (message: string) => void
}) {
  const routeId = parseRouteId(routeIdProp) ?? routeIdProp
  const steepnessRef = useRef<HTMLDivElement>(null)
  const hazardsRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const [showTopoModal, setShowTopoModal] = useState(false)
  const [topoEditor, setTopoEditor] = useState<{ imageUrl: string; line?: RouteTopoLine } | null>(null)
  const [showApproach, setShowApproach] = useState(false)
  const [showHazardReport, setShowHazardReport] = useState(false)
  const [showEditRoute, setShowEditRoute] = useState(false)
  const [hazardType, setHazardType] = useState('rockfall')
  const [hazardSeverity, setHazardSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [hazardTitle, setHazardTitle] = useState('')
  const [hazardDescription, setHazardDescription] = useState('')
  const [activeHeroImageUrl, setActiveHeroImageUrl] = useState<string | null>(null)

  const geo = useGeolocation()
  const routeQ = useCatalogRoute(routeId)
  const route = routeQ.data

  const sendsQ = usePublicRouteLogs(isGuest ? undefined : routeId)
  const ratingQ = useRouteRating(isGuest ? undefined : routeId)
  const consensusQ = useRouteConsensus(isGuest ? undefined : routeId)
  const angleCountsQ = useAngleVoteCounts(isGuest ? undefined : routeId)
  const myVoteQ = useMySteepnessVote(isGuest ? undefined : routeId)
  const vote = useUpsertSteepnessVote()

  const wishlistQ = useWishlistRouteIds()
  const toggleWishlist = useToggleWishlist()
  const wishlistIds = useMemo(() => wishlistIdsToSet(wishlistQ.data), [wishlistQ.data])
  const isInWishlist = routeId ? wishlistIds.has(normalizeRouteId(routeId)) : false

  const recentTop3 = (sendsQ.data ?? []).slice(0, 3)

  const topoByRouteQ = useRouteTopoLines(isGuest ? undefined : routeId)

  const heroImageUrls = useMemo(() => {
    const urls = [...(route?.gallery_images ?? []), ...(route?.images ?? [])].filter(Boolean)
    for (const line of topoByRouteQ.data ?? []) {
      if (line.image_url) urls.push(line.image_url)
    }
    return Array.from(new Set(urls))
  }, [route, topoByRouteQ.data])

  const topoByImagesQ = useRouteTopoLinesForImages({
    routeId: isGuest ? undefined : routeId,
    imageUrls: heroImageUrls,
  })

  const allTopoLines = useMemo(() => {
    const map = new Map<string, RouteTopoLine>()
    for (const line of normalizeTopoLines([...(topoByRouteQ.data ?? []), ...(topoByImagesQ.data ?? [])])) {
      map.set(line.id, line)
    }
    return [...map.values()]
  }, [topoByRouteQ.data, topoByImagesQ.data])

  const stackModalOpen =
    showTopoModal || !!topoEditor || showApproach || showHazardReport || showEditRoute

  const openTopoModal = () => {
    const urlWithLine = firstImageUrlWithTopo(allTopoLines, heroImageUrls)
    if (urlWithLine) setActiveHeroImageUrl(urlWithLine)
    setShowTopoModal(true)
  }

  useEffect(() => {
    setActiveHeroImageUrl((prev) => {
      if (prev && heroImageUrls.some((u) => imageUrlMatches(u, prev))) return prev
      return firstImageUrlWithTopo(allTopoLines, heroImageUrls) ?? heroImageUrls[0] ?? null
    })
  }, [heroImageUrls, allTopoLines])

  useEffect(() => {
    if (!activeHeroImageUrl || allTopoLines.length === 0) return
    const onActive = allTopoLines.some((l) => imageUrlMatches(l.image_url, activeHeroImageUrl))
    if (onActive) return
    const other = firstImageUrlWithTopo(allTopoLines, heroImageUrls)
    if (other) setActiveHeroImageUrl(other)
  }, [allTopoLines, heroImageUrls, activeHeroImageUrl])

  const heroTopoLines = useMemo(() => {
    if (!activeHeroImageUrl) return []
    return allTopoLines.filter((l) => imageUrlMatches(l.image_url, activeHeroImageUrl))
  }, [allTopoLines, activeHeroImageUrl])

  const topoLoading = topoByRouteQ.isLoading || topoByImagesQ.isLoading

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
    if (!showEditRoute || !route) return
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

  const scrollToRef = (ref: RefObject<HTMLDivElement | null>) => {
    const body = bodyRef.current
    const target = ref.current
    if (!body || !target) return
    const top = target.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop
    body.scrollTo({ top: top - 12, behavior: 'smooth' })
  }

  const myAngle = myVoteQ.data?.angle ?? null
  const hazardCount = hazardsQ.data?.length ?? 0

  return (
    <>
      <div
        className="slideover-backdrop"
        onClick={() => {
          if (!stackModalOpen) onClose()
        }}
        role="presentation"
      />
      <div className="slideover route-detail-slideover" role="dialog">
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div className="route-detail-head-title">{route?.area?.name ?? route?.gym?.name ?? 'Route'}</div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Share"
            onClick={() => route && shareRoute(route, onToast)}
            disabled={!route}
          >
            <Icon name="share" size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="More"
            onClick={() => (isGuest ? onSignIn() : setShowEditRoute(true))}
          >
            <Icon name="more" size={18} />
          </button>
        </div>

        <div className="slideover-body" ref={bodyRef}>
          {routeQ.isLoading && <p className="muted route-detail-pad">Loading route…</p>}
          {route && (
            <>
              <RouteDetailHero
                imageUrls={heroImageUrls}
                activeImageUrl={activeHeroImageUrl}
                onSelectImage={setActiveHeroImageUrl}
                topoLines={heroTopoLines}
                onOpenTopo={openTopoModal}
              />

              <div className="route-detail-pad">
                <div className="route-detail-title-row">
                  <h2 className="route-detail-name">{route.name}</h2>
                  {route.grade && <span className="chip route-detail-grade">{route.grade}</span>}
                </div>

                {ratingQ.data && (
                  <p className="muted route-detail-rating">
                    ★ {ratingQ.data.avg_rating?.toFixed(1) ?? '—'} ({ratingQ.data.rating_count ?? 0} ratings)
                  </p>
                )}

                <div className="route-detail-chips">
                  {(route.style_tags ?? []).slice(0, 4).map((s) => (
                    <span key={s} className="chip outline">
                      {s}
                    </span>
                  ))}
                  {route.length_meters != null && <span className="chip outline">{route.length_meters}m</span>}
                  {consensusQ.data?.top_angle && (
                    <span className="chip route-detail-angle-chip">{consensusQ.data.top_angle}</span>
                  )}
                </div>

                <div className="route-detail-actions">
                  <button
                    type="button"
                    className="btn btn-primary route-detail-log-btn"
                    onClick={() => (isGuest ? onSignIn() : onLog(route))}
                  >
                    <Icon name="plus" size={16} /> Log a send
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    disabled={toggleWishlist.isPending}
                    onClick={() => {
                      if (isGuest) {
                        onSignIn()
                        return
                      }
                      toggleWishlist.mutate(
                        { routeId, save: !isInWishlist },
                        {
                          onSuccess: () =>
                            onToast?.(
                              !isInWishlist
                                ? `Added ${route.name} to wishlist`
                                : `Removed ${route.name} from wishlist`,
                            ),
                          onError: (err) => onToast?.(wishlistErrorMessage(err)),
                        },
                      )
                    }}
                  >
                    <Icon name={isInWishlist ? 'bookmarkFilled' : 'bookmark'} size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => (isGuest ? onSignIn() : openTopoModal())}
                  >
                    <Icon name="topo" size={16} /> Topo
                  </button>
                  {route.area && (
                    <button type="button" className="btn btn-secondary" onClick={() => setShowApproach(true)}>
                      <Icon name="pin" size={16} /> Approach
                    </button>
                  )}
                </div>

                <RouteDetailStatGrid
                  route={route}
                  topAngle={consensusQ.data?.top_angle}
                  hazardCount={hazardCount}
                  onSteepness={() => scrollToRef(steepnessRef)}
                  onApproach={() => setShowApproach(true)}
                  onHazards={() => scrollToRef(hazardsRef)}
                />

                <h4 className="route-detail-section-title">Conditions</h4>
                <RouteConditionsCard area={route.area ?? undefined} />

                {route.description && <p className="route-detail-description">{route.description}</p>}

                {!isGuest && (
                  <>
                    <h4 className="route-detail-section-title">Recent sends</h4>
                    <div className="rail-card route-sends-card">
                      {sendsQ.isLoading ? (
                        <div className="route-sends-row muted">Loading sends…</div>
                      ) : recentTop3.length === 0 ? (
                        <div className="route-sends-row muted">No public sends on this route yet.</div>
                      ) : (
                        recentTop3.map((log, i) => (
                          <div
                            key={log.id}
                            className="route-sends-row"
                            style={{ borderBottom: i < recentTop3.length - 1 ? '1px solid var(--separator)' : 'none' }}
                          >
                            <div className="route-sends-avatar">
                              {(log.profile?.nickname?.trim()?.[0] ?? '?').toUpperCase()}
                            </div>
                            <div className="route-sends-meta">
                              <div className="route-sends-name">{log.profile?.nickname ?? 'Climber'}</div>
                              <div className="route-sends-grade">{log.grade ?? route.grade}</div>
                            </div>
                            <SendBadge type={log.send_type} />
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {isGuest && (
                  <p className="muted route-detail-guest-hint">
                    <button type="button" className="link-btn" onClick={onSignIn}>
                      Sign in
                    </button>{' '}
                    to see recent sends and vote on steepness.
                  </p>
                )}

                {!isGuest && (
                  <div ref={steepnessRef}>
                    <h4 className="route-detail-section-title">Steepness consensus</h4>
                    <div className="rail-card route-steepness-card">
                      <SteepnessConsensusChart
                        topAngle={consensusQ.data?.top_angle}
                        voteCounts={angleCountsQ.data}
                      />
                      <div className="route-steepness-meta">
                        Based on {consensusQ.data?.votes ?? 0} climber votes
                        {angleCountsQ.data && angleCountsQ.data.length > 0 ? ' · live distribution' : ''} · agree?
                      </div>
                    </div>
                    <p className="muted route-steepness-hint">Vote how steep this route feels (same angles as iOS).</p>
                    <div className="steepness-grid">
                      {STEEPNESS_ANGLES.map((angle) => (
                        <button
                          key={angle}
                          type="button"
                          className={`chip ${myAngle === angle || consensusQ.data?.top_angle === angle ? 'active' : ''}`}
                          disabled={vote.isPending}
                          onClick={() => vote.mutate({ route_id: route.id, angle })}
                        >
                          {angle}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={hazardsRef}>
                  <h4 className="route-detail-section-title">Hazards</h4>
                  <div className="rail-card route-hazards-card">
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
                      <div className="route-hazards-list">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowHazardReport(true)}>
                          Report hazard
                        </button>
                        {hazardsQ.data.map((h) => {
                          const color =
                            h.severity === 'low' ? '#F6D14D' : h.severity === 'high' ? '#D55A1F' : '#F08A24'
                          return (
                            <div key={h.id} className="route-hazard-item">
                              <div>
                                <div className="route-hazard-tags">
                                  <span className="route-hazard-severity" style={{ background: color }}>
                                    {h.severity}
                                  </span>
                                  <span className="route-hazard-type">{h.hazard_type.replaceAll('_', ' ')}</span>
                                </div>
                                <div className="route-hazard-title">{h.title}</div>
                                {h.description ? <div className="route-hazard-desc">{h.description}</div> : null}
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary route-hazard-resolve"
                                disabled={resolveHazard.isPending}
                                onClick={() => resolveHazard.mutate({ reportId: h.id })}
                              >
                                Resolve
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="muted route-hazards-empty">
                        <div>No active hazard reports.</div>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowHazardReport(true)}>
                          Report hazard
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="route-detail-section-title">Approach</h4>
                <button
                  type="button"
                  className="rail-card route-approach-card"
                  onClick={() => route.area && setShowApproach(true)}
                  disabled={!route.area}
                >
                  <div>
                    <div className="route-approach-label">From carpark</div>
                    <div className="muted route-approach-value">
                      {route.area?.approach_minutes_from_carpark != null
                        ? `${route.area.approach_minutes_from_carpark} min`
                        : '—'}
                    </div>
                    <div className="muted route-approach-sub">Walk-in angle: {route.area?.walk_in_angle ?? '—'}</div>
                  </div>
                  <div className="route-approach-gpx">
                    <div className="route-approach-label">Latest GPX</div>
                    <div className="muted route-approach-value">
                      {route.area?.id && latestApproachQ.isLoading
                        ? 'Loading…'
                        : latestApproachQ.data?.[0]
                          ? new Date(latestApproachQ.data[0].uploaded_at).toLocaleDateString()
                          : '—'}
                    </div>
                    {latestApproachQ.data?.[0]?.notes ? (
                      <div className="muted route-approach-notes">{latestApproachQ.data[0].notes}</div>
                    ) : null}
                  </div>
                  <Icon name="chevR" size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <RouteTopoModal
        open={showTopoModal && !topoEditor}
        onClose={() => setShowTopoModal(false)}
        imageUrls={heroImageUrls}
        activeImageUrl={activeHeroImageUrl}
        onSelectImage={setActiveHeroImageUrl}
        lines={allTopoLines}
        loading={topoLoading}
        isGuest={isGuest}
        onSignIn={onSignIn}
        onDrawTopo={(imageUrl) => {
          setShowTopoModal(false)
          setTopoEditor({ imageUrl })
        }}
        onEditLine={(line) => {
          setShowTopoModal(false)
          setTopoEditor({ imageUrl: line.image_url, line })
        }}
      />

      {topoEditor && (
        <TopoLineEditor
          routeId={routeId}
          imageUrl={topoEditor.imageUrl}
          existingLine={topoEditor.line}
          onClose={() => {
            setTopoEditor(null)
            setShowTopoModal(true)
          }}
          onSaved={() => {
            setTopoEditor(null)
            setShowTopoModal(true)
          }}
        />
      )}

      <ApproachGuideDrawer
        area={route?.area ?? null}
        open={showApproach}
        userLat={geo.point?.lat}
        userLng={geo.point?.lng}
        onClose={() => setShowApproach(false)}
        onSignIn={() => onSignIn()}
        onToast={onToast}
      />

      {showHazardReport && (
        <>
          <div
            className="modal-backdrop route-stack-modal-backdrop"
            onClick={() => setShowHazardReport(false)}
            role="presentation"
          />
          <div
            className="modal route-stack-modal"
            role="dialog"
            aria-label="Report hazard"
            onClick={(e) => e.stopPropagation()}
          >
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
                <select
                  value={hazardSeverity}
                  onChange={(e) => setHazardSeverity(e.target.value as 'low' | 'medium' | 'high')}
                >
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
                <textarea
                  value={hazardDescription}
                  onChange={(e) => setHazardDescription(e.target.value)}
                  placeholder="Add more context"
                />
              </div>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowHazardReport(false)}
                disabled={submitHazard.isPending}
              >
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
                      description: hazardDescription.trim() || undefined,
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
          <div
            className="modal-backdrop route-stack-modal-backdrop"
            onClick={() => setShowEditRoute(false)}
            role="presentation"
          />
          <div
            className="modal route-stack-modal"
            role="dialog"
            aria-label="Edit route"
            onClick={(e) => e.stopPropagation()}
          >
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
                <input value={editLengthMeters} onChange={(e) => setEditLengthMeters(e.target.value)} placeholder="e.g. 32" />
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
                  updateRoute.mutate(
                    {
                      id: routeId,
                      name: editName.trim(),
                      grade: editGrade.trim() || undefined,
                      description: editDescription.trim() || undefined,
                      lengthMeters: lengthNum != null && !Number.isNaN(lengthNum) ? lengthNum : undefined,
                    },
                    { onSuccess: () => setShowEditRoute(false) },
                  )
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
