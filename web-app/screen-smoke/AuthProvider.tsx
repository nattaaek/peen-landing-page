import { createContext, useContext, useState, type ReactNode } from 'react'
const Context = createContext({user:{id:'alice'},accessToken:'synthetic-alice'})
export function useAuth() { return useContext(Context) }
export function SyntheticAuthHost({children}:{children:ReactNode}) {
  const [id,setId]=useState('alice')
  return <Context.Provider value={{user:{id},accessToken:`synthetic-${id}`}}>
    <button style={{position:'fixed',left:8,top:8,zIndex:10000}} onClick={()=>setId(id==='alice'?'bob':'alice')}>Switch synthetic account</button>
    {children}
  </Context.Provider>
}
