import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeedUserAvatar } from './FeedUserAvatar'
import { Icon } from './Icon'
import { useAuth } from '../features/auth/AuthProvider'
import { useCatalogAreas, useCatalogGyms } from '../hooks/useCatalog'
import { loadCatalogCache, searchCatalogRoutes } from '../lib/catalogSearch'
import {
  buildQuickSearchChips,
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
} from '../lib/searchRecent'
import { searchCragHits } from '../lib/searchCrags'
import { profileDisplayName, searchProfiles } from '../lib/peen-api/profiles'
import type { ApiRoute } from '../types/api'

export function TopbarSearch({
  onOpenRoute,
  onOpenProfile,
  onGoToCrags,
  onSignIn,
  wishlistRouteNames,
  homeAreaName,
}: {
  onOpenRoute: (routeId: string) => void
  onOpenProfile: (userId: string, fallbackName?: string) => void
  onGoToCrags: (pinName?: string) => void
  onSignIn: () => void
  wishlistRouteNames: string[]
  homeAreaName?: string | null
}) {
  const { accessToken } = useAuth()
  const areasQ = useCatalogAreas()
  const gymsQ = useCatalogGyms()
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches())
  const [routeHits, setRouteHits] = useState<ApiRoute[]>([])
  const [profileHits, setProfileHits] = useState<
    { user_id: string; nickname?: string; username?: string }[]
  >([])
  const [searching, setSearching] = useState(false)
  const searchSeq = useRef(0)

  const areas = areasQ.data ?? []
  const gyms = gymsQ.data ?? []

  const refreshRecent = useCallback(() => setRecent(readRecentSearches()), [])

  useEffect(() => {
    void loadCatalogCache()
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) {
        setRouteHits([])
        setProfileHits([])
        setSearching(false)
        return
      }
      const seq = ++searchSeq.current
      setSearching(true)
      try {
        const routes = await searchCatalogRoutes(trimmed, 4)
        if (seq !== searchSeq.current) return
        setRouteHits(routes)
        if (accessToken && trimmed.length >= 2) {
          const profiles = await searchProfiles(accessToken, trimmed, 4)
          if (seq !== searchSeq.current) return
          setProfileHits(profiles.filter((p) => p.user_id))
        } else {
          setProfileHits([])
        }
      } catch {
        if (seq === searchSeq.current) {
          setRouteHits([])
          setProfileHits([])
        }
      } finally {
        if (seq === searchSeq.current) setSearching(false)
      }
    },
    [accessToken],
  )

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => void runSearch(query), 220)
    return () => window.clearTimeout(timer)
  }, [query, open, runSearch])

  const cragHits = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return searchCragHits(q, areas, gyms, undefined, 4)
  }, [query, areas, gyms])

  const quick = useMemo(
    () =>
      buildQuickSearchChips({
        recent,
        wishlistRouteNames,
        homeAreaName,
      }),
    [recent, wishlistRouteNames, homeAreaName],
  )

  const pick = (fn: () => void, searchTerm?: string) => {
    const term = (searchTerm ?? query).trim()
    if (term) {
      pushRecentSearch(term)
      refreshRecent()
    }
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
    fn()
  }

  const applyChip = (chip: string) => {
    setQuery(chip)
    setOpen(true)
    inputRef.current?.focus()
    void runSearch(chip)
  }

  const trimmed = query.trim()
  const total = routeHits.length + profileHits.length + cragHits.length
  const showResults = trimmed.length > 0

  return (
    <div className="search-wrap" ref={wrapRef}>
      <label className="search">
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          placeholder="Search routes, climbers, crags…"
          aria-label="Search routes, climbers, crags"
          aria-expanded={open}
          aria-controls="topbar-search-panel"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        <span className="kbd">⌘K</span>
      </label>

      {open && (
        <div className="search-panel" id="topbar-search-panel" role="listbox">
          {!showResults ? (
            <div>
              <div className="search-quick-head">
                <span className="search-grouplabel">{quick.label}</span>
                {quick.showClear ? (
                  <button
                    type="button"
                    className="search-clear-recent"
                    onClick={() => {
                      clearRecentSearches()
                      refreshRecent()
                    }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="search-suggests">
                {quick.chips.map((s) => (
                  <button key={s} type="button" className="search-suggest" onClick={() => applyChip(s)}>
                    <Icon name="search" size={13} /> {s}
                  </button>
                ))}
              </div>
              {!accessToken && (
                <p className="search-panel-hint muted">
                  Sign in to search climbers. Routes use the cached catalog.
                </p>
              )}
            </div>
          ) : searching && total === 0 ? (
            <div className="search-empty">
              <Icon name="search" size={22} style={{ opacity: 0.4 }} />
              <div>Searching…</div>
            </div>
          ) : total === 0 ? (
            <div className="search-empty">
              <Icon name="search" size={22} style={{ opacity: 0.4 }} />
              <div>No matches for &ldquo;{query}&rdquo;</div>
              <span>Try a route name, climber, or crag.</span>
            </div>
          ) : (
            <>
              {routeHits.length > 0 && (
                <div className="search-group">
                  <div className="search-grouplabel">Routes</div>
                  {routeHits.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="search-item"
                      onClick={() => pick(() => onOpenRoute(r.id), trimmed)}
                    >
                      <span className="search-ico">
                        <Icon name="mountain" size={16} />
                      </span>
                      <span className="search-text">
                        <span className="search-title">{r.name}</span>
                        <span className="search-sub">
                          {r.area?.name ?? r.gym?.name ?? '—'}
                        </span>
                      </span>
                      {r.grade ? <span className="chip chip-grade">{r.grade}</span> : null}
                    </button>
                  ))}
                </div>
              )}
              {profileHits.length > 0 && (
                <div className="search-group">
                  <div className="search-grouplabel">Climbers</div>
                  {profileHits.map((p) => (
                    <button
                      key={p.user_id}
                      type="button"
                      className="search-item"
                      onClick={() =>
                        pick(() => onOpenProfile(p.user_id, profileDisplayName(p)), trimmed)
                      }
                    >
                      <FeedUserAvatar
                        name={profileDisplayName(p)}
                        colorSeed={p.user_id}
                        size={28}
                      />
                      <span className="search-text">
                        <span className="search-title">{profileDisplayName(p)}</span>
                        {p.username ? (
                          <span className="search-sub">@{p.username}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {cragHits.length > 0 && (
                <div className="search-group">
                  <div className="search-grouplabel">Crags</div>
                  {cragHits.map((c) => (
                    <button
                      key={`${c.kind}-${c.id}`}
                      type="button"
                      className="search-item"
                      onClick={() =>
                        pick(() => onGoToCrags(c.name.split(' ')[0]), trimmed)
                      }
                    >
                      <span className="search-ico">
                        <Icon name={c.kind === 'gym' ? 'map' : 'pin'} size={16} />
                      </span>
                      <span className="search-text">
                        <span className="search-title">{c.name}</span>
                        <span className="search-sub">
                          {c.region ?? (c.kind === 'gym' ? 'Gym' : 'Crag')}
                          {c.routeCount != null ? ` · ${c.routeCount} routes` : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {!accessToken && trimmed.length >= 2 && (
            <button
              type="button"
              className="btn btn-secondary search-signin-cta"
              onClick={() => pick(onSignIn, trimmed)}
            >
              Sign in to search climbers
            </button>
          )}
        </div>
      )}
    </div>
  )
}
