import React, {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {SyntheticAuthHost} from './AuthProvider'
import {SeasonalChallengeDetailOverlay} from '../src/features/crew/SeasonalChallengeDetailOverlay'
import '../src/styles/tokens.css'
import '../src/styles/app.css'
import '../src/styles/extra.css'
const enrolled=new Set<string>()
const syntheticFetch = (input: RequestInfo | URL, init?: RequestInit): Response => {
 const url = input instanceof Request ? input.url : input.toString(); if(!url.startsWith('http://127.0.0.1:18082/v1/migration/seasonal')) throw new Error('Synthetic screen host rejects nonlocal requests')
 if (typeof init?.body !== 'string') throw new TypeError('Synthetic screen host requires a JSON string body')
 const request=JSON.parse(init.body); const account=new Headers(init?.headers).get('authorization')??''
 if(request.op==='joinChallenge') {
   if(request.params.invitation_code!=='synthetic-valid')return new Response(JSON.stringify({error:'invitation_invalid'}),{status:400})
   enrolled.add(account); return new Response('{}')
 }
 return new Response(JSON.stringify({challenge_id:'synthetic',slug:'synthetic',title:'Synthetic Invitation Season',achievement_id:'synthetic',start_date:'2026-05-01',end_date:'2026-12-31',requires_invitation:true,enrolled:enrolled.has(account),routes:[],routes_completed_count:0,routes_total:30,overall_complete:false,eligible_for_prize:false,prize_claim_status:'none'}))
}
window.fetch = (input, init) => {
  try { return Promise.resolve(syntheticFetch(input, init)) }
  catch (error) { return Promise.reject(error) }
}
function Host(){const [open,setOpen]=useState(true);return <><p>SYNTHETIC LOCAL SCREEN TEST</p><button onClick={()=>setOpen(true)}>Open synthetic challenge</button>{open&&<SeasonalChallengeDetailOverlay challengeId="synthetic" isGuest={false} onClose={()=>setOpen(false)}/>}</>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><SyntheticAuthHost><Host/></SyntheticAuthHost></MemoryRouter></QueryClientProvider></React.StrictMode>)
