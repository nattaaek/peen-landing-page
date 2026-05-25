import { Icon } from '../../components/Icon'
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
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 10, justifyContent: 'center', gap: 10 }}
          onClick={() => signInWithGoogle()}
        >
          <Icon name="google" size={18} /> Continue with Google
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => signInWithApple()}
        >
          Continue with Apple
        </button>
      </div>
    </>
  )
}

export function LoginRequired({
  title,
  hint,
  onSignIn,
}: {
  title: string
  hint: string
  onSignIn: () => void
}) {
  return (
    <div className="empty-state">
      <div className="empty-blur" aria-hidden />
      <h2>{title}</h2>
      <p>{hint}</p>
      <button type="button" className="btn btn-primary" onClick={onSignIn}>
        <Icon name="google" size={16} /> Continue with Google
      </button>
    </div>
  )
}
