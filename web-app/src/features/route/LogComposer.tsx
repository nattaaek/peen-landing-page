import { useEffect, useMemo, useRef, useState } from 'react'
import { FeedUserAvatar } from '../../components/FeedUserAvatar'
import { Icon } from '../../components/Icon'
import { Toggle } from '../../components/Toggle'
import { useAuth } from '../auth/AuthProvider'
import { useFollowingIds, useLogClimb } from '../../hooks/useMigration'
import { migrationInvoke } from '../../lib/peen-api/migration'
import { fetchProfileIdentities, searchProfiles } from '../../lib/peen-api/profiles'
import { searchCatalogRoutes } from '../../lib/catalogSearch'
import type { ApiRoute, SendType, WeeklyLeaderboardRow } from '../../types/api'
import { MAX_PHOTOS, uploadClimbLogPhotos } from './climbLogPhotos'
import { isSendForBelay, routeLocationLabel, SEND_TYPE_OPTIONS } from './sendTypeOptions'

type BelayerPick = { user_id: string; nickname?: string; username?: string }

type PendingPhoto = { file: File; previewUrl: string }

function belayerDisplayName(b: BelayerPick): string {
  return b.nickname?.trim() || b.username?.trim() || 'Climber'
}

function formatLogDate(): string {
  return new Date().toDateString().slice(4)
}

