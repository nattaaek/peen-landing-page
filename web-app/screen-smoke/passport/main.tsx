import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from '../../src/App'
import '../../src/styles/tokens.css'
import '../../src/styles/app.css'
import '../../src/styles/extra.css'
import '../../src/styles/passport.css'
import './review.css'
const nativeFetch = window.fetch.bind(window)
const enrolled = new Set<string>()
const grades=['6a/+','6b/+','6c/+','7a/+','7b/+','7c/+']
const requests: {op:string;account:string}[]=[]
const fixtureFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
 const url = new URL(input instanceof Request ? input.url : input.toString(),location.href)
 if (url.origin!==location.origin) throw new Error('Review host blocks all external requests')
 if (!url.pathname.startsWith('/v1/')) return nativeFetch(input,init)
 const body=typeof init?.body==='string'?JSON.parse(init.body):{}
 const account=new Headers(init?.headers).get('authorization')??''
 requests.push({op:body.op??url.pathname,account})
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})
 const progress={challenge_id:'fixture-season',title:'Poda | Best routes ever',challenge_subtitle:'Synthetic review season · no production data',start_date:'2026-12-01',end_date:'2027-03-31',requires_invitation:true,enrolled:enrolled.has(account),routes_completed_count:account.endsWith('review-b')?1:0,routes_total:30,overall_complete:false,
 routes:grades.flatMap((grade,band)=>Array.from({length:5},(_,i)=>({route_id:`fixture-${band}-${i}`,grade_label:grade.toUpperCase(),sort_order:i,completed:account.endsWith('review-b')&&band===0&&i===0,status:'not_logged',route_name:`Review route ${i+1}`,area_name:'Fictional review route'})))}
 if(body.op==='seasonal_challenge_spotlight') return reply({challenge_id:'fixture-season',title:progress.title,routes_total:30,my_completed_count:0})
 if(body.op==='seasonal_challenge_progress' && new URLSearchParams(location.search).get('reviewProgress')==='fail') return reply({error:'synthetic_progress_unavailable'},503)
 if(body.op==='seasonal_challenge_progress') return reply({...progress,challenge_id:body.params.p_challenge_id??'fixture-season'})
 if(body.op==='joinChallenge') {
  await new Promise(resolve=>setTimeout(resolve,700))
  const code=body.params.invitation_code
  if(code==='review-success'){enrolled.add(account);return reply({})}
  if(code==='review-network')throw new Error('Synthetic network unavailable')
  const errors:Record<string,string>={'review-invalid':'invitation_invalid','review-expired':'invitation_invalid','review-used':'invitation_used','review-closed':'challenge_closed','review-throttled':'invitation_rate_limited'}
  return reply({error:errors[code]??'invitation_invalid'},400)
 }
 return reply([])
}
window.fetch=fixtureFetch
// Rendered audit exposes counts only, never codes, credentials, or account PII.
function Audit(){return <details className="fixture-audit"><summary>Local request audit</summary><button onClick={()=>document.getElementById('fixture-count')!.textContent=String(requests.filter(r=>r.op==='joinChallenge').length)}>Refresh count</button><span id="fixture-count">0</span></details>}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><BrowserRouter basename="/app"><App/><Audit/></BrowserRouter></QueryClientProvider>)
