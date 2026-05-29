import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { ProfileMenu } from './ProfileMenu'
import { RailWeather } from './RailWeather'
import { TopbarSearch } from './TopbarSearch'
import { TopoLines } from './TopoLines'
import { useAuth } from '../features/auth/AuthProvider'
import {
  useInbox,
  useMarkAllNotificationsRead,
  useMyProfile,
  usePartners,
  useSeasonalSpotlight,
  useWishlistRoutes,
} from '../hooks/useMigration'

const NAV = [
  { to: '/feed', label: 'Feed', icon: 'feed' as const },
  { to: '/crags', label: 'Crags', icon: 'map' as const },
  { to: '/crew', label: 'Crew', icon: 'crew' as const },
  { to: '/profile', label: 'Profile', icon: 'profile' as const },
]

export function AppShell({
  onLog,
  onNotifs,
  onSignIn,
  onOpenRoute,
  onOpenProfile,
  onToast,
}: {
  onLog: () => void
  onNotifs: () => void
  onSignIn: () => void
  onOpenRoute: (routeId: string) => void
  onOpenProfile: (userId: string, fallbackName?: string) => void
  onToast?: (msg: string) => void
}) {
  const { accessToken } = useAuth()
  const profileQ = useMyProfile()
  const wishlistQ = useWishlistRoutes()
  const navigate = useNavigate()
  const wishlist = wishlistQ.data ?? []
  const isGuest = !accessToken

  const unread = useInbox().data?.filter((n) => n.read !== true).length ?? 0
  const wishlistNames = wishlist.map((r) => r.name).filter(Boolean)
  const homeAreaName =
    wishlist[0]?.area?.name ?? wishlist[0]?.gym?.name ?? 'Crazy Horse'

  return (
    <div className="app">
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="mark">
            <img src="/assets/app-icon.jpg" alt="" width={32} height={32} />
          </span>
          <span className="name">peen</span>
          <span className="dot" title="online" />
        </a>

        <div className="nav-group">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={20} />
              </span>
              <span className="label">{item.label}</span>
              {item.to === '/feed' && !isGuest && unread > 0 && (
                <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>
              )}
            </NavLink>
          ))}
        </div>

        {!isGuest && (
          <>
            <div className="nav-label">
              Wishlist
              {wishlist.length > 0 && (
                <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>{wishlist.length}</span>
              )}
            </div>
            <div className="nav-group">
              {wishlist.length === 0 ? (
                <div style={{ padding: '6px 12px', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5 }}>
                  Bookmark routes from the feed or crag pages to build your wishlist.
                </div>
              ) : (
                wishlist.slice(0, 5).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="nav-item"
                    onClick={() => onOpenRoute(r.id)}
                  >
                    <span className="nav-icon">
                      <Icon name="bookmarkFilled" size={16} style={{ color: 'var(--tint)' }} />
                    </span>
                    <span
                      className="label"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {r.name}
                    </span>
                    {r.grade && (
                      <span style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 700 }}>{r.grade}</span>
                    )}
                  </button>
                ))
              )}
              {wishlist.length > 5 && (
                <NavLink to="/crags" className="nav-item" style={{ color: 'var(--fg-2)', fontSize: 13 }}>
                  <span className="nav-icon">
                    <Icon name="more" size={14} />
                  </span>
                  <span className="label">+{wishlist.length - 5} more</span>
                </NavLink>
              )}
            </div>
          </>
        )}

        <div className="crag-snapshot">
          <TopoLines />
          <div className="label">Today · Chiang Mai</div>
          <div className="name">Crazy Horse</div>
          <div className="stats">
            <div className="stat">
              <b>28°</b>Air
            </div>
            <div className="stat">
              <b>34%</b>Humidity
            </div>
            <div className="stat">
              <b>—</b>Friction
            </div>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <div className="spacer" />
        <TopbarSearch
          onOpenRoute={onOpenRoute}
          onOpenProfile={onOpenProfile}
          onGoToCrags={(pin) => navigate('/crags', { state: pin ? { pinName: pin } : undefined })}
          onSignIn={onSignIn}
          wishlistRouteNames={wishlistNames}
          homeAreaName={homeAreaName}
        />
        {isGuest ? (
          <button type="button" className="btn-log" onClick={onSignIn}>
            <Icon name="google" size={16} /> Sign in
          </button>
        ) : (
          <button type="button" className="btn-log" onClick={onLog}>
            <Icon name="plus" size={16} /> Log climb
          </button>
        )}
        <button type="button" className="icon-btn" onClick={onNotifs} aria-label="Notifications">
          <Icon name="bell" size={20} />
          {!isGuest && unread > 0 && <span className="dot" />}
        </button>
        {accessToken ? (
          <ProfileMenu profile={profileQ.data} onLog={onLog} onToast={onToast} />
        ) : (
          <button type="button" className="avatar-btn" onClick={onSignIn} title="Guest">
            ?
          </button>
        )}
      </header>

      <main className="main">
        <Outlet />
      </main>

      <aside className="rail">
        <RightRail
          isGuest={isGuest}
          onSignIn={onSignIn}
          onNotifs={onNotifs}
          onOpenCrew={() => navigate('/crew')}
          homeAreaId={wishlist[0]?.area_id ?? undefined}
        />
      </aside>

      <nav className="mobile-tabs" aria-label="Main">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={item.icon} size={20} />
            <span>{item.label === 'Profile' ? 'Me' : item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className="mobile-log"
          onClick={isGuest ? onSignIn : onLog}
          aria-label="Log climb"
        >
          <span className="mobile-log-fab">
            <Icon name="plus" size={22} />
          </span>
          <span>Log</span>
        </button>
      </nav>
    </div>
  )
}

