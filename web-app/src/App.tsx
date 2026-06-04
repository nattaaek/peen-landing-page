import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { LoginGate } from './features/auth/LoginGate'
import { CragsView } from './features/crags/CragsView'
import { CrewView } from './features/crew/CrewView'
import { AscentDetailOverlay } from './features/feed/AscentDetailOverlay'
import { FeedView } from './features/feed/FeedView'
import { NotificationsDrawer } from './features/notifications/NotificationsDrawer'
import { ProfileView } from './features/profile/ProfileView'
import { PublicProfilePeek } from './features/profile/PublicProfilePeek'
import { LogComposer } from './features/route/LogComposer'
import { RouteDetailOverlay } from './features/route/RouteDetail'
import { applyClimbSearchParam, climbIdFromSearchParams } from './lib/climbDeepLink'
import { applyRouteSearchParam, routeIdFromSearchParams } from './lib/routeDeepLink'
import { parseRouteId } from './lib/routeIds'
import type { ApiRoute, FeedClimbRow } from './types/api'

type AscentOverlayState = {
  id: string
  post?: FeedClimbRow
  expandComments?: boolean
}

function AppLayout() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, user } = useAuth()
  const isGuest = !accessToken
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginMsg, setLoginMsg] = useState<string | null>(null)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [routeId, setRouteId] = useState<string | null>(() => routeIdFromSearchParams(window.location.search))
  const [composerRoute, setComposerRoute] = useState<ApiRoute | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [publicProfile, setPublicProfile] = useState<{
    userId: string
    fallbackName?: string
  } | null>(null)
  const [ascent, setAscent] = useState<AscentOverlayState | null>(null)
  const climbParam = climbIdFromSearchParams(searchParams.toString())

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const openLogin = useCallback((msg?: string) => {
    setLoginMsg(msg ?? null)
    setLoginOpen(true)
  }, [])

  const syncRouteParam = useCallback(
    (id: string | null) => {
      setSearchParams((prev) => applyRouteSearchParam(prev, id), { replace: !id })
    },
    [setSearchParams],
  )

  useEffect(() => {
    const fromUrl = routeIdFromSearchParams(searchParams.toString())
    if (fromUrl && fromUrl !== routeId) setRouteId(fromUrl)
    if (!fromUrl && routeId) setRouteId(null)
  }, [searchParams])

  useEffect(() => {
    if (!climbParam) return
    if (!accessToken) {
      navigate('/feed')
      openLogin('Sign in to view this send.')
      return
    }
    setAscent((prev) => {
      if (prev?.id === climbParam) return prev
      return { id: climbParam, expandComments: true }
    })
  }, [climbParam, accessToken, navigate, openLogin])

  const openAscent = useCallback(
    (id: string, opts?: { post?: FeedClimbRow; expandComments?: boolean }) => {
      setAscent({ id, post: opts?.post, expandComments: opts?.expandComments })
      setSearchParams((prev) => applyClimbSearchParam(prev, id))
    },
    [setSearchParams],
  )

  const closeAscent = useCallback(() => {
    setAscent(null)
    setSearchParams((prev) => applyClimbSearchParam(prev, null), { replace: true })
  }, [setSearchParams])

  const openRoute = useCallback(
    (route: ApiRoute) => {
      const id = parseRouteId(route.id) ?? route.id
      setRouteId(id)
      syncRouteParam(id)
    },
    [syncRouteParam],
  )

  const openRouteById = useCallback(
    (id: string) => {
      const normalized = parseRouteId(id) ?? id
      setRouteId(normalized)
      syncRouteParam(normalized)
    },
    [syncRouteParam],
  )

  const closeRoute = useCallback(() => {
    setRouteId(null)
    syncRouteParam(null)
  }, [syncRouteParam])

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
      const type = entityType?.toLowerCase()
      if (type === 'route' || type === 'routes') {
        openRouteById(entityId)
        return
      }
      if (type === 'climb') {
        navigate('/feed')
        openAscent(entityId, { expandComments: true })
        return
      }
      if (type === 'crew_invite') {
        navigate('/crew')
        return
      }
      if (type === 'belay_verify_request' || type === 'belay_verify_result') {
        navigate('/profile')
        setToast('Respond to belay verification in the Peen iOS or Android app.')
      }
    },
    [openRouteById, navigate, openAscent],
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
                onOpenAscent={(id, post) => openAscent(id, { post })}
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
                onSignIn={(msg) => openLogin(msg ?? 'Sign in to use your wishlist.')}
                onToast={setToast}
              />
            }
          />
          <Route
            path="crew"
            element={<CrewView onSignIn={() => openLogin()} onOpenRoute={openRouteById} />}
          />
          <Route path="profile" element={<ProfileView onSignIn={() => openLogin()} onToast={setToast} />} />
        </Route>
      </Routes>

      {ascent && (
        <AscentDetailOverlay
          climbId={ascent.id}
          initialPost={ascent.post}
          expandComments={ascent.expandComments}
          onClose={closeAscent}
          onOpenRoute={(id) => {
            closeAscent()
            openRouteById(id)
          }}
          onOpenProfile={(userId, fallbackName) => {
            closeAscent()
            if (user?.id === userId) navigate('/profile')
            else setPublicProfile({ userId, fallbackName })
          }}
          onSignIn={openLogin}
          onToast={setToast}
        />
      )}
      {routeId && (
        <RouteDetailOverlay
          routeId={routeId}
          onClose={closeRoute}
          onLog={(r) => openLog(r)}
          onOpenRoute={openRouteById}
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
            openRouteById(id)
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
