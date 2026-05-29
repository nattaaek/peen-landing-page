import { FeedUserAvatar } from './FeedUserAvatar'
import { notificationMessage } from '../features/notifications/notificationCopy'
import type { InboxNotification } from '../types/api'

function relativeTime(iso?: string): string {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

export function RailInboxRow({ n }: { n: InboxNotification }) {
  const unread = n.read_at == null && n.read !== true
  const { sender, action } = notificationMessage(n)

  return (
    <div className="row rail-inbox-row">
      <FeedUserAvatar
        name={sender}
        avatarUrl={n.sender_avatar}
        colorSeed={n.actor_id ?? sender}
        size={32}
      />
      <div style={{ flex: 1, fontSize: 13, minWidth: 0 }}>
        <div>
          <b>{sender}</b> {action}
        </div>
        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
          {relativeTime(n.created_at)}
        </div>
      </div>
      {unread ? <span className="rail-inbox-unread" /> : null}
    </div>
  )
}
