import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Icon } from '../../components/Icon'
import { invalidateCatalogCache } from '../../lib/catalogSearch'
import { useAuth } from '../auth/AuthProvider'
import { useCatalogAllRoutes, useCatalogAreas, useCatalogGyms } from '../../hooks/useCatalog'
import { useGeolocation } from '../../hooks/useGeolocation'
import {
  formatCragDistance,
  gradeBandLabel,
  haversineKm,
  layersChipLabel,
  resolveAreaCoordinate,
  resolveGymCoordinate,
  routesForPlace,
  wallCountForRoutes,
} from '../../lib/cragStats'
import {
  applyCragListFilters,
  countActiveCragFilters,
  DEFAULT_CRAG_LIST_FILTERS,
  type CragListFilters,
  type CragSortOption,
} from '../../lib/cragListFilters'
import type { ApiArea, ApiGym, ApiRoute } from '../../types/api'
import { ActiveCragPanel } from './ActiveCragPanel'
import { ApproachGuideDrawer } from './ApproachGuideDrawer'
import { AreaRoutesSheet } from './AreaRoutesSheet'
import { CragThumb, type CragPanelRow } from './CragShared'
import { CreateRouteSheet } from './CreateRouteSheet'
import { CragsFilterSortSheet } from './CragsFilterSortSheet'
import { CragsMap, type CragMapPin, type CragsMapHandle } from './CragsMap'

type CragKind = 'area' | 'gym'

function buildCragRow(
  kind: CragKind,
  place: ApiArea | ApiGym,
  routes: ApiRoute[],
  userLat: number | null,
  userLng: number | null,
): CragPanelRow {
  const placeRoutes = routesForPlace(routes, place.id, kind)
  const coord =
    kind === 'area'
      ? resolveAreaCoordinate(place as ApiArea, placeRoutes)
      : resolveGymCoordinate(place as ApiGym)

  let distanceKm: number | null = null
  if (userLat != null && userLng != null && coord) {
    distanceKm = haversineKm(userLat, userLng, coord.lat, coord.lng)
  }

  return {
    id: place.id,
    kind,
    name: place.name,
    regionOrAddress: kind === 'area' ? (place as ApiArea).region : (place as ApiGym).address,
    routeCount: placeRoutes.length,
    wallCount: wallCountForRoutes(placeRoutes),
    distanceKm,
    lat: coord?.lat ?? null,
    lng: coord?.lng ?? null,
  }
}

