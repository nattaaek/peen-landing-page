import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveNotificationNavigation } from './notificationNavigation.ts'
import { buildClimbShareCaption } from './climbShare.ts'

test('maps supported entity types to web destinations', () => {
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'route', entityId: 'route-1' }), {
    destination: 'route',
    id: 'route-1',
  })
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'climb', entityId: 'climb-1' }), {
    destination: 'climb',
    id: 'climb-1',
  })
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'crew_invite', entityId: 'invite-1' }), {
    destination: 'crew',
  })
})

test('maps user notifications to the sender public profile', () => {
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'user', entityId: 'user-1' }), {
    destination: 'public-profile',
    id: 'user-1',
  })
})

test('maps belay notifications to profile guidance, including legacy kinds', () => {
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'belay_verification', entityId: 'request-1' }), {
    destination: 'profile-guidance',
    message: 'Respond to belay verification in the Peen iOS or Android app.',
  })
  assert.deepEqual(resolveNotificationNavigation({ notificationType: 'belay_verify_result', entityId: 'request-1' }), {
    destination: 'profile-guidance',
    message: 'Respond to belay verification in the Peen iOS or Android app.',
  })
})

test('keeps climb requests on explicit native app guidance because entity id is a request id', () => {
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'climb_request', entityId: 'request-1' }), {
    destination: 'native-guidance',
    message: 'Open this climb request in the Peen iOS or Android app.',
  })
})

test('returns visible fallback guidance for unknown or missing targets', () => {
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'mystery', entityId: 'x' }), {
    destination: 'fallback',
    message: 'This notification cannot be opened on the web. Open it in the Peen iOS or Android app.',
  })
  assert.deepEqual(resolveNotificationNavigation({ entityType: 'climb' }), {
    destination: 'fallback',
    message: 'This notification cannot be opened on the web. Open it in the Peen iOS or Android app.',
  })
})

test('preserves the rich-share caption boundary for an owned send', () => {
  const caption = buildClimbShareCaption({
    routeName: 'Lunar Crack',
    locationName: 'Railay, Thailand',
    url: 'https://getpeen.com/app/feed?climb=climb-1',
  })
  assert.match(caption, /@getpeen/)
  assert.match(caption, /#PeenSend/)
  assert.match(caption, /\/app\/feed\?climb=climb-1/)
})

test('rich share uses system share and preserves clipboard fallback and cancellation', async (t) => {
  const { shareClimb, climbLocationName, cityHashtag } = await import('./climbShare.ts')
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin: 'https://peen.app' } } })
  t.after(() => {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  })
  const copied: string[] = []
  const notices: string[] = []
  const opts = { climbId: 'climb-1', onToast: (message: string) => notices.push(message) }
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const setNavigator = (value: object) => Object.defineProperty(globalThis, 'navigator', { configurable: true, value })
  t.after(() => {
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator)
    else Reflect.deleteProperty(globalThis, 'navigator')
  })
  let shared: unknown
  setNavigator({ share: async (value: unknown) => { shared = value } })
  await shareClimb(opts)
  assert.deepEqual(shared, {
    url: 'https://peen.app/app/feed?climb=climb-1',
    text: '@getpeen · Send · logged on Peen\nhttps://peen.app/app/feed?climb=climb-1\n#PeenSend #climbing',
  })
  assert.equal(notices.length, 0)
  setNavigator({ share: async () => { throw { name: 'AbortError' } }, clipboard: { writeText: async (text: string) => copied.push(text) } })
  await shareClimb(opts)
  assert.equal(copied.length, 0)
  assert.equal(notices.length, 0)
  setNavigator({ share: async () => { throw new Error('Unavailable') }, clipboard: { writeText: async (text: string) => copied.push(text) } })
  await shareClimb(opts)
  assert.equal(copied.length, 1)
  assert.match(copied[0], /@getpeen.*Send/)
  assert.deepEqual(notices, ['Caption + link copied'])
  setNavigator({})
  await shareClimb(opts)
  assert.equal(notices.at(-1), 'Could not share send')
  setNavigator({ clipboard: { writeText: async () => { throw new Error('Denied') } } })
  await shareClimb(opts)
  assert.equal(notices.at(-1), 'Could not share send')
  assert.equal(climbLocationName(), null)
  assert.equal(climbLocationName({ gym: { name: 'Gym' } }), 'Gym')
  assert.equal(climbLocationName({ area: { name: 'Area' }, gym: { name: 'Gym' } }), 'Area')
  assert.equal(cityHashtag(null), null)
  assert.equal(cityHashtag('   '), null)
  assert.equal(cityHashtag('!!!'), null)
  Reflect.deleteProperty(globalThis, 'navigator')
  await shareClimb(opts)
  assert.equal(notices.at(-1), 'Could not share send')
})
