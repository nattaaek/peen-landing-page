import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  AuthProvider as RealAuthProvider, useAuth as useRealAuth, useRequireAuth as useRealRequireAuth,
} from '../../src/features/auth/AuthProvider.tsx'
import { browserInvitationSession } from './bootstrap'

export const AUTH_MODE_KEY = 'peen.fixture.auth-mode'
const ACCOUNT_KEY = 'peen.fixture.account'
export const authMode = window.sessionStorage.getItem(AUTH_MODE_KEY) === 'real-unconfigured'
  ? 'real-unconfigured' : 'synthetic'

type AuthValue = ReturnType<typeof useRealAuth>
const SyntheticContext = createContext<AuthValue | null>(null)
export const FixtureAccountControls = createContext<((account: string | null) => void) | null>(null)

const syntheticSession = (account: string) => ({
  access_token: `synthetic-${account}`, token_type: 'bearer',
  user: { id: account, email: `${account}@fixture.invalid` },
}) as unknown as Session

function storeAccount(account: string | null) {
  if (account === null) window.sessionStorage.removeItem(ACCOUNT_KEY)
  else window.sessionStorage.setItem(ACCOUNT_KEY, account)
}

function SyntheticAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [account, setAccount] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = window.sessionStorage.getItem(ACCOUNT_KEY)
      browserInvitationSession.observeAccount(restored)
      setAccount(restored)
      setLoading(false)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [])
  const switchAccount = useCallback((next: string | null) => {
    storeAccount(next)
    browserInvitationSession.observeAccount(next)
    setAccount(next)
  }, [])
  const signIn = useCallback(async () => {
    browserInvitationSession.observeAccount('synthetic-alice')
    storeAccount('synthetic-alice')
    window.location.replace(browserInvitationSession.returnPath())
  }, [])
  const signOut = useCallback(async () => {
    browserInvitationSession.clear()
    switchAccount(null)
  }, [switchAccount])
  const value = useMemo(() => {
    const session = account === null ? null : syntheticSession(account)
    return { session, user: session?.user ?? null, accessToken: session?.access_token ?? null, loading,
      devAuthBypass: true, signInWithGoogle: signIn, signInWithApple: signIn, signOut }
  }, [account, loading, signIn, signOut])
  return <SyntheticContext.Provider value={value}>
    <FixtureAccountControls.Provider value={switchAccount}>{children}</FixtureAccountControls.Provider>
  </SyntheticContext.Provider>
}

function useSyntheticAuth(): AuthValue {
  const value = useContext(SyntheticContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}

function useSyntheticRequireAuth() {
  const auth = useSyntheticAuth()
  return { ...auth, isGuest: !auth.accessToken }
}

export const AuthProvider = authMode === 'real-unconfigured' ? RealAuthProvider : SyntheticAuthProvider
export const useAuth = authMode === 'real-unconfigured' ? useRealAuth : useSyntheticAuth
export const useRequireAuth = authMode === 'real-unconfigured' ? useRealRequireAuth : useSyntheticRequireAuth
