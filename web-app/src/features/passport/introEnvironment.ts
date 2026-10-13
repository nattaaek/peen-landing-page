import type { IntroEnvironment } from '../../lib/challengeIntro'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function introEnvironment(): IntroEnvironment {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return {
    reducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches,
    saveData: connection?.saveData === true,
  }
}