export function CragsView({
  onOpenRoute,
  onSignIn,
  onToast,
}: {
  onOpenRoute: (route: ApiRoute) => void
  onSignIn?: (message?: string) => void
  onToast?: (msg: string) => void
}) {
  const { accessToken } = useAuth()
  const qc = useQueryClient()
  const location = useLocation()
  const isGuest = !accessToken
  const [filter, setFilter] = useState<'all' | 'crags' | 'gym'>('all')
  const [query, setQuery] = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [previewHidden, setPreviewHidden] = useState(false)
  const [approachArea, setApproachArea] = useState<ApiArea | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [routesSheetOpen, setRoutesSheetOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [listFilters, setListFilters] = useState<CragListFilters>(DEFAULT_CRAG_LIST_FILTERS)
  const [listSort, setListSort] = useState<CragSortOption>('name')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [filterSheetTab, setFilterSheetTab] = useState<'filter' | 'sort'>('filter')
  const mapRef = useRef<CragsMapHandle>(null)
  const { point: userPoint } = useGeolocation()
  const hasLocation = userPoint != null

  const areasQ = useCatalogAreas()
  const gymsQ = useCatalogGyms()
  const routesQ = useCatalogAllRoutes()

  const routes = routesQ.data ?? []
  const areas = areasQ.data ?? []
  const userLat = userPoint?.lat ?? null
  const userLng = userPoint?.lng ?? null

  const baseCrags = useMemo((): CragPanelRow[] => {
    const gyms: ApiGym[] = gymsQ.data ?? []
    const q = query.trim().toLowerCase()

    const areaRows = areas
      .filter(() => filter !== 'gym')
      .filter((a) => (!q ? true : a.name.toLowerCase().includes(q)))
      .map((a) => buildCragRow('area', a, routes, userLat, userLng))
      .filter((c) => (routes.length ? c.routeCount > 0 : true))

    const gymRows = gyms
      .filter(() => filter !== 'crags')
      .filter((g) => (!q ? true : g.name.toLowerCase().includes(q)))
      .map((g) => buildCragRow('gym', g, routes, userLat, userLng))
      .filter((c) => (routes.length ? c.routeCount > 0 : true))

    return [...areaRows, ...gymRows]
  }, [areas, gymsQ.data, routes, filter, query, userLat, userLng])

  const allCrags = useMemo(
    () => applyCragListFilters(baseCrags, listFilters, listSort, hasLocation),
    [baseCrags, listFilters, listSort, hasLocation],
  )

  const activeFilterCount = countActiveCragFilters(listFilters, hasLocation)

  const activeCrag = useMemo(() => {
    if (!activeKey) return allCrags[0] ?? null
    return allCrags.find((c) => `${c.kind}:${c.id}` === activeKey) ?? allCrags[0] ?? null
  }, [activeKey, allCrags])

  const activeRoutes = useMemo(() => {
    if (!activeCrag) return []
    const list = routesForPlace(routes, activeCrag.id, activeCrag.kind)
    return [...list].sort(
      (a, b) => (b.grade ?? '').localeCompare(a.grade ?? '') || a.name.localeCompare(b.name),
    )
  }, [activeCrag, routes])

  const mapPins = useMemo((): CragMapPin[] => {
    return allCrags
      .filter((c): c is CragPanelRow & { lat: number; lng: number } => c.lat != null && c.lng != null)
      .map((c) => ({ id: c.id, kind: c.kind, name: c.name, lat: c.lat, lng: c.lng }))
  }, [allCrags])

  const overlayLayers = useMemo(
    () => (activeCrag?.kind === 'area' ? layersChipLabel(activeRoutes) : null),
    [activeCrag, activeRoutes],
  )
  const overlayGrades = useMemo(
    () => gradeBandLabel(activeRoutes.map((r) => r.grade ?? '').filter(Boolean)),
    [activeRoutes],
  )

  useEffect(() => {
    if (activeKey && allCrags.some((c) => `${c.kind}:${c.id}` === activeKey)) return
    if (allCrags.length > 0) setActiveKey(`${allCrags[0].kind}:${allCrags[0].id}`)
  }, [activeKey, allCrags])

  useEffect(() => {
    const pinName = (location.state as { pinName?: string } | null)?.pinName
    if (!pinName || allCrags.length === 0) return
    const match = allCrags.find((c) => c.name.toLowerCase() === pinName.toLowerCase())
    if (match) {
      setActiveKey(`${match.kind}:${match.id}`)
      setPreviewHidden(false)
    }
  }, [location.state, allCrags])

  const selectCrag = (key: string) => {
    setActiveKey(key)
    setPreviewHidden(false)
  }

  const openCreateRoute = () => {
    if (isGuest) {
      onSignIn?.('Sign in to suggest a new route.')
      return
    }
    setCreateOpen(true)
  }

  const refreshCatalog = async () => {
    setRefreshing(true)
    try {
      invalidateCatalogCache()
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['catalog', 'areas'] }),
        qc.invalidateQueries({ queryKey: ['catalog', 'gyms'] }),
        qc.invalidateQueries({ queryKey: ['catalog', 'routes', 'all'] }),
      ])
      onToast?.('Crags refreshed')
    } finally {
      setRefreshing(false)
    }
  }

  const centerOnUser = () => {
    if (userLat == null || userLng == null) {
      onToast?.('Enable location to center the map on you.')
      return
    }
    mapRef.current?.flyTo(userLng, userLat, 11)
  }

  return (
    <div className="crags-split">
      <div className="crags-list">
        <div className="crag-list-head">
          <h1 className="page-title" style={{ fontSize: 24, marginBottom: 4 }}>
            Crags & gyms
          </h1>
          <div className="page-sub" style={{ marginBottom: 14 }}>
            {allCrags.length} locations
            {hasLocation ? ` · within ${Math.round(listFilters.maxDistanceKm)} km` : ''}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(
              [
                ['all', 'All'],
                ['crags', 'Outdoor'],
                ['gym', 'Gyms'],
              ] as const
            ).map(([f, lbl]) => (
              <button
                key={f}
                className="chip"
                style={{
                  background: filter === f ? 'var(--peen-charcoal)' : 'var(--surface)',
                  color: filter === f ? '#fff' : 'var(--fg-1)',
                  cursor: 'pointer',
                  height: 30,
                  padding: '0 14px',
                }}
                type="button"
                onClick={() => setFilter(f)}
              >
                {lbl}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button
                className={`icon-btn ${activeFilterCount > 0 ? 'icon-btn-active' : ''}`}
                aria-label="Filter"
                type="button"
                onClick={() => {
                  setFilterSheetTab('filter')
                  setFilterSheetOpen(true)
                }}
              >
                <Icon name="filter" size={18} />
                {activeFilterCount > 0 && (
                  <span className="icon-btn-badge">{activeFilterCount}</span>
                )}
              </button>
              <button
                className="icon-btn"
                aria-label="Sort"
                type="button"
                onClick={() => {
                  setFilterSheetTab('sort')
                  setFilterSheetOpen(true)
                }}
              >
                <Icon name="sort" size={18} />
              </button>
            </div>
          </div>

          <label className="search" style={{ flex: 1, height: 36 }}>
            <Icon name="search" size={14} />
            <input placeholder="Filter by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        <div>
          {allCrags.map((c) => {
            const key = `${c.kind}:${c.id}`
            const kindLabel = c.kind === 'gym' ? 'gym' : 'crag'
            return (
              <div
                key={key}
                className={`crag-row ${activeCrag && `${activeCrag.kind}:${activeCrag.id}` === key ? 'active' : ''}`}
                onClick={() => selectCrag(key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectCrag(key)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <CragThumb crag={c} />
                <div className="info">
                  <div className="name">{c.name}</div>
                  <div className="meta">
                    <span>
                      <Icon name="pin" size={12} />
                      {c.regionOrAddress ?? '—'}
                    </span>
                    {gradeBandLabel(
                      routesForPlace(routes, c.id, c.kind)
                        .map((r) => r.grade ?? '')
                        .filter(Boolean),
                    ) && (
                      <span>
                        <Icon name="grade" size={12} />
                        {gradeBandLabel(
                          routesForPlace(routes, c.id, c.kind)
                            .map((r) => r.grade ?? '')
                            .filter(Boolean),
                        )}
                      </span>
                    )}
                    <span>
                      {c.routeCount} routes · {c.wallCount} walls
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="chip outline" style={{ fontWeight: 700 }}>
                    {formatCragDistance(c.distanceKm)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--fg-2)',
                      marginTop: 4,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      fontWeight: 700,
                    }}
                  >
                    {kindLabel}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="crags-map">
        <CragsMap
          ref={mapRef}
          pins={mapPins}
          selectedId={activeCrag?.id ?? null}
          onSelect={(id, kind) => selectCrag(`${kind}:${id}`)}
        />

        <div className="map-overlay">
          {overlayLayers && (
            <div className="map-chip">
              <Icon name="layers" size={14} /> {overlayLayers}
            </div>
          )}
          {overlayGrades && (
            <div className="map-chip">
              <Icon name="grade" size={14} /> {overlayGrades}
            </div>
          )}
          <button
            type="button"
            className="btn-log"
            style={{ marginLeft: 'auto', height: 32, fontSize: 13 }}
            onClick={openCreateRoute}
          >
            <Icon name="plus" size={14} /> Add route here
          </button>
        </div>

        <div className="map-fabs">
          {userPoint && (
            <button type="button" className="map-fab" aria-label="Center on my location" onClick={centerOnUser}>
              <Icon name="pin" size={18} />
            </button>
          )}
          <button
            type="button"
            className="map-fab"
            aria-label="Refresh crags"
            disabled={refreshing}
            onClick={() => void refreshCatalog()}
          >
            <Icon name="refresh" size={18} />
          </button>
        </div>

        <div className="map-zoom">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
            <Icon name="plus" size={18} />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>–</span>
          </button>
        </div>

        {activeCrag && !previewHidden && (
          <ActiveCragPanel
            crag={activeCrag}
            routes={activeRoutes}
            onDismiss={() => setPreviewHidden(true)}
            onOpenRoute={onOpenRoute}
            onApproach={
              activeCrag.kind === 'area'
                ? () => {
                    const area = areas.find((a) => a.id === activeCrag.id)
                    if (area) setApproachArea(area)
                  }
                : undefined
            }
            onAddRoute={openCreateRoute}
            onShowAllRoutes={activeRoutes.length > 3 ? () => setRoutesSheetOpen(true) : undefined}
          />
        )}

        {routesQ.isLoading && (
          <div style={{ position: 'absolute', top: 16, left: 16 }} className="muted">
            Loading routes…
          </div>
        )}
        {routesQ.isError && (
          <div style={{ position: 'absolute', top: 16, left: 16 }} className="error">
            Could not load routes.
          </div>
        )}
      </div>

      <CragsFilterSortSheet
        open={filterSheetOpen}
        tab={filterSheetTab}
        onClose={() => setFilterSheetOpen(false)}
        draftFilters={listFilters}
        draftSort={listSort}
        previewRows={baseCrags}
        hasLocation={hasLocation}
        onApply={(f, s) => {
          setListFilters(f)
          setListSort(s)
        }}
      />

      <ApproachGuideDrawer
        area={approachArea}
        open={!!approachArea}
        userLat={userLat}
        userLng={userLng}
        onClose={() => setApproachArea(null)}
        onSignIn={onSignIn}
        onToast={onToast}
      />

      <AreaRoutesSheet
        open={routesSheetOpen}
        cragName={activeCrag?.name ?? 'Routes'}
        routes={activeRoutes}
        onClose={() => setRoutesSheetOpen(false)}
        onOpenRoute={onOpenRoute}
      />

      {activeCrag && (
        <CreateRouteSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          placeName={activeCrag.name}
          areaId={activeCrag.kind === 'area' ? activeCrag.id : null}
          gymId={activeCrag.kind === 'gym' ? activeCrag.id : null}
          latitude={activeCrag.lat}
          longitude={activeCrag.lng}
          onCreated={(route) => {
            onToast?.(`Added ${route.name}`)
            onOpenRoute(route)
          }}
        />
      )}
    </div>
  )
}
