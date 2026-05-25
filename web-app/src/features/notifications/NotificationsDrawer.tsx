import { Icon } from '../../components/Icon'
import { useInbox } from '../../hooks/useMigration'

export function NotificationsDrawer({
  open,
  onClose,
  onSignIn,
  isGuest,
}: {
  open: boolean
  onClose: () => void
  onSignIn: () => void
  isGuest: boolean
}) {
  const inboxQ = useInbox()

  if (!open) return null

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover notif-drawer" role="dialog" style={{ maxWidth: 400 }}>
        <div className="slideover-head">
          <strong>Notifications</strong>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="slideover-body" style={{ padding: 16 }}>
          {isGuest ? (
            <p>
              <button type="button" className="btn btn-primary" onClick={onSignIn}>
                Sign in
              </button>{' '}
              to see belay requests, invites, and likes.
            </p>
          ) : (
            <>
              {inboxQ.isLoading && <p className="muted">Loading…</p>}
              <ul className="notif-list">
                {(inboxQ.data ?? []).map((n) => (
                  <li key={n.id} className={n.read ? '' : 'unread'}>
                    <strong>{n.title ?? n.kind}</strong>
                    <p className="muted">{n.body}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
