import { useState } from 'react'
import { Icon, SendBadge } from '../../components/Icon'
import { useCatalogRoute } from '../../hooks/useCatalog'
import {
  STEEPNESS_ANGLES,
  usePublicRouteLogs,
  useRouteConsensus,
  useRouteRating,
  useToggleWishlist,
  useUpsertSteepnessVote,
  useWishlistRouteIds,
} from '../../hooks/useMigration'
import type { ApiRoute } from '../../types/api'

type DetailTab = 'overview' | 'sends' | 'steepness'

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
  const [tab, setTab] = useState<DetailTab>('overview')
  const routeQ = useCatalogRoute(routeId)
  const route = routeQ.data
  const sendsQ = usePublicRouteLogs(isGuest ? undefined : routeId)
  const ratingQ = useRouteRating(isGuest ? undefined : routeId)
  const consensusQ = useRouteConsensus(isGuest ? undefined : routeId)
  const vote = useUpsertSteepnessVote()
  const wishlistQ = useWishlistRouteIds()
  const toggleWishlist = useToggleWishlist()
  const isInWishlist = routeId ? (wishlistQ.data?.has(routeId) ?? false) : false

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
          <button
            type="button"
            className="icon-btn"
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            disabled={toggleWishlist.isPending}
            onClick={() => {
              if (isGuest) {
                onSignIn()
                return
              }
              toggleWishlist.mutate({ routeId, save: !isInWishlist })
            }}
          >
            <Icon name={isInWishlist ? 'bookmarkFilled' : 'bookmark'} size={20} />
          </button>
        </div>
        <div className="slideover-body">
          {routeQ.isLoading && <p className="muted">Loading route…</p>}
          {route && (
            <>
              <div className="route-hero-placeholder" />
              <div style={{ padding: '16px 24px 0' }}>
                <h2 style={{ margin: 0, display: 'inline' }}>{route.name}</h2>
                {route.grade && (
                  <span className="chip" style={{ marginLeft: 8 }}>
                    {route.grade}
                  </span>
                )}
                {ratingQ.data && (
                  <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                    ★ {ratingQ.data.avg_rating?.toFixed(1) ?? '—'} ({ratingQ.data.rating_count ?? 0}{' '}
                    ratings)
                  </p>
                )}
              </div>
              {!isGuest && (
                <div className="segmented" style={{ margin: '16px 24px' }}>
                  {(
                    [
                      ['overview', 'Overview'],
                      ['sends', 'Sends'],
                      ['steepness', 'Steepness'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={tab === id ? 'active' : ''}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ padding: '0 24px 24px' }}>
                {tab === 'overview' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', marginBottom: 16 }}
                      onClick={() => (isGuest ? onSignIn() : onLog(route))}
                    >
                      <Icon name="plus" size={16} /> Log a send
                    </button>
                    {route.description && (
                      <p style={{ lineHeight: 1.5 }}>{route.description}</p>
                    )}
                    {route.length_meters != null && (
                      <p className="muted" style={{ fontSize: 13 }}>
                        Length: {route.length_meters} m
                      </p>
                    )}
                    {consensusQ.data?.top_angle && (
                      <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                        Community steepness: <strong>{consensusQ.data.top_angle}</strong> (
                        {consensusQ.data.votes ?? 0} votes)
                      </p>
                    )}
                  </>
                )}
                {tab === 'sends' && !isGuest && (
                  <>
                    {sendsQ.isLoading && <p className="muted">Loading sends…</p>}
                    <ul className="send-list">
                      {(sendsQ.data ?? []).map((log) => (
                        <li key={log.id}>
                          <strong>{log.profile?.nickname ?? 'Climber'}</strong>
                          <SendBadge type={log.send_type} />
                          <span className="muted">{log.grade ?? route.grade}</span>
                        </li>
                      ))}
                    </ul>
                    {!sendsQ.isLoading && (sendsQ.data ?? []).length === 0 && (
                      <p className="muted">No public sends on this route yet.</p>
                    )}
                  </>
                )}
                {tab === 'steepness' && !isGuest && (
                  <>
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
                          onClick={() =>
                            vote.mutate({ route_id: route.id, angle })
                          }
                        >
                          {angle}
                        </button>
                      ))}
                    </div>
                    {consensusQ.data && (
                      <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                        Top vote: <strong>{consensusQ.data.top_angle}</strong> (
                        {consensusQ.data.votes} climbers)
                      </p>
                    )}
                  </>
                )}
                {isGuest && (
                  <p className="muted" style={{ marginTop: 12 }}>
                    <button type="button" className="link-btn" onClick={onSignIn}>
                      Sign in
                    </button>{' '}
                    to see sends and vote on steepness.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
