import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type SyntheticAuth = { user: { id: string } | null; accessToken: string | null; loading: boolean }
const Context = createContext<SyntheticAuth>({ user: null, accessToken: null, loading: false })
const ACCOUNTS = ['synthetic-alice', 'synthetic-bob', null] as const

export function useAuth() {
  return useContext(Context)
}

export function SyntheticAuthHost({ children }: Readonly<{ children: ReactNode }>) {
  const [index, setIndex] = useState(0)
  const id = ACCOUNTS[index]
  const value = useMemo<SyntheticAuth>(
    () => ({ user: id ? { id } : null, accessToken: id ? `token-${id}` : null, loading: false }),
    [id],
  )
  return (
    <Context.Provider value={value}>
      <p className="synthetic-banner">
        Synthetic local harness, not live Peen. Account: <strong>{id ?? 'guest'}</strong>{' '}
        <button type="button" onClick={() => setIndex((i) => (i + 1) % ACCOUNTS.length)}>
          Switch synthetic account
        </button>
      </p>
      {children}
    </Context.Provider>
  )
}