function RightRail({
  isGuest,
  onSignIn,
  onNotifs,
  onOpenCrew,
  homeAreaId,
}: {
  isGuest: boolean
  onSignIn: () => void
  onNotifs: () => void
  onOpenCrew: () => void
  homeAreaId?: string
}) {
  const partnersQ = usePartners()
  const seasonalQ = useSeasonalSpotlight()
  const inboxQ = useInbox()
  const markAllRead = useMarkAllNotificationsRead()
  const partners = partnersQ.data ?? []
  const seasonal = seasonalQ.data as
    | { name?: string; progress?: number; total?: number; days_left?: number }
    | null
    | undefined
  const inbox = (inboxQ.data ?? []).slice(0, 3)

  const pct =
    seasonal?.progress != null && seasonal?.total
      ? Math.round((Number(seasonal.progress) / Number(seasonal.total)) * 100)
      : null

  return (
    <>
      <RailWeather homeAreaId={homeAreaId} />

      <div className="rail-card">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>This weekend</span>
          <button
            type="button"
            className="rail-link"
            onClick={isGuest ? onSignIn : onOpenCrew}
          >
            See all
          </button>
        </h4>
        {isGuest ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Sign in to post partner availability.
          </p>
        ) : partnersQ.isLoading ? (
          <p className="muted">Loading…</p>
        ) : partners.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>
            No partner posts yet.
          </p>
        ) : (
          partners.slice(0, 3).map((p) => (
            <div key={p.id} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span className="rail-partner-av">{p.crag_name?.charAt(0) ?? 'P'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Partner · {p.crag_name ?? 'Crag TBD'}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {p.when_text ?? 'Flexible'} · {p.crag_name ?? 'Crag'}
                </div>
                <div className="chip-row" style={{ marginTop: 6 }}>
                  {(p.styles ?? []).slice(0, 2).map((s) => (
                    <span key={s} className="chip outline" style={{ height: 22, fontSize: 11 }}>
                      {s}
                    </span>
                  ))}
                  {p.grade_band && (
                    <span className="chip green" style={{ height: 22, fontSize: 11 }}>
                      {p.grade_band}
                    </span>
                  )}
                </div>
              </div>
              <button type="button" className="btn btn-secondary rail-join-btn">
                Join
              </button>
            </div>
          ))
        )}
      </div>

      {seasonal && (
        <div className="rail-card">
          <h4>Seasonal challenges</h4>
          <button
            type="button"
            className="challenge-row"
            onClick={isGuest ? onSignIn : onOpenCrew}
          >
            {pct != null && (
              <div className="challenge-ring" aria-hidden>
                <svg viewBox="0 0 48 48" width={48} height={48}>
                  <circle cx={24} cy={24} r={20} fill="none" stroke="var(--surface)" strokeWidth={5} />
                  <circle
                    cx={24}
                    cy={24}
                    r={20}
                    fill="none"
                    stroke="var(--peen-orange)"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 125.6} 125.6`}
                    transform="rotate(-90 24 24)"
                  />
                </svg>
                <span>{pct}%</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {(seasonal as { title?: string }).title ?? seasonal.name ?? 'Challenge'}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {seasonal.progress != null && seasonal.total != null
                  ? `${seasonal.progress}/${seasonal.total} routes`
                  : 'In progress'}
                {seasonal.days_left != null ? ` · ${seasonal.days_left} days left` : ''}
              </div>
            </div>
          </button>
        </div>
      )}

      {!isGuest && (
        <div className="rail-card">
          <h4 className="rail-inbox-head">
            <span>Inbox</span>
            <button
              type="button"
              className="rail-mark-read"
              disabled={markAllRead.isPending || inbox.every((n) => n.read === true)}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </button>
          </h4>
          {inbox.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              All caught up.
            </p>
          ) : (
            inbox.map((n) => (
              <div key={n.id} className="row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div>{n.title ?? n.body ?? 'Notification'}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                {n.read !== true && (
                  <span className="rail-inbox-unread" />
                )}
              </div>
            ))
          )}
          <button type="button" className="rail-link rail-inbox-open" onClick={onNotifs}>
            Open inbox
          </button>
        </div>
      )}

      {isGuest && (
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={onSignIn}>
          Sign in
        </button>
      )}

      <footer className="rail-foot rail-foot-links muted">
        <a href="/terms.html">Terms</a>
        <a href="/privacy.html">Privacy</a>
        <a href="mailto:support@peen.app">Support</a>
      </footer>
    </>
  )
}
