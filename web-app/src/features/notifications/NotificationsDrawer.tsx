import { Icon } from '../../components/Icon'
import { useInbox, useMarkNotificationRead } from '../../hooks/useMigration'
import type { InboxNotification } from '../../types/api'

export function NotificationsDrawer({
  open,
  onClose,
  onSignIn,
  isGuest,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  onSignIn: () => void
  isGuest: boolean
  onNavigate?: (entityType?: string, entityId?: string) => void
}) {
  const inboxQ = useInbox()
  const markRead = useMarkNotificationRead()

  if (!open) return null

  const openItem = async (n: InboxNotification) => {
    if (!n.read && n.read_at == null) {
      try {
        await markRead.mutateAsync(n.id)
      } catch {
        /* ignore */
      }
    }
    onNavigate?.(n.entity_type, n.entity_id)
  }

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
                {(inboxQ.data ?? []).map((n) => {
                  const unread = !n.read && n.read_at == null
                  return (
                    <li key={n.id} className={unread ? 'unread' : ''}>
                      <button
                        type="button"
                        className="notif-row-btn"
                        onClick={() => openItem(n)}
                      >
                        <strong>{n.title ?? n.type ?? n.kind ?? 'Notification'}</strong>
                        <p className="muted">{n.body}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {!inboxQ.isLoading && (inboxQ.data ?? []).length === 0 && (
                <p className="muted">All caught up.</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
