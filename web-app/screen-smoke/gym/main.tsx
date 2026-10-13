import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { SyntheticAuthHost, useAuth } from './AuthProvider'
import fixture from '../../fixtures/gym-visit-info/chillout.synthetic.fixture.json'
import { ActiveCragPanel } from '../../src/features/crags/ActiveCragPanel'
import { CreateGymSheet } from '../../src/features/crags/CreateGymSheet'
import { EditGymSheet } from '../../src/features/crags/EditGymSheet'
import { GymVisitSection } from '../../src/features/crags/GymVisitSection'
import { CATALOG_GYMS_KEY, useGymEditCapability } from '../../src/hooks/useGymVisit'
import { normalizeApiGyms } from '../../src/lib/gymVisitInfo'
import { PeenAPIError } from '../../src/lib/peen-api/client'
import type { GymWriter } from '../../src/lib/gymWriteController'
import type { ApiGym } from '../../src/types/api'
import '../../src/styles/tokens.css'
import '../../src/styles/app.css'
import '../../src/styles/extra.css'

type CrewMode = 'none' | 'member' | 'moderator' | 'owner' | 'error' | 'malformed'
type WriteMode = 'ok' | 'reject' | 'unsupported' | 'unreadable' | 'unreadable-no-id'
const WRITE_MODES: readonly WriteMode[] = ['ok', 'reject', 'unsupported', 'unreadable', 'unreadable-no-id']
const harness: { crew: CrewMode; write: WriteMode } = { crew: 'none', write: 'ok' }
const CREW_URL = 'http://127.0.0.1:18089/v1/migration/place-crew'

const store: Record<string, unknown>[] = [
  fixture.chillout_gym,
  ...fixture.decode_cases.map((c) => c.gym as Record<string, unknown>),
].map((g) => JSON.parse(JSON.stringify(g)))

window.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : input.toString()
  if (url !== CREW_URL || typeof init?.body !== 'string') {
    throw new TypeError(`Synthetic harness blocks network requests: ${url}`)
  }
  const { params } = JSON.parse(init.body)
  await new Promise((r) => setTimeout(r, 300))
  if (harness.crew === 'error') return new Response(JSON.stringify({ error: 'database error' }), { status: 500 })
  if (harness.crew === 'malformed') return new Response('{}')
  return new Response(JSON.stringify({
    crew_id: '00000000-0000-4000-8000-00000000c0de',
    place_kind: 'gym',
    place_id: params.place_id,
    member_count: 1,
    my_role: harness.crew === 'none' ? null : harness.crew,
  }))
}

const accountFromToken = (token: string) => token.replace(/^token-/, '')

/** `unreadable*` modes commit to the store, then answer with a body that is not a gym row. */
function settle(commit: () => Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        if (harness.write === 'unsupported') reject(new PeenAPIError(501, 'op not implemented: createGymWithVisitInfo'))
        else if (harness.write === 'reject') reject(new PeenAPIError(400, 'admission[0].currency must be 3 uppercase ISO 4217 letters'))
        else if (harness.write === 'unreadable') resolve({ id: commit().id, name: null })
        else if (harness.write === 'unreadable-no-id') {
          commit()
          resolve('<html>Bad gateway</html>')
        } else resolve(commit())
      } catch (e) {
        reject(e)
      }
    }, 900),
  )
}

const fakeWriter: GymWriter = {
  createGym: (params, token) =>
    settle(() => {
      const row = { id: crypto.randomUUID(), ...params, created_by: accountFromToken(token), visit_info: null }
      store.push(row)
      return JSON.parse(JSON.stringify(row))
    }),
  createGymWithVisitInfo: (params, token) =>
    settle(() => {
      const row = { id: crypto.randomUUID(), ...params, created_by: accountFromToken(token) }
      store.push(JSON.parse(JSON.stringify(row)))
      return JSON.parse(JSON.stringify(row))
    }),
  updateGymVisitInfo: (params) =>
    settle(() => {
      const row = store.find((g) => g.id === params.id)
      if (!row) throw new PeenAPIError(400, 'gym not found')
      row.visit_info = JSON.parse(JSON.stringify(params.visit_info))
      return JSON.parse(JSON.stringify(row))
    }),
}

