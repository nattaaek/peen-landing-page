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
      setLoading(false)
      return
    }
    if (!env.isConfigured()) {
      setLoading(false)
      return
    }
    const sb = getSupabase()
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session ?? (devBypass ? createDevAuthSession() : null))
      setLoading(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? (devBypass ? createDevAuthSession() : null))
    })
    return () => sub.subscription.unsubscribe()
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
    if (env.isConfigured()) {
      await getSupabase().auth.signOut()
    }
    setSession(devBypass ? createDevAuthSession() : null)
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
