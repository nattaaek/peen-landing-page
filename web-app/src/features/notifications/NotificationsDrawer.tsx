import { Icon } from '../../components/Icon'
import { useInbox, useMarkNotificationRead } from '../../hooks/useMigration'
import { migrationInvoke } from '../../lib/peen-api/migration'
import { useAuth } from '../auth/AuthProvider'
import { useQueryClient } from '@tanstack/react-query'
import type { InboxNotification } from '../../types/api'

function relativeTime(iso?: string): string {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

function SenderAvatar({ name, src, size = 40 }: { name?: string; src?: string; size?: number }) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : '?'
  const hue = name
    ? [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    : 200
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `hsl(${hue},55%,52%)`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function NotifRow({
  n,
  onTap,
}: {
  n: InboxNotification
  onTap: (n: InboxNotification) => void
}) {
  const unread = !n.read && n.read_at == null
  const senderLabel = n.sender_name ?? n.title ?? 'Someone'

  return (
    <button
      type="button"
      className="notif-row-btn"
      onClick={() => onTap(n)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        width: '100%',
        padding: '12px 16px',
        background: unread ? 'var(--surface-raised, #f9f9f9)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <SenderAvatar name={senderLabel} src={n.sender_avatar} size={40} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4 }}>
        <div>
          <b>{senderLabel}</b>
          {n.body ? ` ${n.body}` : ''}
        </div>
        <div style={{ color: 'var(--fg-2, #888)', fontSize: 12, marginTop: 3 }}>
          {relativeTime(n.created_at)}
        </div>
      </div>
      {unread && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--tint, #d55a1f)',
            flexShrink: 0,
            marginTop: 8,
          }}
        />
      )}
    </button>
  )
}

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
  const { accessToken } = useAuth()
  const qc = useQueryClient()

  if (!open) return null

  const items = inboxQ.data ?? []
  const hasUnread = items.some((n) => !n.read && n.read_at == null)

  const openItem = async (n: InboxNotification) => {
    if (!n.read && n.read_at == null) {
      try {
        await markRead.mutateAsync(n.id)
      } catch {
        /* ignore */
      }
    }
    onNavigate?.(n.entity_type, n.entity_id)
    onClose()
  }

  const markAllRead = async () => {
    await migrationInvoke('notifications', 'markAllRead', {}, accessToken!)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} role="presentation" />
      <div className="slideover notif-drawer" role="dialog" style={{ maxWidth: 420 }}>
        {/* Header */}
        <div
          className="slideover-head"
          style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border, #e5e5e5)' }}
        >
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" style={{ marginRight: 8 }}>
            <Icon name="close" size={20} />
          </button>
          <strong style={{ fontSize: 16, flex: 1 }}>Inbox</strong>
          {hasUnread && (
            <button
              type="button"
              onClick={markAllRead}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--tint, #d55a1f)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        <div className="slideover-body" style={{ padding: 0, overflowY: 'auto' }}>
          {isGuest ? (
            <div style={{ padding: 24 }}>
              <button type="button" className="btn btn-primary" onClick={onSignIn}>
                Sign in
              </button>
              <span style={{ marginLeft: 8, fontSize: 14, color: 'var(--fg-2, #888)' }}>
                to see belay requests, invites, and likes.
              </span>
            </div>
          ) : (
            <>
              {inboxQ.isLoading && (
                <p style={{ padding: 24, color: 'var(--fg-2, #888)', fontSize: 14 }}>Loading…</p>
              )}
              {!inboxQ.isLoading && items.length === 0 && (
                <p style={{ padding: 24, color: 'var(--fg-2, #888)', fontSize: 14 }}>All caught up.</p>
              )}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {items.map((n) => (
                  <li
                    key={n.id}
                    style={{ borderBottom: '1px solid var(--border, #f0f0f0)' }}
                  >
                    <NotifRow n={n} onTap={openItem} />
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
