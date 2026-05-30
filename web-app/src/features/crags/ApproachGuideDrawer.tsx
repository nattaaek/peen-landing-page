import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Icon } from '../../components/Icon'
import { useAuth } from '../auth/AuthProvider'
import { useLatestApproachVersion, useRecordApproachGPXVersion } from '../../hooks/useMigration'
import {
  approachGpxPublicUrl,
  fetchApproachGpxXml,
  parseGpxTrack,
  resolveApproachStoragePath,
  uploadApproachGpxFiles,
  type GpxPoint,
} from '../../lib/approachGpx'
import { formatCragDistance, haversineKm } from '../../lib/cragStats'
import type { ApiArea } from '../../types/api'

export function ApproachGuideDrawer({
  area,
  open,
  userLat,
  userLng,
  onClose,
  onSignIn,
  onToast,
}: {
  area: ApiArea | null
  open: boolean
  userLat?: number | null
  userLng?: number | null
  onClose: () => void
  onSignIn?: (message?: string) => void
  onToast?: (msg: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const latestQ = useLatestApproachVersion(open && area ? area.id : undefined)
  const recordVersion = useRecordApproachGPXVersion()
  const { accessToken } = useAuth()
  const [track, setTrack] = useState<GpxPoint[]>([])
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle')
  const [gpxPath, setGpxPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const loadTrack = useCallback(
    async (force = false) => {
      if (!area) return
      if (accessToken && latestQ.isLoading && !force) return

      setLoadState('loading')
      setUploadError(null)
      try {
        const path = resolveApproachStoragePath(area.id, latestQ.data?.[0] ?? null)
        const xml = await fetchApproachGpxXml(path)
        if (!xml) {
          setTrack([])
          setGpxPath(null)
          setLoadState('missing')
          return
        }
        const pts = parseGpxTrack(xml)
        if (pts.length === 0) {
          setTrack([])
          setGpxPath(null)
          setLoadState('missing')
          return
        }
        setGpxPath(path)
        setTrack(pts)
        setLoadState('ready')
      } catch {
        setTrack([])
        setGpxPath(null)
        setLoadState('error')
      }
    },
    [area, accessToken, latestQ.data, latestQ.isLoading],
  )

  useEffect(() => {
    if (!open || !area) {
      setTrack([])
      setGpxPath(null)
      setLoadState('idle')
      setUploadError(null)
      return
    }
    void loadTrack()
  }, [open, area, loadTrack])

  useEffect(() => {
    if (!open || !containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: area?.longitude != null && area?.latitude != null ? [area.longitude, area.latitude] : [98.98, 18.79],
      zoom: 12,
      attributionControl: false,
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [open, area?.id])

  useEffect(() => {
    const map = mapRef.current
    if (!map || track.length === 0) return

    const coords = track.map((p) => [p.lng, p.lat] as [number, number])
    const sourceId = 'approach-track'

    const draw = () => {
      if (map.getSource(sourceId)) {
        ;(map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        })
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coords },
          },
        })
        map.addLayer({
          id: 'approach-line',
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#2860A3', 'line-width': 4 },
        })
        const start = track[0]
        const end = track[track.length - 1]
        new maplibregl.Marker({ color: '#459B51' }).setLngLat([start.lng, start.lat]).addTo(map)
        new maplibregl.Marker({ color: '#D55A1F' }).setLngLat([end.lng, end.lat]).addTo(map)
      }

      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      )
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 })
    }

    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
  }, [track])

  const handleUpload = async (file: File) => {
    if (!area || !accessToken) {
      onSignIn?.('Sign in to upload an approach GPX.')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const { versionId, versionPath } = await uploadApproachGpxFiles(accessToken, area.id, file)
      await recordVersion.mutateAsync({
        id: versionId,
        areaId: area.id,
        storagePath: versionPath,
        supersedesId: latestQ.data?.[0]?.id ?? null,
        notes: null,
      })
      await loadTrack(true)
      onToast?.('Approach GPX uploaded')
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const downloadGpx = async () => {
    if (!gpxPath) return
    const url = approachGpxPublicUrl(gpxPath)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${area?.name ?? 'approach'}.gpx`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      onToast?.('Could not download GPX')
    }
  }

  if (!open || !area) return null

  const end = track[track.length - 1]
  const distToWallKm =
    userLat != null && userLng != null && end
      ? haversineKm(userLat, userLng, end.lat, end.lng)
      : null

  const busy = loadState === 'loading' || uploading

  return (
    <>
      <div className="slideover-backdrop approach-stack-backdrop" onClick={onClose} role="presentation" />
      <div
        className="slideover approach-drawer route-stack-slideover"
        role="dialog"
        aria-label={`Approach: ${area.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slideover-head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>Approach guide</div>
        </div>
        <div className="slideover-body" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="approach-map-wrap">
            <div ref={containerRef} className="approach-map" />
            <div className="approach-map-toolbar">
              <button
                type="button"
                className="approach-map-btn"
                aria-label="Refresh GPX"
                disabled={busy}
                onClick={() => void loadTrack(true)}
              >
                <Icon name="refresh" size={16} />
              </button>
              {accessToken ? (
                <button
                  type="button"
                  className="approach-map-btn"
                  aria-label="Upload GPX"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <Icon name="upload" size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="approach-map-btn"
                  aria-label="Sign in to upload"
                  onClick={() => onSignIn?.('Sign in to upload an approach GPX.')}
                >
                  <Icon name="upload" size={16} />
                </button>
              )}
              <button
                type="button"
                className="approach-map-btn"
                aria-label="Download GPX"
                disabled={!gpxPath || busy}
                onClick={() => void downloadGpx()}
              >
                <Icon name="share" size={16} />
              </button>
              {distToWallKm != null && (
                <span className="approach-map-distance">
                  <Icon name="pin" size={12} /> {formatCragDistance(distToWallKm)} to wall
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".gpx,application/gpx+xml,application/xml,text/xml"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void handleUpload(file)
              }}
            />
          </div>
          <div style={{ padding: 20 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{area.name}</h2>
            <div className="muted" style={{ fontSize: 14 }}>
              {area.region ?? '—'}
            </div>
            <div className="rail-card" style={{ padding: 14, marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>From carpark</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {area.approach_minutes_from_carpark != null
                      ? `${area.approach_minutes_from_carpark} min`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Walk-in</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {area.walk_in_angle ?? '—'}
                  </div>
                </div>
              </div>
            </div>
            {busy && <div className="muted" style={{ marginTop: 12 }}>Loading…</div>}
            {!busy && loadState === 'missing' && (
              <div className="muted" style={{ marginTop: 12 }}>
                No approach GPX on file yet. Upload a track to help others find the wall.
              </div>
            )}
            {!busy && loadState === 'error' && (
              <div className="error" style={{ marginTop: 12 }}>
                Could not load approach track.
              </div>
            )}
            {uploadError && (
              <div className="error" style={{ marginTop: 12 }}>
                {uploadError}
              </div>
            )}
            {latestQ.data?.[0] && (
              <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
                Latest upload: {new Date(latestQ.data[0].uploaded_at).toLocaleDateString()}
                {latestQ.data[0].notes ? ` · ${latestQ.data[0].notes}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
