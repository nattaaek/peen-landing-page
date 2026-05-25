import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../../components/Icon'
import { useAuth } from './AuthProvider'

export function LoginGate({
  open,
  message,
  onClose,
}: {
  open: boolean
  message?: string | null
  onClose: () => void
}) {
  const { signInWithGoogle, signInWithApple } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const runOAuth = async (signIn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await signIn()
    } catch (e) {
      setBusy(false)
      setError(e instanceof Error ? e.message : 'Could not start sign-in.')
    }
  }

  if (!open) return null

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal" role="dialog" aria-label="Sign in">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" size={20} />
        </button>
        <h2 style={{ margin: '8px 0 12px', fontSize: 22 }}>Sign in to peen</h2>
        <p style={{ color: 'var(--fg-2)', marginBottom: 20, lineHeight: 1.5 }}>
          {message ?? 'Use the same account as iOS and Android — your sends, crew, and projects stay in sync.'}
        </p>
        {error ? (
          <p style={{ color: 'var(--danger, #b3261e)', marginBottom: 12, lineHeight: 1.4 }} role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 10, justifyContent: 'center', gap: 10 }}
          disabled={busy}
          onClick={() => runOAuth(signInWithGoogle)}
        >
          <Icon name="google" size={18} /> Continue with Google
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={busy}
          onClick={() => runOAuth(signInWithApple)}
        >
          Continue with Apple
        </button>
      </div>
    </>
  )
}

export function LoginRequired({
  icon = 'profile',
  title,
  hint,
  body,
  onSignIn,
  secondary,
}: {
  icon?: IconName
  title: string
  hint?: string
  body?: string
  onSignIn: () => void
  secondary?: ReactNode
}) {
  const text = body ?? hint ?? ''
  return (
    <div className="login-required">
      <svg className="login-required-topo" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g fill="none" stroke="#1F1F20" strokeWidth="0.8">
          <path d="M-10 160 C 60 130, 120 150, 180 120 S 320 100, 410 120" />
          <path d="M-10 130 C 60 100, 120 120, 180 90  S 320 70,  410 90" />
          <path d="M-10 100 C 60 70,  120 90,  180 60  S 320 40,  410 60" />
          <path d="M-10 70  C 60 40,  120 60,  180 30  S 320 10,  410 30" />
        </g>
      </svg>
      <div className="login-required-inner">
        <div className="login-required-icon">
          <Icon name={icon} size={30} />
        </div>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="login-required-actions">
          <button type="button" className="btn btn-primary" onClick={onSignIn}>
            <Icon name="google" size={18} /> Continue with Google
          </button>
          {secondary}
        </div>
        <p className="login-required-foot">You can keep browsing crags without an account.</p>
      </div>
    </div>
  )
}

export function BrowseCragsLink() {
  return (
    <Link to="/crags" className="btn btn-secondary" style={{ height: 46 }}>
      Browse crags instead
    </Link>
  )
}
