import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
const Context = createContext({user:{id:'alice'},accessToken:'synthetic-alice'})
export function useAuth() { return useContext(Context) }
export function SyntheticAuthHost({children}:Readonly<{children:ReactNode}>) {
  const [id,setId]=useState('alice')
  const value = useMemo(() => ({ user: { id }, accessToken: `synthetic-${id}` }), [id])
  return <Context.Provider value={value}>
    <button style={{position:'fixed',left:8,top:8,zIndex:10000}} onClick={()=>setId(id==='alice'?'bob':'alice')}>Switch synthetic account</button>
    {children}
  </Context.Provider>
}
