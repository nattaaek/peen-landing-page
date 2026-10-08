import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { invitationErrorMessage } from '../../lib/seasonalInvitation'

/** Presentation only. The existing join mutation remains the authority. */
export function InvitationForm({ required, isGuest, onSignIn, onSubmit, initialCode = '', accountLabel, isCurrent, isCurrentAction }: Readonly<{
  required: boolean
  isGuest: boolean
  onSignIn?: () => void
  onSubmit: (code: string) => Promise<unknown>
  initialCode?: string
  accountLabel?: string
  isCurrent?: () => boolean
  isCurrentAction?: () => boolean
}>) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [privateCode, setCode] = useState(initialCode)
  const epoch = useRef<{ live: boolean; operation: object | null } | null>(null)
  const [storedVisible, setVisible] = useState(false)
  const [storedPending, setPending] = useState(false)
  const [storedError, setError] = useState<string | null>(null)
  const [storedClosed, setClosed] = useState(false)
  const [storedJoined, setJoined] = useState(false)
  const current = isCurrent?.() ?? true
  const code = current ? privateCode : ''
  const visible = current && storedVisible
  const pending = current && storedPending
  const error = current ? storedError : null
  const closed = current && storedClosed
  const joined = current && storedJoined
  const [retryAt, setRetryAt] = useState(0)
  useLayoutEffect(() => {
    const lifetime = { live: true, operation: null as object | null }
    epoch.current = lifetime
    return () => { lifetime.live = false }
  }, [])
  const actionCurrent = (lifetime: typeof epoch.current) => Boolean(
    lifetime?.live && epoch.current === lifetime &&
    (isCurrent?.() ?? true) && (isCurrentAction?.() ?? true),
  )
  useEffect(() => {
    const lifetime = epoch.current
    if (lifetime?.live && (isCurrent?.() ?? true) && (isCurrentAction?.() ?? true) &&
        error && !pending && !closed) input.current?.focus()
  }, [error, pending, closed, isCurrent, isCurrentAction])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const lifetime = epoch.current
    if (!actionCurrent(lifetime) || !lifetime || lifetime.operation || pending || closed || joined || isGuest) return
    if (required && !privateCode.trim()) {
      setError('Enter an invitation code for this season.')
      input.current?.focus()
      return
    }
    if (Date.now() < retryAt) {
      setError('Too many attempts. Try again in 15 minutes.')
      return
    }
    const operation = {}
    lifetime.operation = operation
    const ownsOperation = () => actionCurrent(lifetime) && lifetime.operation === operation
    setPending(true); setError(null)
    try {
      if (!ownsOperation()) return
      await onSubmit(privateCode.trim())
      if (!ownsOperation()) return
      setCode(''); setJoined(true)
    } catch (failure) {
      if (!ownsOperation()) return
      const message = invitationErrorMessage(failure)
      setError(message)
      setClosed(message === 'Registration is closed for this season.')
      if (message === 'Too many attempts. Try again in 15 minutes.') setRetryAt(Date.now() + 15 * 60 * 1000)
      input.current?.focus()
    } finally {
      if (ownsOperation()) {
        lifetime.operation = null
        setPending(false)
      }
    }
  }
  return <section className="invitation-panel" aria-labelledby={`${id}-title`}>
    <div className="invitation-heading"><span className="wordmark">Season access</span>
      <h3 id={`${id}-title`}>{joined ? 'You’re in' : required ? 'Your invitation to climb' : 'Join this season'}</h3>
      <p className="footnote">{joined ? 'Your challenge progress is refreshing.' : required ? 'Enter the code shared by the organizer. Access is confirmed by the challenge service.' : 'Join to start tracking your routes for this season.'}</p>
    </div>
    {joined ? <p role="status" className="invitation-success">Challenge joined. Your code has been cleared.</p> : isGuest ?
      <button className="btn btn-primary" type="button" disabled={!current} onClick={() => {
        const lifetime = epoch.current
        if (actionCurrent(lifetime)) onSignIn?.()
      }}>Sign in to join</button> :
      <form onSubmit={submit} noValidate aria-busy={pending}>
        {required && <div className="field">
          <label htmlFor={`${id}-code`}>Invitation code</label>
          <div className="invitation-input-row">
            <input ref={input} id={`${id}-code`} type={visible ? 'text' : 'password'} value={code}
              autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={512}
              disabled={!current || pending || closed} aria-invalid={Boolean(error)}
              aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
              onChange={event => {
                const lifetime = epoch.current
                if (!actionCurrent(lifetime)) return
                setCode(event.target.value); setError(null)
              }} />
            <button className="btn btn-secondary" type="button" disabled={!current || pending || closed}
              aria-pressed={visible} onClick={() => {
                const lifetime = epoch.current
                if (actionCurrent(lifetime)) setVisible(!visible)
              }}>{visible ? 'Hide' : 'Show'}</button>
          </div>
          <p className="caption" id={`${id}-help`}>Codes are private. Leading and trailing spaces are removed.</p>
        </div>}
        {error && <p id={`${id}-error`} className="invitation-error" role="alert">{error}</p>}
        {accountLabel && <p className="caption">Joining as {accountLabel}</p>}
        <button className="btn btn-primary" type="submit" disabled={!current || pending || closed}>
          {pending ? 'Checking access…' : closed ? 'Registration closed' : error ? 'Try again' : 'Join challenge'}
        </button>
        <p className="caption">Progress starts only after your access is confirmed.</p>
      </form>}
  </section>
}
