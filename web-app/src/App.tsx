import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { LoginGate } from './features/auth/LoginGate'
import { CragsView } from './features/crags/CragsView'
import { CrewView } from './features/crew/CrewView'
import { FeedView } from './features/feed/FeedView'
import { NotificationsDrawer } from './features/notifications/NotificationsDrawer'
import { ProfileView } from './features/profile/ProfileView'
import { PublicProfilePeek } from './features/profile/PublicProfilePeek'
import { LogComposer } from './features/route/LogComposer'
import { RouteDetailOverlay } from './features/route/RouteDetail'
import type { ApiRoute } from './types/api'

function AppLayout() {
  const navigate = useNavigate()
  const { accessToken, user } = useAuth()
  const isGuest = !accessToken
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginMsg, setLoginMsg] = useState<string | null>(null)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [routeId, setRouteId] = useState<string | null>(null)
  const [composerRoute, setComposerRoute] = useState<ApiRoute | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [publicProfile, setPublicProfile] = useState<{
    userId: string
    fallbackName?: string
  } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

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
      setComposerRoute(route ?? null)
      setComposerOpen(true)
    },
    [isGuest, openLogin],
  )

  const onNotificationNavigate = useCallback(
    (entityType?: string, entityId?: string) => {
      setNotifsOpen(false)
      if (!entityId) return
      if (entityType === 'route' || entityType === 'routes') {
        setRouteId(entityId)
      }
    },
    [],
  )

  return (
    <>
      <Routes>
        <Route
          element={
            <AppShell
              onLog={() => openLog()}
              onNotifs={() => (isGuest ? openLogin() : setNotifsOpen(true))}
              onSignIn={() => openLogin()}
              onOpenRoute={openRouteById}
              onOpenProfile={(userId, fallbackName) =>
                setPublicProfile({ userId, fallbackName })
              }
              onToast={setToast}
            />
          }
        >
          <Route index element={<Navigate to="feed" replace />} />
          <Route
            path="feed"
            element={
              <FeedView
                onSignIn={openLogin}
                onOpenRoute={openRouteById}
                onToast={setToast}
                onOpenProfile={(userId, fallbackName) => {
                  if (user?.id === userId) navigate('/profile')
                  else setPublicProfile({ userId, fallbackName })
                }}
              />
            }
          />
          <Route
            path="crags"
            element={
              <CragsView
                onOpenRoute={openRoute}
                onSignIn={() => openLogin('Sign in to use your wishlist.')}
              />
            }
          />
          <Route
            path="crew"
            element={<CrewView onSignIn={() => openLogin()} onOpenRoute={openRouteById} />}
          />
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
          onToast={setToast}
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
        onNavigate={onNotificationNavigate}
      />
      {publicProfile && (
        <PublicProfilePeek
          userId={publicProfile.userId}
          fallbackName={publicProfile.fallbackName}
          onClose={() => setPublicProfile(null)}
          onOpenRoute={(id) => {
            setPublicProfile(null)
            setRouteId(id)
          }}
          onSignIn={() => openLogin('Sign in to follow climbers.')}
        />
      )}
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