export function LogComposer({
  route,
  open,
  onClose,
  onSuccess,
}: {
  route: ApiRoute | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { accessToken, user } = useAuth()
  const log = useLogClimb()
  const fileRef = useRef<HTMLInputElement>(null)

  const [pickedRoute, setPickedRoute] = useState<ApiRoute | null>(route)
  const [routeQuery, setRouteQuery] = useState('')
  const [routeHits, setRouteHits] = useState<ApiRoute[]>([])
  const [routeSearchBusy, setRouteSearchBusy] = useState(false)
  const [routeSearchDone, setRouteSearchDone] = useState(false)

  const [sendType, setSendType] = useState<SendType>('flash')
  const [attempts, setAttempts] = useState(1)
  const [stars, setStars] = useState(4)
  const [notes, setNotes] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [belayer, setBelayer] = useState<BelayerPick | null>(null)
  const [belayerQuery, setBelayerQuery] = useState('')
  const [belayerHits, setBelayerHits] = useState<BelayerPick[]>([])
  const [belayerSearchLoading, setBelayerSearchLoading] = useState(false)
  const [belayerSearchDone, setBelayerSearchDone] = useState(false)
  const [crewPicks, setCrewPicks] = useState<BelayerPick[]>([])
  const [photoDragOver, setPhotoDragOver] = useState(false)
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const followingQ = useFollowingIds()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    setPickedRoute(route)
    setRouteQuery('')
    setRouteHits([])
    setRouteSearchDone(false)
    setSendType('flash')
    setAttempts(1)
    setStars(4)
    setNotes('')
    setIsPublic(true)
    setBelayer(null)
    setBelayerQuery('')
    setBelayerHits([])
    setBelayerSearchLoading(false)
    setBelayerSearchDone(false)
    setCrewPicks([])
    setPhotoDragOver(false)
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      return []
    })
    setSubmitError(null)
  }, [open, route])

  useEffect(() => {
    if (sendType === 'onsight' || sendType === 'flash') setAttempts(1)
  }, [sendType])

  useEffect(() => {
    if (!open) return
    const q = routeQuery.trim()
    if (!q || pickedRoute) {
      setRouteHits([])
      setRouteSearchDone(false)
      return
    }
    let cancelled = false
    setRouteSearchBusy(true)
    setRouteSearchDone(false)
    const timer = window.setTimeout(() => {
      searchCatalogRoutes(q, 8)
        .then((hits) => {
          if (!cancelled) setRouteHits(hits)
        })
        .catch(() => {
          if (!cancelled) setRouteHits([])
        })
        .finally(() => {
          if (!cancelled) {
            setRouteSearchBusy(false)
            setRouteSearchDone(true)
          }
        })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [routeQuery, pickedRoute, open])

  useEffect(() => {
    if (!open || !accessToken || !user?.id) {
      setCrewPicks([])
      return
    }
    let cancelled = false
    ;(async () => {
      let ids = [...(followingQ.data ?? [])].filter((id) => id !== user.id).slice(0, 6)
      if (ids.length < 6) {
        try {
          const weekly = await migrationInvoke<WeeklyLeaderboardRow[]>(
            'community',
            'community_fetch_weekly_leaderboard',
            { _limit: 20 },
            accessToken,
          )
          for (const row of weekly) {
            const id = row.user_id
            if (!id || id === user.id || ids.includes(id)) continue
            ids.push(id)
            if (ids.length >= 6) break
          }
        } catch {
          /* crew quick-picks are best-effort */
        }
      }
      if (ids.length === 0) {
        if (!cancelled) setCrewPicks([])
        return
      }
      try {
        const identities = await fetchProfileIdentities(accessToken, ids)
        if (!cancelled) {
          setCrewPicks(
            identities.map((i) => ({
              user_id: i.user_id,
              nickname: i.nickname,
              username: i.username,
            })),
          )
        }
      } catch {
        if (!cancelled) setCrewPicks([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, accessToken, user?.id, followingQ.data])

  useEffect(() => {
    if (!open || !accessToken) return
    const q = belayerQuery.trim()
    if (!q || belayer || q.length < 2) {
      setBelayerHits([])
      setBelayerSearchLoading(false)
      setBelayerSearchDone(false)
      return
    }
    let cancelled = false
    setBelayerSearchLoading(true)
    setBelayerSearchDone(false)
    const timer = window.setTimeout(() => {
      searchProfiles(accessToken, q, 6)
        .then((rows) => {
          if (!cancelled) {
            setBelayerHits(
              rows.filter((r) => r.user_id !== user?.id).map((r) => ({
                user_id: r.user_id,
                nickname: r.nickname,
                username: r.username,
              })),
            )
          }
        })
        .catch(() => {
          if (!cancelled) setBelayerHits([])
        })
        .finally(() => {
          if (!cancelled) {
            setBelayerSearchLoading(false)
            setBelayerSearchDone(true)
          }
        })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [belayerQuery, belayer, open, accessToken, user?.id])

  const filteredCrewPicks = useMemo(() => {
    const q = belayerQuery.trim().toLowerCase()
    if (!q) return crewPicks
    return crewPicks.filter((c) => {
      const name = belayerDisplayName(c).toLowerCase()
      const handle = c.username?.toLowerCase() ?? ''
      return name.includes(q) || handle.includes(q)
    })
  }, [crewPicks, belayerQuery])

  const belayerOptions = useMemo(() => {
    const q = belayerQuery.trim()
    if (q.length >= 2) {
      const merged: BelayerPick[] = [...belayerHits]
      for (const c of filteredCrewPicks) {
        if (!merged.some((m) => m.user_id === c.user_id)) merged.push(c)
      }
      return merged.slice(0, 6)
    }
    if (q.length === 1) return filteredCrewPicks
    return crewPicks
  }, [belayerQuery, belayerHits, filteredCrewPicks, crewPicks])

  const showBelayerNoMatch = useMemo(() => {
    const q = belayerQuery.trim()
    if (!q || belayer) return false
    if (q.length >= 2) {
      return belayerSearchDone && !belayerSearchLoading && belayerOptions.length === 0
    }
    return belayerOptions.length === 0
  }, [belayerQuery, belayer, belayerSearchDone, belayerSearchLoading, belayerOptions.length])

  const addPhotos = (files: FileList | null) => {
    if (!files?.length) return
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length
      const next = [...prev]
      for (const file of Array.from(files).slice(0, room)) {
        if (!file.type.startsWith('image/')) continue
        next.push({ file, previewUrl: URL.createObjectURL(file) })
      }
      return next
    })
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const copy = [...prev]
      const removed = copy.splice(index, 1)[0]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return copy
    })
  }

  const submit = async () => {
    if (!pickedRoute || !accessToken || !user) return
    setSubmitError(null)
    setUploading(true)
    try {
      let photo_urls: string[] | undefined
      if (photos.length > 0) {
        photo_urls = await uploadClimbLogPhotos(
          accessToken,
          pickedRoute.id,
          photos.map((p) => p.file),
        )
      }
      const climbed_date = new Date().toISOString().slice(0, 10)
      const saved = await log.mutateAsync({
        user_id: user.id,
        route_id: pickedRoute.id,
        send_type: sendType,
        climbed_date,
        notes: notes.trim() || undefined,
        personal_rating: stars,
        is_public: isPublic,
        attempts,
        photo_urls,
      })
      if (belayer && saved.id && isSendForBelay(sendType)) {
        try {
          await migrationInvoke('climbs', 'createBelayVerificationRequest', {
            climb_id: saved.id,
            climber_id: user.id,
            belayer_id: belayer.user_id,
          }, accessToken)
        } catch {
          /* belay request is best-effort */
        }
      }
      onSuccess()
      onClose()
    } catch {
      setSubmitError('Could not save send. Try again.')
    } finally {
      setUploading(false)
    }
  }

  if (!open) return null

  const busy = log.isPending || uploading
  const dateLabel = formatLogDate()

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal log-composer"
        role="dialog"
        aria-labelledby="log-composer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id="log-composer-title">Log a send</h3>
          <div className="modal-head-date">{dateLabel}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field log-field-gap">
            <label>Route</label>
            {pickedRoute ? (
              <div className="log-route-card">
                <Icon name="mountain" size={18} style={{ color: 'var(--fg-2)' }} />
                <div className="log-route-card-text">
                  <div className="log-route-card-name">{pickedRoute.name}</div>
                  <div className="log-route-card-sub">{routeLocationLabel(pickedRoute)}</div>
                </div>
                {pickedRoute.grade && <span className="chip chip-grade">{pickedRoute.grade}</span>}
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Clear route"
                  onClick={() => setPickedRoute(null)}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="search log-route-search">
                  <Icon name="search" size={16} />
                  <input
                    placeholder="Find route by name or area…"
                    value={routeQuery}
                    onChange={(e) => setRouteQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {routeSearchBusy && routeQuery.trim() && (
                  <p className="muted log-route-hint">Searching…</p>
                )}
                {routeQuery.trim() &&
                  routeSearchDone &&
                  !routeSearchBusy &&
                  routeHits.length === 0 && (
                    <p className="muted log-route-hint">No routes found.</p>
                  )}
                {routeHits.length > 0 && (
                  <ul className="log-route-hits">
                    {routeHits.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className="log-route-hit"
                          onClick={() => {
                            setPickedRoute(r)
                            setRouteQuery('')
                            setRouteHits([])
                          }}
                        >
                          <span className="log-route-hit-name">{r.name}</span>
                          <span className="muted">
                            {routeLocationLabel(r)}
                            {r.grade ? ` · ${r.grade}` : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="field log-field-gap">
            <label>Send type</label>
            <div className="send-pick">
              {SEND_TYPE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={sendType === s.id ? 'active' : ''}
                  onClick={() => setSendType(s.id)}
                >
                  <span className="dot4" style={{ background: s.color }} />
                  <span className="lbl">{s.label}</span>
                  <span className="send-pick-sub">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="row-2 log-field-gap">
            <div className="field">
              <label>Attempts</label>
              <div className="attempt-stepper">
                <button
                  type="button"
                  className="btn btn-secondary attempt-stepper-btn"
                  onClick={() => setAttempts((n) => Math.max(1, n - 1))}
                  aria-label="Fewer attempts"
                >
                  –
                </button>
                <div className="attempt-stepper-val">{attempts}</div>
                <button
                  type="button"
                  className="btn btn-secondary attempt-stepper-btn"
                  onClick={() => setAttempts((n) => n + 1)}
                  aria-label="More attempts"
                >
                  +
                </button>
              </div>
            </div>
            <div className="field">
              <label>Quality</label>
              <div className="quality-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className="quality-star-btn"
                    aria-label={`${i} stars`}
                    onClick={() => setStars(i)}
                  >
                    <Icon
                      name={i <= stars ? 'starSolid' : 'star'}
                      size={26}
                      style={{
                        color: i <= stars ? 'var(--peen-flash)' : 'var(--separator)',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field log-field-gap">
            <label>
              Belayer{' '}
              <span className="field-label-optional">· optional</span>
            </label>
            {belayer ? (
              <>
                <div className="log-belayer-card">
                  <FeedUserAvatar name={belayerDisplayName(belayer)} colorSeed={belayer.user_id} size={32} />
                  <div className="log-belayer-card-text">
                    <div className="log-route-card-name">{belayerDisplayName(belayer)}</div>
                    {belayer.username && (
                      <div className="log-route-card-sub">@{belayer.username}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Remove belayer"
                    onClick={() => setBelayer(null)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <p className="log-belayer-helper">
                  They&apos;ll get a notification to verify this send.
                </p>
              </>
            ) : (
              <>
                <div className="search log-route-search log-belayer-search">
                  <Icon name="search" size={16} />
                  <input
                    placeholder="Search your crew by name…"
                    value={belayerQuery}
                    onChange={(e) => setBelayerQuery(e.target.value)}
                  />
                </div>
                {belayerSearchLoading && belayerQuery.trim().length >= 2 && (
                  <p className="muted log-route-hint">Searching…</p>
                )}
                {belayerOptions.length > 0 && (
                  <div className="belayer-picks">
                    {belayerOptions.map((c) => (
                      <button
                        key={c.user_id}
                        type="button"
                        className="belayer-chip"
                        onClick={() => {
                          setBelayer(c)
                          setBelayerQuery('')
                          setBelayerHits([])
                        }}
                      >
                        <FeedUserAvatar
                          name={belayerDisplayName(c)}
                          colorSeed={c.user_id}
                          size={26}
                        />
                        <span>{belayerDisplayName(c).split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showBelayerNoMatch && (
                  <p className="muted log-route-hint">
                    No climbers match &ldquo;{belayerQuery.trim()}&rdquo;.
                  </p>
                )}
                {!belayerQuery.trim() && crewPicks.length === 0 && !belayerSearchLoading && (
                  <p className="log-belayer-helper">
                    Pick a belayer to get a Verified badge. You can still log without one.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="field log-field-gap">
            <label>Notes (beta, mood, conditions)</label>
            <textarea
              placeholder="Sticky pinch at the crux — drop knee on the orange chip."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="field log-field-gap">
            <label>Photos</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addPhotos(e.target.files)
                e.target.value = ''
              }}
            />
            <div
              className={`log-photo-drop ${photoDragOver ? 'drag-over' : ''}`}
              role="button"
              tabIndex={0}
              aria-disabled={photos.length >= MAX_PHOTOS}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (photos.length < MAX_PHOTOS) fileRef.current?.click()
                }
              }}
              onClick={() => {
                if (photos.length < MAX_PHOTOS) fileRef.current?.click()
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                if (photos.length < MAX_PHOTOS) setPhotoDragOver(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (photos.length < MAX_PHOTOS) setPhotoDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                if (e.currentTarget === e.target) setPhotoDragOver(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setPhotoDragOver(false)
                if (photos.length < MAX_PHOTOS) addPhotos(e.dataTransfer.files)
              }}
            >
              <Icon name="upload" size={18} />
              {photos.length >= MAX_PHOTOS ? (
                <span>{MAX_PHOTOS} photos added</span>
              ) : (
                <span className="log-photo-drop-copy">
                  Drag images here or{' '}
                  <button
                    type="button"
                    className="log-photo-browse"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileRef.current?.click()
                    }}
                  >
                    browse
                  </button>
                </span>
              )}
            </div>
            {photos.length > 0 && (
              <ul className="log-photo-previews">
                {photos.map((p, i) => (
                  <li key={p.previewUrl}>
                    <img src={p.previewUrl} alt="" />
                    <button
                      type="button"
                      className="icon-btn log-photo-remove"
                      aria-label="Remove photo"
                      onClick={() => removePhoto(i)}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="log-share-row">
            <Icon name="eye" size={20} style={{ color: 'var(--fg-2)' }} />
            <div className="log-share-copy">
              <div className="log-share-title">Share publicly</div>
              <div className="log-share-sub">Show on the feed and your profile</div>
            </div>
            <Toggle
              value={isPublic}
              onChange={setIsPublic}
              ariaLabel="Share climb publicly"
            />
          </div>

          {(submitError || log.isError) && (
            <p className="error log-composer-error" role="alert">
              {submitError ?? 'Could not save send.'}
            </p>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pickedRoute || busy}
            onClick={() => void submit()}
          >
            <Icon name="check" size={16} />
            {busy ? 'Saving…' : 'Log send'}
          </button>
        </div>
      </div>
    </>
  )
}
