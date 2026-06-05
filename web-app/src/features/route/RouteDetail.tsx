import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Icon } from '../../components/Icon'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useCatalogRoute } from '../../hooks/useCatalog'
import { ApproachGuideDrawer } from '../crags/ApproachGuideDrawer'
import {
  useActiveHazardsForRoute,
  useAngleVoteCounts,
  usePublicRouteLogs,
  useLatestApproachVersion,
  useMyLogsForRoute,
  useMySteepnessVote,
  useRoutePartners,
  useRouteTopoLines,
  useRouteTopoLinesForImages,
  useResolveHazardReport,
  useSubmitHazardReport,
  useRouteConsensus,
  useRouteRating,
  useToggleWishlist,
  useWishlistRouteIds,
  useUpdateRoute,
} from '../../hooks/useMigration'
import { useAuth } from '../auth/AuthProvider'
import {
  mergeUniqueUrls,
  uploadRouteGalleryPhoto,
  uploadRouteWallPhoto,
} from '../../lib/routePhotos'
import { LinkTopoPhotosSheet } from './LinkTopoPhotosSheet'
import { MyRouteLogsSheet } from './MyRouteLogsSheet'
import { PublicSendsSheet } from './PublicSendsSheet'
import { RouteDetailCommunityTabs } from './RouteDetailCommunityTabs'
import { RouteDetailLineage } from './RouteDetailLineage'
import {
  logPhotoUrlsFromSends,
  RouteDetailPhotosSection,
} from './RouteDetailPhotosSection'
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
import { STEEPNESS_ANGLE_META, normalizeSteepnessAngle, type SteepnessAngleId } from '../../domain/steepnessAngles'
import { SteepnessConsensusChart } from './SteepnessConsensusChart'
import { SteepnessVoteSheet } from './SteepnessVoteSheet'
import { SteepnessVoteTile } from './SteepnessVoteTile'
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
  onOpenRoute,
  isGuest,
  onSignIn,
  onToast,
}: {
  routeId: string
  onClose: () => void
  onLog: (route: ApiRoute) => void
  onOpenRoute?: (routeId: string) => void
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
  const [showMyLogs, setShowMyLogs] = useState(false)
  const [showAllPublicSends, setShowAllPublicSends] = useState(false)
  const [showLinkTopo, setShowLinkTopo] = useState(false)
  const [showSteepnessVote, setShowSteepnessVote] = useState(false)
  const [steepnessVoteSeed, setSteepnessVoteSeed] = useState<SteepnessAngleId | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [hazardType, setHazardType] = useState('rockfall')
  const [hazardSeverity, setHazardSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [hazardTitle, setHazardTitle] = useState('')
  const [hazardDescription, setHazardDescription] = useState('')
  const [activeHeroImageUrl, setActiveHeroImageUrl] = useState<string | null>(null)

  const { accessToken } = useAuth()
  const geo = useGeolocation()
  const routeQ = useCatalogRoute(routeId)
  const route = routeQ.data

  const sendsQ = usePublicRouteLogs(isGuest ? undefined : routeId)
  const partnersQ = useRoutePartners(isGuest ? undefined : routeId)
  const myLogsQ = useMyLogsForRoute(isGuest ? undefined : routeId)
  const ratingQ = useRouteRating(isGuest ? undefined : routeId)
  const consensusQ = useRouteConsensus(isGuest ? undefined : routeId)
  const angleCountsQ = useAngleVoteCounts(isGuest ? undefined : routeId)
  const myVoteQ = useMySteepnessVote(isGuest ? undefined : routeId)
  const updateRoute = useUpdateRoute()
  const submitHazard = useSubmitHazardReport()

  const wishlistQ = useWishlistRouteIds()
  const toggleWishlist = useToggleWishlist()
  const wishlistIds = useMemo(() => wishlistIdsToSet(wishlistQ.data), [wishlistQ.data])
  const isInWishlist = routeId ? wishlistIds.has(normalizeRouteId(routeId)) : false

  const publicLogs = sendsQ.data ?? []

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
    showTopoModal ||
    !!topoEditor ||
    showApproach ||
    showHazardReport ||
    showEditRoute ||
    showMyLogs ||
    showAllPublicSends ||
    showLinkTopo ||
    showSteepnessVote

  const existingImageUrls = useMemo(() => {
    return [...(route?.images ?? []), ...(route?.gallery_images ?? [])].filter(Boolean)
  }, [route?.images, route?.gallery_images])

  const logPhotoUrls = useMemo(() => logPhotoUrlsFromSends(publicLogs), [publicLogs])

  const handleLineRouteTap = (otherRouteId: string) => {
    if (otherRouteId === routeId) return
    onOpenRoute?.(otherRouteId)
  }

  const persistRouteImages = async (images: string[], galleryImages: string[]) => {
    if (!route) return
    await updateRoute.mutateAsync({
      id: routeId,
      name: route.name,
      grade: route.grade,
      description: route.description,
      lengthMeters: route.length_meters ?? undefined,
      styleTags: route.style_tags,
      images,
      galleryImages,
    })
  }

  const handleUploadGallery = async (file: File) => {
    if (!accessToken || !route) return
    setPhotoUploading(true)
    try {
      const url = await uploadRouteGalleryPhoto(accessToken, routeId, file)
      const gallery = mergeUniqueUrls(route.gallery_images ?? [], [url])
      await persistRouteImages(route.images ?? [], gallery)
      onToast?.('Gallery photo added')
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleUploadWall = async (file: File) => {
    if (!accessToken || !route) return
    setPhotoUploading(true)
    try {
      const url = await uploadRouteWallPhoto(accessToken, routeId, file)
      const images = mergeUniqueUrls(route.images ?? [], [url])
      await persistRouteImages(images, route.gallery_images ?? [])
      onToast?.('Wall photo added')
      setActiveHeroImageUrl(url)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleLinkTopoUrls = async (urls: string[]) => {
    if (!route || urls.length === 0) return
    setPhotoUploading(true)
    try {
      const images = mergeUniqueUrls(route.images ?? [], urls)
      await persistRouteImages(images, route.gallery_images ?? [])
      onToast?.(`Linked ${urls.length} photo${urls.length === 1 ? '' : 's'}`)
      if (urls[0]) setActiveHeroImageUrl(urls[0])
    } finally {
      setPhotoUploading(false)
    }
  }

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
  const myAngleNorm = normalizeSteepnessAngle(myAngle)

  const openSteepnessVote = (seed?: SteepnessAngleId | null) => {
    setSteepnessVoteSeed(seed ?? null)
    setShowSteepnessVote(true)
  }
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
                homeRouteId={routeId}
                onLineRouteTap={isGuest ? undefined : handleLineRouteTap}
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
                  consensusVotes={consensusQ.data?.votes}
                  isGuest={isGuest}
                  hazardCount={hazardCount}
                  onSteepnessVote={() => (isGuest ? onSignIn() : openSteepnessVote())}
                  onApproach={() => setShowApproach(true)}
                  onHazards={() => scrollToRef(hazardsRef)}
                />

                {!isGuest && (
                  <div ref={steepnessRef} className="route-steepness-block">
                    <div className="route-detail-section-head">
                      <h4 className="route-detail-section-title">Steepness consensus</h4>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openSteepnessVote()}>
                        Vote
                      </button>
                    </div>
                    <div className="rail-card route-steepness-card">
                      <SteepnessConsensusChart
                        topAngle={consensusQ.data?.top_angle}
                        voteCounts={angleCountsQ.data}
                      />
                      <div className="route-steepness-meta">
                        Based on {consensusQ.data?.votes ?? 0} climber votes
                        {angleCountsQ.data && angleCountsQ.data.length > 0 ? ' · live distribution' : ''}
                      </div>
                      <div className="steepness-vote-inline-scroll scroll-x">
                        {STEEPNESS_ANGLE_META.map((meta) => (
                          <SteepnessVoteTile
                            key={meta.id}
                            meta={meta}
                            compact
                            selected={
                              myAngleNorm === meta.id ||
                              normalizeSteepnessAngle(consensusQ.data?.top_angle) === meta.id
                            }
                            onSelect={() => openSteepnessVote(meta.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <h4 className="route-detail-section-title">Conditions</h4>
                <RouteConditionsCard area={route.area ?? undefined} />

                <RouteDetailLineage route={route} />

                {route.description && <p className="route-detail-description">{route.description}</p>}

                {!isGuest && (
                  <>
                    <div className="route-detail-section-head">
                      <h4 className="route-detail-section-title">Community</h4>
                      {(myLogsQ.data?.length ?? 0) > 0 && (
                        <button type="button" className="link-btn" onClick={() => setShowMyLogs(true)}>
                          My sends ({myLogsQ.data?.length})
                        </button>
                      )}
                    </div>
                    <RouteDetailCommunityTabs
                      publicLogs={publicLogs}
                      publicLoading={sendsQ.isLoading}
                      partners={partnersQ.data ?? []}
                      partnersLoading={partnersQ.isLoading}
                      fallbackGrade={route.grade}
                      onViewAllSends={() => setShowAllPublicSends(true)}
                    />
                    <RouteDetailPhotosSection
                      route={route}
                      logPhotoUrls={logPhotoUrls}
                      uploading={photoUploading}
                      onUploadGallery={handleUploadGallery}
                      onUploadWall={handleUploadWall}
                      onLinkPhotos={() => setShowLinkTopo(true)}
                    />
                  </>
                )}

                {isGuest && (
                  <p className="muted route-detail-guest-hint">
                    <button type="button" className="link-btn" onClick={onSignIn}>
                      Sign in
                    </button>{' '}
                    to see sends, partners, photos, and vote on steepness.
                  </p>
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
        homeRouteId={routeId}
        onLineRouteTap={isGuest ? undefined : handleLineRouteTap}
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

      <MyRouteLogsSheet
        open={showMyLogs}
        routeName={route?.name ?? 'Route'}
        logs={myLogsQ.data ?? []}
        loading={myLogsQ.isLoading}
        onClose={() => setShowMyLogs(false)}
      />

      <PublicSendsSheet
        open={showAllPublicSends}
        routeName={route?.name ?? 'Route'}
        logs={publicLogs}
        loading={sendsQ.isLoading}
        onClose={() => setShowAllPublicSends(false)}
      />

      <SteepnessVoteSheet
        open={showSteepnessVote}
        routeId={routeId}
        routeName={route?.name ?? 'Route'}
        savedAngle={myAngle}
        initialDraft={steepnessVoteSeed}
        onClose={() => {
          setShowSteepnessVote(false)
          setSteepnessVoteSeed(null)
        }}
        onVoted={() => onToast?.('Vote saved')}
      />

      <LinkTopoPhotosSheet
        open={showLinkTopo}
        routeId={routeId}
        areaId={route?.area_id}
        existingUrls={existingImageUrls}
        onClose={() => setShowLinkTopo(false)}
        onLink={(urls) => void handleLinkTopoUrls(urls)}
      />

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
