import type { InboxNotification } from '../../types/api'

/** Match iOS `NotificationsInboxView.primaryText` + body fallback. */
export function notificationMessage(n: InboxNotification): { sender: string; action: string } {
  const sender = n.sender_name ?? 'Someone'
  const type = (n.type ?? n.kind ?? '').toLowerCase()

  switch (type) {
    case 'follow':
      return { sender, action: 'followed you' }
    case 'like':
      return { sender, action: 'liked your climb' }
    case 'sendit':
      return { sender, action: 'sent-it your climb' }
    case 'comment':
      return { sender, action: 'commented on your climb' }
    case 'crew_invite':
      return { sender, action: 'invited you to their crew' }
    case 'climb_request':
      return { sender, action: 'sent a climb request' }
    case 'belay_verify_request':
      return { sender, action: 'wants you to verify a send' }
    case 'belay_verify_result':
      return { sender: 'Belay verification', action: 'updated' }
    default:
      if (n.body?.trim()) return { sender, action: n.body.trim() }
      if (n.title?.trim()) return { sender, action: n.title.trim() }
      return { sender, action: 'sent you a notification' }
  }
}
