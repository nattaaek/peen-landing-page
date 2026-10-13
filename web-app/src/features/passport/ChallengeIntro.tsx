import { useEffect, useRef, useState, type Dispatch } from 'react'
import { challengeIntroSession, INTRO_FADE_MS, INTRO_STALL_MS, type IntroEvent, type IntroPhase } from '../../lib/challengeIntro'
import { REDUCED_MOTION_QUERY } from './introEnvironment'

const FILM = `${import.meta.env.BASE_URL}passport/intro.mp4`
const POSTER = `${import.meta.env.BASE_URL}passport/intro-poster.jpg`

const statusText: Record<IntroPhase, string> = {
  loading: 'Loading the passport intro film.',
  playing: 'Passport intro film playing. Skip intro is available.',
  holding: 'Intro finished. Open challenge to continue.',
  fading: 'Opening challenge.',
  done: '',
}

/**
 * The approved CT Classics film over the already-loading challenge. Grade seals and progress dots in the
 * film are artwork, never the climber's progress.
 */
export function ChallengeIntro({ phase, dispatch }: Readonly<{ phase: IntroPhase; dispatch: Dispatch<IntroEvent> }>) {
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const skip = useRef<HTMLButtonElement>(null)
  const open = useRef<HTMLButtonElement>(null)
  const [muted, setMuted] = useState(challengeIntroSession.muted)

  useEffect(() => {
    const node = video.current
    if (!node) return
    let watchdog = 0
    const arm = () => {
      window.clearTimeout(watchdog)
      watchdog = window.setTimeout(() => dispatch('fail'), INTRO_STALL_MS)
    }
    const play = () => {
      if (document.hidden || node.ended) return
      arm()
      node.play().catch((error: unknown) => {
        const name = error instanceof DOMException ? error.name : ''
        if (name === 'AbortError') return
        if (name === 'NotAllowedError' && !node.muted) {
          node.muted = true
          setMuted(true)
          play()
          return
        }
        dispatch('fail')
      })
    }
    const started = () => { arm(); dispatch('started') }
    const progressed = () => { if (!node.paused && !node.ended) arm() }
    const ended = () => { window.clearTimeout(watchdog); dispatch('ended') }
    const failed = () => { window.clearTimeout(watchdog); dispatch('fail') }
    const visibility = () => {
      if (!document.hidden) { play(); return }
      window.clearTimeout(watchdog)
      node.pause()
    }
    const motion = window.matchMedia(REDUCED_MOTION_QUERY)
    const motionChanged = () => { if (motion.matches) dispatch('skip') }
    node.muted = challengeIntroSession.muted
    node.addEventListener('playing', started)
    node.addEventListener('timeupdate', progressed)
    node.addEventListener('ended', ended)
    node.addEventListener('error', failed)
    document.addEventListener('visibilitychange', visibility)
    motion.addEventListener('change', motionChanged)
    node.src = FILM
    play()
    return () => {
      window.clearTimeout(watchdog)
      node.removeEventListener('playing', started)
      node.removeEventListener('timeupdate', progressed)
      node.removeEventListener('ended', ended)
      node.removeEventListener('error', failed)
      document.removeEventListener('visibilitychange', visibility)
      motion.removeEventListener('change', motionChanged)
      node.pause()
      node.removeAttribute('src')
      node.load()
    }
  }, [dispatch])

  useEffect(() => {
    if (phase !== 'fading') return
    const delay = window.matchMedia(REDUCED_MOTION_QUERY).matches ? 0 : INTRO_FADE_MS
    const timer = window.setTimeout(() => dispatch('faded'), delay)
    return () => window.clearTimeout(timer)
  }, [phase, dispatch])

  const focusTarget = phase === 'holding' ? 'open' : phase === 'fading' ? 'root' : 'skip'
  useEffect(() => {
    const target = focusTarget === 'open' ? open.current : focusTarget === 'root' ? root.current : skip.current
    target?.focus()
  }, [focusTarget])

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') return
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') { dispatch('skip'); return }
      const controls = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      if (!controls.length) return
      const index = controls.indexOf(document.activeElement as HTMLButtonElement)
      const next = index < 0 ? (event.shiftKey ? controls.length - 1 : 0)
        : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
      controls[next].focus()
    }
    window.addEventListener('keydown', keyboard, true)
    return () => window.removeEventListener('keydown', keyboard, true)
  }, [dispatch])

  const toggleSound = () => {
    const next = !muted
    if (video.current) video.current.muted = next
    challengeIntroSession.muted = next
    setMuted(next)
  }

  return <div ref={root} className="challenge-intro" data-phase={phase} role="dialog" aria-modal="true"
    aria-label="Poda | Best routes ever passport intro" tabIndex={-1}>
    <div className="challenge-intro-stage">
      <video ref={video} className="challenge-intro-film" poster={POSTER} muted autoPlay playsInline preload="auto"
        disablePictureInPicture aria-hidden="true" />
      {phase !== 'fading' && <div className="challenge-intro-bar">
        <button type="button" className="challenge-intro-control" onClick={toggleSound}
          aria-label={muted ? 'Unmute intro sound' : 'Mute intro sound'}>
          <SoundIcon muted={muted} />
        </button>
        <button ref={skip} type="button" className="challenge-intro-control" onClick={() => dispatch('skip')}>Skip intro</button>
      </div>}
      {phase === 'holding' && <button ref={open} type="button" className="challenge-intro-open" onClick={() => dispatch('open')}>
        Open challenge <span aria-hidden="true">→</span>
      </button>}
      <p className="challenge-intro-status" role="status">{statusText[phase]}</p>
    </div>
  </div>
}

function SoundIcon({ muted }: Readonly<{ muted: boolean }>) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
  </svg>
}
