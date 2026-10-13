import { CT_CLASSICS_CHALLENGE_ID } from './invitationLink.ts'

/** Display branding for the one season whose artwork ships with the web app. Backend titles stay untouched. */
export const CT_CLASSICS_EDITION = Object.freeze({
  publisher: 'Poda',
  program: 'Best routes ever',
  name: 'Poda | Best routes ever',
  edition: 'Central Thailand edition',
})
export type PassportEdition = typeof CT_CLASSICS_EDITION

export function passportEdition(challengeId: string | null | undefined): PassportEdition | null {
  return challengeId === CT_CLASSICS_CHALLENGE_ID ? CT_CLASSICS_EDITION : null
}

export interface IntroEnvironment {
  readonly reducedMotion: boolean
  readonly saveData: boolean
}

export function shouldAutoplayIntro(
  challengeId: string,
  currentSeasonId: string | null | undefined,
  environment: IntroEnvironment,
  played: ReadonlySet<string>,
): boolean {
  return passportEdition(challengeId) !== null && challengeId === currentSeasonId &&
    !environment.reducedMotion && !environment.saveData && !played.has(challengeId)
}

/** In-memory only: a new SPA launch resets the played set and the sound choice. */
export function createIntroSession() {
  const played = new Set<string>()
  return {
    muted: true,
    /** Marks the film played when it is granted, so reopening never replays it. */
    claim(challengeId: string, currentSeasonId: string | null | undefined, environment: IntroEnvironment): boolean {
      if (!shouldAutoplayIntro(challengeId, currentSeasonId, environment, played)) return false
      played.add(challengeId)
      return true
    },
  }
}
export const challengeIntroSession = createIntroSession()

export type IntroPhase = 'loading' | 'playing' | 'holding' | 'fading' | 'done'
/** `abandon`: the account or challenge the film was granted for changed. Only a deliberate `replay` restarts it. */
export type IntroEvent = 'started' | 'ended' | 'open' | 'skip' | 'fail' | 'faded' | 'replay' | 'abandon'

const transitions: Readonly<Record<IntroPhase, Partial<Record<IntroEvent, IntroPhase>>>> = {
  loading: { started: 'playing', ended: 'holding', skip: 'done', fail: 'done', abandon: 'done' },
  playing: { ended: 'holding', skip: 'done', fail: 'done', abandon: 'done' },
  holding: { open: 'fading', skip: 'done', abandon: 'done' },
  fading: { faded: 'done', abandon: 'done' },
  done: { replay: 'loading' },
}

export function introReducer(phase: IntroPhase, event: IntroEvent): IntroPhase {
  return transitions[phase][event] ?? phase
}

export const INTRO_STALL_MS = 8000
export const INTRO_FADE_MS = 650
