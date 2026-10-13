import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GymWriteAcknowledgedError,
  GymWriteBusyError,
  GymWriteController,
  GymWriteStaleError,
  GymWriteUnreadableError,
  parsePlaceCrewSummary,
  resolveGymEditCapability,
  submitGymCreate,
  submitGymVisitUpdate,
  type GymWriteScope,
  type GymWriter,
} from './gymWriteController.ts'
import { emptyPriceDraft, emptyVisitInfoDraft, planGymCreate, type GymCreatePlan } from './gymVisitInfo.ts'
import type { ApiGym } from '../types/api'

class HttpStatusError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

const GYM_ID = '5e5e5e5e-0000-4000-8000-000000000009'
const savedGym = { id: GYM_ID, name: 'Synthetic Gym', latitude: 13.7, longitude: 100.5, address: null, created_by: 'alice', visit_info: null }
const catalogGym: ApiGym = { id: GYM_ID, name: 'Synthetic Gym', latitude: 13.7, longitude: 100.5, created_by: 'alice', visit_info: null }

function recordingWriter(respond: (op: string) => Promise<unknown>) {
  const calls: { op: string; params: unknown; token: string }[] = []
  const writer: GymWriter = {
    createGym: (params, token) => { calls.push({ op: 'createGym', params, token }); return respond('createGym') },
    createGymWithVisitInfo: (params, token) => { calls.push({ op: 'createGymWithVisitInfo', params, token }); return respond('createGymWithVisitInfo') },
    updateGymVisitInfo: (params, token) => { calls.push({ op: 'updateGymVisitInfo', params, token }); return respond('updateGymVisitInfo') },
  }
  return { writer, calls }
}

function plan(withInfo: boolean): GymCreatePlan {
  const visit = emptyVisitInfoDraft()
  if (withInfo) visit.admission = [{ ...emptyPriceDraft(), label: 'Day pass', amount: '380' }]
  const r = planGymCreate({ name: 'Synthetic Gym', latitude: '13.7', longitude: '100.5', address: 'Synthetic road' }, visit)
  assert.ok(r.ok)
  return r.plan
}

test('create with visit info calls only createGymWithVisitInfo and never falls back', async () => {
  const { writer, calls } = recordingWriter(async () => { throw new Error('op not implemented: createGymWithVisitInfo') })
  await assert.rejects(submitGymCreate(writer, plan(true), 'token-a'), { message: 'op not implemented: createGymWithVisitInfo' })
  assert.deepEqual(calls.map((c) => c.op), ['createGymWithVisitInfo'])
  assert.equal((calls[0].params as { address: string }).address, 'Synthetic road')
})

test('create without visit info calls only createGym, with address', async () => {
  const { writer, calls } = recordingWriter(async () => savedGym)
  const gym = await submitGymCreate(writer, plan(false), 'token-a')
  assert.equal(gym.id, GYM_ID)
  assert.deepEqual(calls, [{
    op: 'createGym',
    params: { name: 'Synthetic Gym', latitude: 13.7, longitude: 100.5, address: 'Synthetic road' },
    token: 'token-a',
  }])
})

test('update sends id plus visit_info, and null to clear', async () => {
  const { writer, calls } = recordingWriter(async () => savedGym)
  await submitGymVisitUpdate(writer, { id: GYM_ID, visit_info: null }, 'token-a')
  assert.deepEqual(calls, [{ op: 'updateGymVisitInfo', params: { id: GYM_ID, visit_info: null }, token: 'token-a' }])
})

