import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { useAuth } from '../features/auth/AuthProvider'
import { loadCatalogCache, searchCatalogRoutes } from '../lib/catalogSearch'
import { searchProfiles, profileDisplayName } from '../lib/peen-api/profiles'
import type { ApiRoute } from '../types/api'

export function GlobalSearch({
  open,
  onClose,
  onOpenRoute,
  onOpenProfile,
  onSignIn,
}: {
  open: boolean
  onClose: () => void
  onOpenRoute: (routeId: string) => void
  onOpenProfile: (userId: string, fallbackName?: string) => void
  onSignIn: () => void
}) {
  const { accessToken } = useAuth()
  const [query, setQuery] = useState('')
  const [profileHits, setProfileHits] = useState<
    { user_id: string; nickname?: string; username?: string }[]
  >([])
  const [routeHits, setRouteHits] = useState<ApiRoute[]>([])
  const [searchingProfiles, setSearchingProfiles] = useState(false)
  const [searchingRoutes, setSearchingRoutes] = useState(false)
  const profileSeq = useRef(0)
  const routeSeq = useRef(0)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setProfileHits([])
      setRouteHits([])
      return
    }
    void loadCatalogCache()
  }, [open])

  useEffect(() => {
    if (!open || !accessToken) return
    const prefix = query.trim()
    if (prefix.length < 2) {
      setProfileHits([])
      return
    }
    const seq = ++profileSeq.current
    const timer = window.setTimeout(async () => {
      setSearchingProfiles(true)
      try {
        const rows = await searchProfiles(accessToken, prefix, 8)
        if (seq !== profileSeq.current) return
        setProfileHits(rows)
      } catch {
        if (seq !== profileSeq.current) return
        setProfileHits([])
      } finally {
        if (seq === profileSeq.current) setSearchingProfiles(false)
      }
    }, 220)
    return () => window.clearTimeout(timer)
  }, [open, accessToken, query])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 1) {
      setRouteHits([])
      return
    }
    const seq = ++routeSeq.current
    const timer = window.setTimeout(async () => {
      setSearchingRoutes(true)
      try {
        const rows = await searchCatalogRoutes(q, 24)
        if (seq !== routeSeq.current) return
        setRouteHits(rows)
      } catch {
        if (seq !== routeSeq.current) return
        setRouteHits([])
      } finally {
        if (seq === routeSeq.current) setSearchingRoutes(false)
      }
    }, 280)
    return () => window.clearTimeout(timer)
  }, [open, query])

  if (!open) return null

  const showRoutes = query.trim().length > 0
  const showClimbers = accessToken && query.trim().length >= 2

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal global-search" role="dialog" aria-label="Search">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Search</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <label className="search" style={{ marginTop: 14, width: '100%' }}>
          <Icon name="search" size={16} />
          <input
            placeholder="Routes, climbers, crags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="kbd">esc</span>
        </label>

        {!accessToken && (
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            Sign in to search climbers. Routes search uses a cached catalog.
          </p>
        )}

        {showClimbers && (
          <section style={{ marginTop: 18 }}>
            <h3 className="search-section-label">Climbers</h3>
            {searchingProfiles && <p className="muted">Searching…</p>}
            {!searchingProfiles && profileHits.length === 0 && (
              <p className="muted">No climbers match.</p>
            )}
            {profileHits.map((p) => (
              <button
                key={p.user_id}
                type="button"
                className="search-hit"
                onClick={() => {
                  onOpenProfile(p.user_id, profileDisplayName(p))
                  onClose()
                }}
              >
                <span className="search-hit-title">{profileDisplayName(p)}</span>
                {p.username && <span className="muted">@{p.username}</span>}
              </button>
            ))}
          </section>
        )}

        {showRoutes && (
          <section style={{ marginTop: 18 }}>
            <h3 className="search-section-label">Routes</h3>
            {searchingRoutes && <p className="muted">Searching catalog…</p>}
            {!searchingRoutes && routeHits.length === 0 && (
              <p className="muted">No routes match your query.</p>
            )}
            {routeHits.map((r) => (
              <RouteHit key={r.id} route={r} onPick={() => { onOpenRoute(r.id); onClose() }} />
            ))}
          </section>
        )}

        {!showRoutes && !showClimbers && (
          <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
            Type to search routes{accessToken ? ' and climbers (2+ characters)' : ''}.
          </p>
        )}

        {!accessToken && query.trim().length >= 2 && (
          <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: 16 }} onClick={onSignIn}>
            Sign in to search climbers
          </button>
        )}
      </div>
    </>
  )
}

function RouteHit({ route, onPick }: { route: ApiRoute; onPick: () => void }) {
  return (
    <button type="button" className="search-hit" onClick={onPick}>
      <span className="search-hit-title">{route.name}</span>
      {route.grade && (
        <span className="chip outline" style={{ height: 22, fontSize: 11 }}>
          {route.grade}
        </span>
      )}
      <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
        {route.area?.name ?? route.gym?.name ?? '—'}
      </span>
    </button>
  )
}
