import { useEffect, useId, useRef, useState } from 'react'
import { invitationErrorMessage } from '../../lib/seasonalInvitation'

/** Presentation only. The existing join mutation remains the authority. */
export function InvitationForm({ required, isGuest, onSignIn, onSubmit }: Readonly<{
  required: boolean
  isGuest: boolean
  onSignIn?: () => void
  onSubmit: (code: string) => Promise<unknown>
}>) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const [visible, setVisible] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const [joined, setJoined] = useState(false)
  const [retryAt, setRetryAt] = useState(0)
  useEffect(() => { if (error && !pending && !closed) input.current?.focus() }, [error, pending, closed])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending || closed || joined) return
    if (required && !code.trim()) {
      setError('Enter an invitation code for this season.')
      input.current?.focus()
      return
    }
    if (Date.now() < retryAt) {
      setError('Too many attempts. Try again in 15 minutes.')
      return
    }
    setPending(true); setError(null)
    try {
      await onSubmit(code.trim())
      setCode(''); setJoined(true)
    } catch (failure) {
      setError(invitationErrorMessage(failure))
      const message = failure instanceof Error ? failure.message : ''
      setClosed(message.includes('challenge_closed'))
      if (message.includes('invitation_rate_limited')) setRetryAt(Date.now() + 15 * 60 * 1000)
      input.current?.focus()
    } finally { setPending(false) }
  }
  return <section className="invitation-panel" aria-labelledby={`${id}-title`}>
    <div className="invitation-heading"><span className="wordmark">Season access</span>
      <h3 id={`${id}-title`}>{joined ? 'You’re in' : required ? 'Your invitation to climb' : 'Join this season'}</h3>
      <p className="footnote">{joined ? 'Your challenge progress is refreshing.' : required ? 'Enter the code shared by the organizer. Access is confirmed by the challenge service.' : 'Join to start tracking your routes for this season.'}</p>
    </div>
    {joined ? <p role="status" className="invitation-success">Challenge joined. Your code has been cleared.</p> : isGuest ?
      <button className="btn btn-primary" type="button" onClick={onSignIn}>Sign in to join</button> :
      <form onSubmit={submit} noValidate aria-busy={pending}>
        {required && <div className="field">
          <label htmlFor={`${id}-code`}>Invitation code</label>
          <div className="invitation-input-row">
            <input ref={input} id={`${id}-code`} type={visible ? 'text' : 'password'} value={code}
              autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={128}
              disabled={pending || closed} aria-invalid={Boolean(error)}
              aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
              onChange={event => { setCode(event.target.value); setError(null) }} />
            <button className="btn btn-secondary" type="button" disabled={pending || closed}
              aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button>
          </div>
          <p className="caption" id={`${id}-help`}>Codes are private. Leading and trailing spaces are removed.</p>
        </div>}
        {error && <p id={`${id}-error`} className="invitation-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={pending || closed}>
          {pending ? 'Checking access…' : closed ? 'Registration closed' : error ? 'Try again' : required ? 'Unlock challenge' : 'Join challenge'}
        </button>
        <p className="caption">Progress starts only after your access is confirmed.</p>
      </form>}
  </section>
}