test('an unreadable success body is an acknowledged write, not a phantom gym', async () => {
  const cases: [unknown, string | null][] = [
    [{ ok: true }, null],
    ['<html>gateway</html>', null],
    [null, null],
    [{ id: GYM_ID, name: 42 }, GYM_ID],
    [{ id: '  ', name: 'Synthetic Gym' }, null],
  ]
  for (const [body, serverId] of cases) {
    const { writer } = recordingWriter(async () => body)
    await assert.rejects(submitGymCreate(writer, plan(false), 'token-a'), (e: unknown) => {
      assert.ok(e instanceof GymWriteUnreadableError, JSON.stringify(body))
      assert.equal(e.serverId, serverId, JSON.stringify(body))
      return true
    })
  }
  const { writer } = recordingWriter(async () => ({ ok: true }))
  await assert.rejects(submitGymVisitUpdate(writer, { id: GYM_ID, visit_info: null }, 'token-a'), { serverId: GYM_ID })
})

test('HTTP errors stay ordinary failures, never acknowledged', async () => {
  const { writer } = recordingWriter(async () => { throw new HttpStatusError(400, 'name is required') })
  await assert.rejects(submitGymCreate(writer, plan(false), 'token-a'), (e: unknown) => {
    assert.ok(e instanceof HttpStatusError && !(e instanceof GymWriteUnreadableError))
    return true
  })
})

function controllerFixture() {
  let scope: GymWriteScope | null = { accountId: 'alice', accessToken: 'token-a' }
  const controller = new GymWriteController(() => scope)
  return { controller, setScope: (next: GymWriteScope | null) => { scope = next } }
}

test('acknowledged unreadable create sends one request despite repeated presses and draft changes', async () => {
  const { controller } = controllerFixture()
  const { writer, calls } = recordingWriter(async () => ({ id: GYM_ID }))
  await assert.rejects(controller.run((s) => submitGymCreate(writer, plan(true), s.accessToken)), GymWriteUnreadableError)
  assert.deepEqual(controller.acknowledged, { serverId: GYM_ID })
  assert.equal(controller.busy, false)
  for (const draft of [plan(true), plan(true), plan(false)]) {
    await assert.rejects(controller.run((s) => submitGymCreate(writer, draft, s.accessToken)), GymWriteAcknowledgedError)
  }
  assert.deepEqual(calls.map((c) => c.op), ['createGymWithVisitInfo'])
})

test('read recovery never writes; a found row unlocks, not found keeps the lock', async () => {
  const { controller } = controllerFixture()
  const { writer, calls } = recordingWriter(async () => ({ id: GYM_ID }))
  await assert.rejects(controller.run((s) => submitGymCreate(writer, plan(false), s.accessToken)), GymWriteUnreadableError)

  const seen: (string | null)[] = []
  assert.equal(await controller.reconcile(async (ack) => { seen.push(ack.serverId); return null }), null)
  assert.deepEqual(controller.acknowledged, { serverId: GYM_ID })
  await assert.rejects(controller.reconcile(async () => { throw new TypeError('offline') }), TypeError)
  assert.deepEqual(controller.acknowledged, { serverId: GYM_ID })
  await assert.rejects(controller.run((s) => submitGymCreate(writer, plan(false), s.accessToken)), GymWriteAcknowledgedError)

  const found = await controller.reconcile(async (ack) => { seen.push(ack.serverId); return catalogGym })
  assert.equal(found?.id, GYM_ID)
  assert.deepEqual(seen, [GYM_ID, GYM_ID])
  assert.equal(controller.acknowledged, null)
  assert.deepEqual(calls.map((c) => c.op), ['createGym'])
})

test('an acknowledged write without a server id stays locked after a refresh', async () => {
  const { controller } = controllerFixture()
  const { writer, calls } = recordingWriter(async () => 'not json')
  await assert.rejects(controller.run((s) => submitGymCreate(writer, plan(false), s.accessToken)), GymWriteUnreadableError)
  assert.equal(await controller.reconcile(async (ack) => (ack.serverId ? catalogGym : null)), null)
  assert.deepEqual(controller.acknowledged, { serverId: null })
  await assert.rejects(controller.run((s) => submitGymCreate(writer, plan(false), s.accessToken)), GymWriteAcknowledgedError)
  assert.equal(calls.length, 1)
})

