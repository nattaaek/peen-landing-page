import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createDevAuthSession, isDevAuthBypassEnabled } from '../../lib/devAuth'
import { env } from '../../lib/env'
import { browserInvitationSession } from '../../lib/invitationBootstrap'
import { getSupabase } from '../../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  accessToken: string | null
  loading: boolean
  /** Local dev bypass active (never true in production). */
  devAuthBypass: boolean
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const redirectTo = () => `${window.location.origin}/auth/callback`

export function AuthProvider({ children }: { children: ReactNode }) {
  const devBypass = isDevAuthBypassEnabled()
  const [session, setSession] = useState<Session | null>(() =>
    devBypass ? createDevAuthSession() : null,
  )
  const [loading, setLoading] = useState(!devBypass)

  useEffect(() => {
    if (devBypass && !env.isConfigured()) {
      browserInvitationSession.observeAccount(createDevAuthSession().user.id)
      setLoading(false)
      return
    }
    if (!env.isConfigured()) {
      browserInvitationSession.observeAccount(null)
      setLoading(false)
      return
    }
    const sb = getSupabase()
    let live = true
    let eventCount = 0
    const initialEventCount = eventCount
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      eventCount++
      if (!live) return
      const resolvedSession = next ?? (devBypass ? createDevAuthSession() : null)
      browserInvitationSession.observeAccount(resolvedSession?.user.id ?? null)
      setSession(resolvedSession)
      setLoading(false)
    })
    sb.auth.getSession().then(({ data }) => {
      if (!live || eventCount !== initialEventCount) return
      const resolvedSession = data.session ?? (devBypass ? createDevAuthSession() : null)
      browserInvitationSession.observeAccount(resolvedSession?.user.id ?? null)
      setSession(resolvedSession)
      setLoading(false)
    }).catch(() => {
      if (!live || eventCount !== initialEventCount) return
      const fallback = devBypass ? createDevAuthSession() : null
      browserInvitationSession.observeAccount(fallback?.user.id ?? null)
      setSession(fallback)
      setLoading(false)
    })
    return () => {
      live = false
      sub.subscription.unsubscribe()
    }
  }, [devBypass])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    })
    if (error) throw error
  }, [])

  const signInWithApple = useCallback(async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: redirectTo() },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    browserInvitationSession.clear()
    if (env.isConfigured()) {
      await getSupabase().auth.signOut()
    }
    const next = devBypass ? createDevAuthSession() : null
    browserInvitationSession.observeAccount(next?.user.id ?? null)
    setSession(next)
  }, [devBypass])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      loading,
      devAuthBypass: devBypass,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }),
    [session, loading, devBypass, signInWithGoogle, signInWithApple, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useRequireAuth() {
  const auth = useAuth()
  return { ...auth, isGuest: !auth.accessToken }
}
