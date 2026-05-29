import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Avatar, Icon } from './Icon'
import { ProfileMenu } from './ProfileMenu'
import { RailInboxRow } from './RailInboxRow'
import { RailWeather } from './RailWeather'
import { TopbarSearch } from './TopbarSearch'
import { TopoLines } from './TopoLines'
import { useAuth } from '../features/auth/AuthProvider'
import {
  useCommunityChallenges,
  useInbox,
  useMarkAllNotificationsRead,
  useMyProfile,
  usePartners,
  usePendingCrewInvites,
  useSeasonalSpotlight,
  useWishlistRoutes,
} from '../hooks/useMigration'
import type { CommunityChallengeRow } from '../types/api'

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

  const inboxQ = useInbox()
  const crewInvitesQ = usePendingCrewInvites()
  const unread = inboxQ.data?.filter((n) => n.read !== true).length ?? 0
  const crewInviteCount = crewInvitesQ.data?.length ?? 0
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
              {item.to === '/crew' && !isGuest && crewInviteCount > 0 && (
                <span className="nav-badge">{crewInviteCount > 9 ? '9+' : crewInviteCount}</span>
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
          {!isGuest && <span className="dot" />}
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
          onToast={onToast}
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

function challengePct(ch: CommunityChallengeRow): number | null {
  const done = ch.done ?? 0
  const total = ch.total ?? 0
  if (!total) return null
  return Math.round((done / total) * 100)
}

function RailChallengeRow({
  title,
  subtitle,
  pct,
  accent,
  onClick,
}: {
  title: string
  subtitle: string
  pct: number | null
  accent: string
  onClick: () => void
}) {
  return (
    <button type="button" className="challenge-row" onClick={onClick}>
      {pct != null && (
        <div className="challenge-ring" aria-hidden>
          <svg viewBox="0 0 48 48" width={48} height={48}>
            <circle cx={24} cy={24} r={20} fill="none" stroke="var(--surface)" strokeWidth={5} />
            <circle
              cx={24}
              cy={24}
              r={20}
              fill="none"
              stroke={accent}
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
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12 }}>
          {subtitle}
        </div>
      </div>
    </button>
  )
}

function RightRail({
  isGuest,
  onSignIn,
  onNotifs,
  onOpenCrew,
  onToast,
  homeAreaId,
}: {
  isGuest: boolean
  onSignIn: () => void
  onNotifs: () => void
  onOpenCrew: () => void
  onToast?: (msg: string) => void
  homeAreaId?: string
}) {
  const partnersQ = usePartners()
  const challengesQ = useCommunityChallenges()
  const seasonalQ = useSeasonalSpotlight()
  const inboxQ = useInbox()
  const markAllRead = useMarkAllNotificationsRead()
  const partners = partnersQ.data ?? []
  const challenges = challengesQ.data ?? []
  const seasonal = seasonalQ.data as
    | { name?: string; title?: string; progress?: number; total?: number; days_left?: number }
    | null
    | undefined
  const inbox = (inboxQ.data ?? []).slice(0, 3)

  const railChallenges: CommunityChallengeRow[] =
    challenges.length > 0
      ? challenges.slice(0, 2)
      : seasonal?.total
        ? [
            {
              id: 'seasonal-spotlight',
              title: seasonal.title ?? seasonal.name ?? 'Seasonal challenge',
              done: Number(seasonal.progress ?? 0),
              total: Number(seasonal.total ?? 0),
              days_left: seasonal.days_left,
              color_hex: '#D55A1F',
            },
          ]
        : []

  const partnerDisplayName = (p: (typeof partners)[0]) =>
    p.display_name ?? p.nickname ?? p.username ?? 'Climber'

  return (
    <>
      <RailWeather homeAreaId={homeAreaId} />

      <div className="rail-card">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>This weekend</span>
          <button
            type="button"
            className="rail-link"
            style={{ marginLeft: 'auto' }}
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
              <Avatar name={partnerDisplayName(p)} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{partnerDisplayName(p)}</div>
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
              <button
                type="button"
                className="btn btn-secondary rail-join-btn"
                onClick={() => {
                  if (isGuest) {
                    onSignIn()
                    return
                  }
                  const first = partnerDisplayName(p).split(' ')[0]
                  onToast?.(`Request sent to ${first}`)
                }}
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>

      {railChallenges.length > 0 && (
        <div className="rail-card">
          <h4>Seasonal challenges</h4>
          {railChallenges.map((ch) => {
            const pct = challengePct(ch)
            const accent = ch.color_hex ?? 'var(--peen-orange)'
            const subtitle = [
              ch.done != null && ch.total != null ? `${ch.done}/${ch.total} routes` : null,
              ch.days_left != null ? `${ch.days_left} days left` : null,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <RailChallengeRow
                key={ch.id}
                title={ch.title ?? 'Challenge'}
                subtitle={subtitle || 'In progress'}
                pct={pct}
                accent={accent}
                onClick={isGuest ? onSignIn : onOpenCrew}
              />
            )
          })}
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
            inbox.map((n) => <RailInboxRow key={n.id} n={n} />)
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
