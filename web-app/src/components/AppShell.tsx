import { NavLink, Outlet } from 'react-router-dom'
import { Avatar, Icon } from './Icon'
import { useAuth } from '../features/auth/AuthProvider'
import { useMyProfile } from '../hooks/useMigration'

const NAV = [
  { to: '/feed', label: 'Feed', icon: 'feed' as const },
  { to: '/crags', label: 'Crags', icon: 'map' as const },
  { to: '/crew', label: 'Crew', icon: 'crew' as const },
  { to: '/profile', label: 'Profile', icon: 'profile' as const },
]

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
  const isGuest = !accessToken

  return (
    <div className={`app ${railOn ? '' : 'rail-off'}`}>
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="mark">
            <img src="/assets/app-icon.jpg" alt="" width={32} height={32} />
          </span>
          <span className="name">peen</span>
          <span className="dot" />
        </a>
        <nav className="side-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot muted" style={{ fontSize: 12, marginTop: 'auto' }}>
          <a href="/">Marketing site</a>
        </div>
      </aside>

      <header className="topbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search routes, climbers…" aria-label="Search" />
          <span className="kbd">⌘K</span>
        </div>
        <div className="spacer" />
        {isGuest ? (
          <button type="button" className="btn btn-secondary" onClick={onSignIn}>
            Sign in
          </button>
        ) : (
          <button type="button" className="btn-log" onClick={onLog}>
            <Icon name="plus" size={16} /> Log climb
          </button>
        )}
        <button type="button" className="icon-btn" onClick={onNotifs} aria-label="Notifications">
          <Icon name="bell" size={18} />
        </button>
        {accessToken ? (
          <button
            type="button"
            className="avatar-btn"
            onClick={() => signOut()}
            title="Sign out"
          >
            <Avatar name={profileQ.data?.nickname ?? 'You'} size={38} />
          </button>
        ) : (
          <button type="button" className="avatar-btn" onClick={onSignIn}>
            ?
          </button>
        )}
      </header>

      <main className="main">
        <Outlet />
      </main>

      {railOn && (
        <aside className="rail">
          <RightRail onToggleRail={onToggleRail} isGuest={isGuest} onSignIn={onSignIn} />
        </aside>
      )}

      <nav className="mobile-tabs" aria-label="Main">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className="fab" onClick={isGuest ? onSignIn : onLog} aria-label="Log">
          <Icon name="plus" size={24} />
        </button>
      </nav>
    </div>
  )
}

function RightRail({
  onToggleRail,
  isGuest,
  onSignIn,
}: {
  onToggleRail: () => void
  isGuest: boolean
  onSignIn: () => void
}) {
  return (
    <div style={{ padding: 16 }}>
      <button type="button" className="icon-btn" onClick={onToggleRail} style={{ marginBottom: 12 }}>
        <Icon name="close" size={16} />
      </button>
      <div className="card" style={{ marginBottom: 12 }}>
        <h4 style={{ margin: '0 0 8px' }}>Conditions</h4>
        <p className="muted" style={{ fontSize: 13 }}>
          Chiang Mai · Dry · 28°C
        </p>
      </div>
      {!isGuest && (
        <div className="card">
          <h4 style={{ margin: '0 0 8px' }}>Weekend partners</h4>
          <p className="muted" style={{ fontSize: 13 }}>
            See Crew tab for live partner posts.
          </p>
        </div>
      )}
      {isGuest && (
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={onSignIn}>
          Sign in
        </button>
      )}
      <footer style={{ marginTop: 24, fontSize: 12 }}>
        <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a>
      </footer>
    </div>
  )
}
