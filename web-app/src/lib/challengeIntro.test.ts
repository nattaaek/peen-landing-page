import assert from 'node:assert/strict'
import test from 'node:test'
import { CT_CLASSICS_CHALLENGE_ID } from './invitationLink.ts'
import { createIntroSession, introReducer, passportEdition, shouldAutoplayIntro, type IntroEvent, type IntroPhase } from './challengeIntro.ts'

const CT = CT_CLASSICS_CHALLENGE_ID
const OTHER = '12345678-1234-4000-8000-123456789abc'
const calm = { reducedMotion: false, saveData: false }

test('only the known CT season is branded; other campaigns keep their own titles', () => {
  assert.deepEqual({ ...passportEdition(CT) }, {
    publisher: 'Poda', program: 'Best routes ever', name: 'Poda | Best routes ever', edition: 'Central Thailand edition',
  })
  assert.equal(passportEdition(OTHER), null)
  assert.equal(passportEdition(undefined), null)
  assert.equal(passportEdition('ct-classics-2026'), null)
})

test('the film autoplays only for CT as the loaded current season with motion and data allowed', () => {
  const none = new Set<string>()
  assert.equal(shouldAutoplayIntro(CT, CT, calm, none), true)
  assert.equal(shouldAutoplayIntro(CT, undefined, calm, none), false)
  assert.equal(shouldAutoplayIntro(CT, OTHER, calm, none), false)
  assert.equal(shouldAutoplayIntro(OTHER, OTHER, calm, none), false)
  assert.equal(shouldAutoplayIntro(CT, CT, { reducedMotion: true, saveData: false }, none), false)
  assert.equal(shouldAutoplayIntro(CT, CT, { reducedMotion: false, saveData: true }, none), false)
  assert.equal(shouldAutoplayIntro(CT, CT, calm, new Set([CT])), false)
})

test('a session grants the film once per launch and a new session starts muted and unplayed', () => {
  const session = createIntroSession()
  assert.equal(session.muted, true)
  assert.equal(session.claim(CT, undefined, calm), false)
  assert.equal(session.claim(CT, CT, { reducedMotion: true, saveData: false }), false)
  assert.equal(session.claim(CT, CT, calm), true)
  assert.equal(session.claim(CT, CT, calm), false)
  session.muted = false
  const relaunch = createIntroSession()
  assert.equal(relaunch.muted, true)
  assert.equal(relaunch.claim(CT, CT, calm), true)
})

test('the phase machine holds on the open book and never gates the challenge indefinitely', () => {
  const run = (events: IntroEvent[], from: IntroPhase = 'loading') => events.reduce(introReducer, from)
  assert.equal(run(['started', 'ended']), 'holding')
  assert.equal(run(['started', 'ended', 'fail', 'started']), 'holding')
  assert.equal(run(['started', 'ended', 'open']), 'fading')
  assert.equal(run(['started', 'ended', 'open', 'skip', 'open']), 'fading')
  assert.equal(run(['started', 'ended', 'open', 'faded']), 'done')
  assert.equal(run(['fail']), 'done')
  assert.equal(run(['started', 'fail']), 'done')
  assert.equal(run(['skip']), 'done')
  assert.equal(run(['started', 'ended', 'skip']), 'done')
  assert.equal(run(['open', 'faded']), 'loading')
  assert.equal(run(['started', 'ended'], 'done'), 'done')
  assert.equal(run(['replay', 'started'], 'done'), 'playing')
})

test('a changed account or challenge ends the film for good; only a deliberate replay restarts it', () => {
  const run = (events: IntroEvent[], from: IntroPhase = 'loading') => events.reduce(introReducer, from)
  assert.equal(run(['abandon']), 'done')
  assert.equal(run(['started', 'abandon']), 'done')
  assert.equal(run(['started', 'ended', 'abandon']), 'done')
  assert.equal(run(['started', 'ended', 'open', 'abandon']), 'done')
  assert.equal(run(['started', 'abandon', 'started', 'ended', 'open', 'abandon']), 'done')
  assert.equal(run(['started', 'abandon', 'replay']), 'loading')
  assert.equal(run(['abandon'], 'done'), 'done')
})
