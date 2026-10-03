import assert from 'node:assert/strict'
import test from 'node:test'
import { seasonalSpotlightState } from './seasonalSpotlightState.ts'
test('failed seasonal request is never represented as an empty campaign', () => {
  assert.equal(seasonalSpotlightState(false, false, true), 'error')
  assert.equal(seasonalSpotlightState(false, false, false), 'empty')
  assert.equal(seasonalSpotlightState(false, true, false), 'loading')
  assert.equal(seasonalSpotlightState(true, false, false), 'ready')
})