function GymPanel({ gym, onEdit }: { gym: ApiGym; onEdit: (() => void) | undefined }) {
  const { capability, retry } = useGymEditCapability(gym)
  return (
    <ActiveCragPanel
      crag={{
        id: gym.id, kind: 'gym', name: gym.name, gym, regionOrAddress: gym.address,
        routeCount: 0, wallCount: 0, distanceKm: null, lat: gym.latitude ?? null, lng: gym.longitude ?? null,
      }}
      routes={[]}
      routesLoaded
      visitSection={<GymVisitSection gym={gym} capability={capability} onEdit={onEdit} onRetryAccess={retry} />}
      onDismiss={() => undefined}
      onOpenRoute={() => undefined}
    />
  )
}

function EditHost({ gym, accountId, onDone }: { gym: ApiGym; accountId: string; onDone: () => void }) {
  const { capability } = useGymEditCapability(gym)
  if (capability.kind !== 'allowed') return null
  return <EditGymSheet key={`${accountId}:${gym.id}`} gym={gym} writer={fakeWriter} onClose={onDone} onSaved={onDone} />
}

function Host() {
  const qc = useQueryClient()
  const { user, accessToken } = useAuth()
  const accountId = accessToken ? (user?.id ?? null) : null
  const gymsQ = useQuery({ queryKey: CATALOG_GYMS_KEY, queryFn: async () => normalizeApiGyms(JSON.parse(JSON.stringify(store))) })
  const [selectedId, setSelectedId] = useState<string>(fixture.chillout_gym.id)
  const [createFor, setCreateFor] = useState<string | null>(null)
  const [editFor, setEditFor] = useState<{ accountId: string; gymId: string } | null>(null)
  const [crew, setCrew] = useState<CrewMode>(harness.crew)
  const [write, setWrite] = useState<WriteMode>(harness.write)
  const gyms = gymsQ.data ?? []
  const gym = gyms.find((g) => g.id === selectedId) ?? gyms[0]

  return (
    <main className="synthetic-gym-host">
      <div className="synthetic-controls">
        <label>
          Synthetic crew role for non-creators{' '}
          <select value={crew} onChange={(e) => {
            harness.crew = e.target.value as CrewMode
            setCrew(harness.crew)
            void qc.invalidateQueries({ queryKey: ['place-crew'] })
          }}>
            {(['none', 'member', 'moderator', 'owner', 'error', 'malformed'] as const).map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>
          Synthetic write result{' '}
          <select value={write} onChange={(e) => { harness.write = e.target.value as WriteMode; setWrite(harness.write) }}>
            {WRITE_MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => (accountId ? setCreateFor(accountId) : undefined)} aria-disabled={!accountId}>
          Add gym
        </button>
      </div>
      <nav aria-label="Synthetic gyms" className="synthetic-gyms">
        {gyms.map((g) => (
          <button key={g.id} type="button" className={`chip ${g.id === gym?.id ? 'active' : ''}`} onClick={() => setSelectedId(g.id)}>
            {g.name}
          </button>
        ))}
      </nav>
      <div className="crags-map synthetic-map">
        {gym && (
          <GymPanel gym={gym} onEdit={accountId ? () => setEditFor({ accountId, gymId: gym.id }) : undefined} />
        )}
      </div>
      {createFor && createFor === accountId && (
        <CreateGymSheet
          key={createFor}
          writer={fakeWriter}
          onClose={() => setCreateFor(null)}
          onCreated={(created) => {
            setCreateFor(null)
            setSelectedId(created.id)
          }}
        />
      )}
      {editFor && editFor.accountId === accountId && gym && gym.id === editFor.gymId && (
        <EditHost gym={gym} accountId={editFor.accountId} onDone={() => setEditFor(null)} />
      )}
    </main>
  )
}

const style = document.createElement('style')
style.textContent = `
.synthetic-banner { margin: 0; padding: 8px 12px; background: #FFF3CD; font-size: 13px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.synthetic-gym-host { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.synthetic-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 13px; }
.synthetic-gyms { display: flex; flex-wrap: wrap; gap: 6px; }
.synthetic-map { height: min(82vh, 820px); border-radius: 12px; }
`
document.head.append(style)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SyntheticAuthHost>
        <Host />
      </SyntheticAuthHost>
    </QueryClientProvider>
  </React.StrictMode>,
)