test('ordinary 4xx failures stay retryable and leave no acknowledged lock', async () => {
  const { controller } = controllerFixture()
  let reject = true
  const { writer, calls } = recordingWriter(async () => {
    if (reject) throw new HttpStatusError(400, 'admission[0].currency must be 3 uppercase ISO 4217 letters')
    return savedGym
  })
  const draft = plan(true)
  await assert.rejects(controller.run((s) => submitGymCreate(writer, draft, s.accessToken)), HttpStatusError)
  assert.equal(controller.acknowledged, null)
  reject = false
  assert.equal((await controller.run((s) => submitGymCreate(writer, draft, s.accessToken))).id, GYM_ID)
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0].params, calls[1].params, 'the retry sends the retained input')
})

test('stale acknowledged completions after cancel or account switch set no lock', async () => {
  const { controller, setScope } = controllerFixture()
  const afterCancel = deferred<unknown>()
  const { writer } = recordingWriter(() => afterCancel.promise)
  const late = controller.run((s) => submitGymCreate(writer, plan(false), s.accessToken))
  controller.cancel()
  afterCancel.resolve({ ok: true })
  await assert.rejects(late, GymWriteStaleError)
  assert.equal(controller.acknowledged, null)

  const afterSwitch = deferred<unknown>()
  const { writer: switching } = recordingWriter(() => afterSwitch.promise)
  const switched = controller.run((s) => submitGymCreate(switching, plan(false), s.accessToken))
  setScope({ accountId: 'bob', accessToken: 'token-b' })
  afterSwitch.resolve({ ok: true })
  await assert.rejects(switched, GymWriteStaleError)
  assert.equal(controller.acknowledged, null)
  setScope({ accountId: 'alice', accessToken: 'token-a' })
  assert.equal(controller.acknowledged, null)
})

test('the lock belongs to the account that wrote, and stale reads cannot clear it', async () => {
  const { controller, setScope } = controllerFixture()
  const { writer } = recordingWriter(async () => ({ id: GYM_ID }))
  await assert.rejects(controller.run((s) => submitGymCreate(writer, plan(false), s.accessToken)), GymWriteUnreadableError)
  setScope({ accountId: 'bob', accessToken: 'token-b' })
  assert.equal(controller.acknowledged, null)
  setScope({ accountId: 'alice', accessToken: 'token-a' })

  const read = deferred<ApiGym | null>()
  const pending = controller.reconcile(() => read.promise)
  controller.cancel()
  read.resolve(catalogGym)
  await assert.rejects(pending, GymWriteStaleError)
  assert.deepEqual(controller.acknowledged, { serverId: GYM_ID })
})

test('single flight: a second tap while saving is rejected without a second request', async () => {
  const { controller } = controllerFixture()
  const gate = deferred<string>()
  let requests = 0
  const first = controller.run(async () => { requests++; return gate.promise })
  assert.equal(controller.busy, true)
  await assert.rejects(controller.run(async () => { requests++; return 'second' }), GymWriteBusyError)
  gate.resolve('first')
  assert.equal(await first, 'first')
  assert.equal(requests, 1)
  assert.equal(controller.busy, false)
})

test('a failed save surfaces the server error and allows an explicit retry', async () => {
  const { controller } = controllerFixture()
  await assert.rejects(controller.run(async () => { throw new Error('admission[0].currency must be 3 uppercase ISO 4217 letters') }), /currency/)
  assert.equal(controller.busy, false)
  assert.equal(await controller.run(async () => 'retried'), 'retried')
})

test('account switch mid-flight makes the result stale and skips the catalog refresh', async () => {
  const { controller, setScope } = controllerFixture()
  const gate = deferred<void>()
  let refreshed = false
  let usedToken = ''
  const pending = controller.run(async (scope, isCurrent) => {
    usedToken = scope.accessToken
    await gate.promise
    if (isCurrent()) refreshed = true
    return 'saved'
  })
  setScope({ accountId: 'bob', accessToken: 'token-b' })
  gate.resolve()
  await assert.rejects(pending, GymWriteStaleError)
  assert.equal(refreshed, false)
  assert.equal(usedToken, 'token-a')
})

