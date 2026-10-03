import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
const Context = createContext({ user: { id: 'review-a' }, accessToken: 'fixture-a', loading: false, devAuthBypass: true,
 signInWithGoogle: async () => {}, signInWithApple: async () => {}, signOut: async () => {} })
export function useAuth() { return useContext(Context) }
export function useRequireAuth() { return { ...useAuth(), isGuest: false } }
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
 const [account, setAccount] = useState('review-a')
 const value = useMemo(() => ({ user: {id:account}, accessToken:`fixture-${account}`, loading:false,devAuthBypass:true,
  signInWithGoogle:async()=>{},signInWithApple:async()=>{},signOut:async()=>{} }), [account])
 return <Context.Provider value={value}><div className="fixture-review-banner">SYNTHETIC LOCAL REVIEW · no production data or writes <button onClick={() => setAccount(account==='review-a'?'review-b':'review-a')}>Switch test account</button></div>{children}</Context.Provider>
}
