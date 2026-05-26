import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Avatar, Icon } from './Icon'
import { TopoLines } from './TopoLines'
import { useAuth } from '../features/auth/AuthProvider'
import {
  useInbox,
  useMyProfile,
  usePartners,
  useSeasonalSpotlight,
} from '../hooks/useMigration'

const NAV = [
  { to: '/feed', label: 'Feed', icon: 'feed' as const },
  { to: '/crags', label: 'Crags', icon: 'map' as const },
  { to: '/crew', label: 'Crew', icon: 'crew' as const },
  { to: '/profile', label: 'Profile', icon: 'profile' as const },
]

const PINNED_CRAGS = ['Crazy Horse', 'Tonsai', 'Stone Locker']

export function AppShell({
  railOn,
  onToggleRail,
  onLog,
  onNotifs,
  onSignIn,
}: {
  railOn: boolean
  onToggleRail: () => void
  onLog: () => void
  onNotifs: () => void
  onSignIn: () => void
}) {
  const { accessToken, signOut } = useAuth()
  const profileQ = useMyProfile()
  const inboxQ = useInbox()
  const isGuest = !accessToken
  const [sidebarCompact, setSidebarCompact] = useState(false)
  const navigate = useNavigate()

  const unread = (inboxQ.data ?? []).filter((n) => n.read !== true).length
  const appClass = ['app', !railOn ? 'rail-off' : '', sidebarCompact ? 'sidebar-rail' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={appClass}>
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
            <div className="nav-label">Pinned</div>
            <div className="nav-group">
              {PINNED_CRAGS.map((name) => (
                <NavLink key={name} to="/crags" className="nav-item">
                  <span className="nav-icon">
                    <Icon name="pin" size={18} />
                  </span>
                  <span className="label">{name}</span>
                </NavLink>
              ))}
            </div>
            <div className="nav-label">Challenges</div>
            <div className="nav-group">
              <button
                type="button"
                className="nav-item"
                onClick={() => navigate('/crew', { state: { tab: 'Challenges' } })}
              >
                <span className="nav-icon" style={{ color: 'var(--peen-orange)' }}>
                  <Icon name="trophy" size={18} />
                </span>
                <span className="label">Seasonal</span>
              </button>
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
        <button
          type="button"
          className="icon-btn sidebar-toggle"
          onClick={() => setSidebarCompact((v) => !v)}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Icon name="more" size={20} />
        </button>
        <label className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search routes, climbers, crags…" aria-label="Search" />
          <span className="kbd">⌘K</span>
        </label>
        <div className="spacer" />
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
          <button type="button" className="avatar-btn" onClick={() => signOut()} title="Sign out">
            <Avatar name={profileQ.data?.nickname ?? 'You'} size={38} />
          </button>
        ) : (
          <button type="button" className="avatar-btn" onClick={onSignIn} title="Guest">
            ?
          </button>
        )}
      </header>

      <main className="main">
        <Outlet />
      </main>

      {railOn && (
        <aside className="rail">
          <RightRail
            onToggleRail={onToggleRail}
            isGuest={isGuest}
            onSignIn={onSignIn}
            onNotifs={onNotifs}
            onOpenCrew={() => navigate('/crew')}
          />
        </aside>
      )}

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
  onToggleRail,
  isGuest,
  onSignIn,
  onNotifs,
  onOpenCrew,
}: {
  onToggleRail: () => void
  isGuest: boolean
  onSignIn: () => void
  onNotifs: () => void
  onOpenCrew: () => void
}) {
  const partnersQ = usePartners()
  const seasonalQ = useSeasonalSpotlight()
  const inboxQ = useInbox()
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
      <button
        type="button"
        className="icon-btn rail-close"
        onClick={onToggleRail}
        aria-label="Hide panel"
      >
        <Icon name="close" size={16} />
      </button>

      <div className="rail-card">
        <h4>Conditions · Crazy Horse</h4>
        <div className="rail-weather">
          <div className="rail-weather-icon">
            <Icon name="sun" size={28} />
          </div>
          <div>
            <div className="rail-weather-temp">
              28°<span> / 22°</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Clear · NE 6 km/h · feels dry
            </div>
          </div>
        </div>
        <div className="rail-weather-forecast">
          {['Fri', 'Sat', 'Sun', 'Mon', 'Tue'].map((d, i) => (
            <div key={d} className={`rail-weather-day ${i === 0 ? 'active' : ''}`}>
              <div className="day-label">{d}</div>
              <Icon name={i === 3 ? 'cloud' : 'sun'} size={16} />
              <div className="day-temp">{[29, 30, 28, 25, 29][i]}°</div>
            </div>
          ))}
        </div>
      </div>

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
              <Avatar name={p.crag_name ?? 'P'} size={36} />
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
              <Icon name="chevR" size={16} />
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
          <h4 style={{ display: 'flex' }}>
            <span>Inbox</span>
            <button type="button" className="rail-link" onClick={onNotifs}>
              Open
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
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--tint)',
                      marginTop: 8,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {isGuest && (
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={onSignIn}>
          Sign in
        </button>
      )}

      <footer className="rail-foot muted">
        <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a>
      </footer>
    </>
  )
}