test('cancel (close or unmount) makes a late success and a late failure stale', async () => {
  const { controller } = controllerFixture()
  const ok = deferred<string>()
  const late = controller.run(() => ok.promise)
  controller.cancel()
  assert.equal(controller.busy, false)
  ok.resolve('late')
  await assert.rejects(late, GymWriteStaleError)

  const bad = deferred<string>()
  const lateError = controller.run(() => bad.promise)
  controller.cancel()
  bad.reject(new Error('server said no'))
  await assert.rejects(lateError, GymWriteStaleError)
})

test('a cancelled in-flight write does not block a new save, and cannot clear its busy flag', async () => {
  const { controller } = controllerFixture()
  const old = deferred<string>()
  const stale = controller.run(() => old.promise)
  controller.cancel()
  const fresh = deferred<string>()
  const next = controller.run(() => fresh.promise)
  old.resolve('old')
  await assert.rejects(stale, GymWriteStaleError)
  assert.equal(controller.busy, true, 'the stale completion must not release the new write')
  fresh.resolve('new')
  assert.equal(await next, 'new')
})

test('guests cannot start a write', async () => {
  const { controller, setScope } = controllerFixture()
  setScope(null)
  let called = false
  await assert.rejects(controller.run(async () => { called = true }), /Sign in/)
  assert.equal(called, false)
})

test('crew summary parsing fails closed on another place or a malformed body', () => {
  const ok = { crew_id: 'c', place_kind: 'gym', place_id: GYM_ID.toUpperCase(), my_role: 'moderator' }
  assert.deepEqual(parsePlaceCrewSummary(ok, GYM_ID), { my_role: 'moderator' })
  assert.deepEqual(parsePlaceCrewSummary({ ...ok, my_role: null }, GYM_ID), { my_role: null })
  assert.equal(parsePlaceCrewSummary({ ...ok, place_id: 'other' }, GYM_ID), null)
  assert.equal(parsePlaceCrewSummary({ ...ok, place_kind: 'area' }, GYM_ID), null)
  assert.equal(parsePlaceCrewSummary({ place_kind: 'gym', place_id: GYM_ID }, GYM_ID), null)
  assert.equal(parsePlaceCrewSummary({ ...ok, my_role: 3 }, GYM_ID), null)
  assert.equal(parsePlaceCrewSummary(null, GYM_ID), null)
})

test('edit capability follows the server rule and fails closed', () => {
  const gym = { created_by: 'alice' }
  const pending = { status: 'pending' } as const
  const role = (my_role: string | null) => ({ status: 'success', summary: { my_role } } as const)
  assert.deepEqual(resolveGymEditCapability(null, gym, role('owner')), { kind: 'guest' })
  assert.deepEqual(resolveGymEditCapability('alice', gym, pending), { kind: 'allowed', via: 'creator' })
  assert.deepEqual(resolveGymEditCapability('bob', gym, pending), { kind: 'checking' })
  assert.deepEqual(resolveGymEditCapability('bob', gym, { status: 'error' }), { kind: 'unavailable' })
  assert.deepEqual(resolveGymEditCapability('bob', gym, { status: 'success', summary: null }), { kind: 'unavailable' })
  assert.deepEqual(resolveGymEditCapability('bob', gym, role('owner')), { kind: 'allowed', via: 'crew' })
  assert.deepEqual(resolveGymEditCapability('bob', gym, role('moderator')), { kind: 'allowed', via: 'crew' })
  for (const other of ['member', 'contributor', 'restricted', 'admin', null]) {
    assert.deepEqual(resolveGymEditCapability('bob', gym, role(other)), { kind: 'denied' }, String(other))
  }
  assert.deepEqual(resolveGymEditCapability('bob', { created_by: null }, role(null)), { kind: 'denied' })
})
