import { useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { LoginGate } from './features/auth/LoginGate'
import { CragsView } from './features/crags/CragsView'
import { CrewView } from './features/crew/CrewView'
import { FeedView } from './features/feed/FeedView'
import { NotificationsDrawer } from './features/notifications/NotificationsDrawer'
import { ProfileView } from './features/profile/ProfileView'
import { LogComposer } from './features/route/LogComposer'
import { RouteDetailOverlay } from './features/route/RouteDetail'
import type { ApiRoute } from './types/api'

function AppLayout() {
  const { accessToken } = useAuth()
  const isGuest = !accessToken
  const [railOn, setRailOn] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginMsg, setLoginMsg] = useState<string | null>(null)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [routeId, setRouteId] = useState<string | null>(null)
  const [composerRoute, setComposerRoute] = useState<ApiRoute | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const openLogin = useCallback((msg?: string) => {
    setLoginMsg(msg ?? null)
    setLoginOpen(true)
  }, [])

  const openRoute = useCallback((route: ApiRoute) => {
    setRouteId(route.id)
  }, [])

  const openRouteById = useCallback((id: string) => {
    setRouteId(id)
  }, [])

  const openLog = useCallback(
    (route?: ApiRoute) => {
      if (isGuest) {
        openLogin('Sign in to log a climb.')
        return
      }
      if (route) setComposerRoute(route)
      setComposerOpen(true)
    },
    [isGuest, openLogin],
  )

  return (
    <>
      <Routes>
        <Route
          element={
            <AppShell
              railOn={railOn}
              onToggleRail={() => setRailOn((v) => !v)}
              onLog={() => openLog()}
              onNotifs={() => (isGuest ? openLogin() : setNotifsOpen(true))}
              onSignIn={() => openLogin()}
            />
          }
        >
          <Route index element={<Navigate to="feed" replace />} />
          <Route
            path="feed"
            element={
              <FeedView onSignIn={() => openLogin()} onOpenRoute={openRouteById} />
            }
          />
          <Route path="crags" element={<CragsView onOpenRoute={openRoute} />} />
          <Route path="crew" element={<CrewView onSignIn={() => openLogin()} />} />
          <Route path="profile" element={<ProfileView onSignIn={() => openLogin()} />} />
        </Route>
      </Routes>

      {routeId && (
        <RouteDetailOverlay
          routeId={routeId}
          onClose={() => setRouteId(null)}
          onLog={(r) => openLog(r)}
          isGuest={isGuest}
          onSignIn={() => openLogin('Sign in to log a send.')}
        />
      )}
      <LogComposer
        route={composerRoute}
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false)
          setComposerRoute(null)
        }}
        onSuccess={() => setToast('Send logged!')}
      />
      <LoginGate open={loginOpen} message={loginMsg} onClose={() => setLoginOpen(false)} />
      <NotificationsDrawer
        open={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        isGuest={isGuest}
        onSignIn={() => openLogin()}
      />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
