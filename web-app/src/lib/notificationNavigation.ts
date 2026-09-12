export type NotificationNavigation =
  | { destination: 'route' | 'climb' | 'public-profile'; id: string }
  | { destination: 'crew' }
  | { destination: 'profile-guidance' | 'native-guidance' | 'fallback'; message: string }

export type NotificationNavigationInput = {
  entityType?: string
  entityId?: string
  notificationType?: string
}

const APP_GUIDANCE = 'Open it in the Peen iOS or Android app.'

function fallback(): NotificationNavigation {
  return {
    destination: 'fallback',
    message: `This notification cannot be opened on the web. ${APP_GUIDANCE}`,
  }
}

export function resolveNotificationNavigation({
  entityType,
  entityId,
  notificationType,
}: NotificationNavigationInput): NotificationNavigation {
  const type = entityType?.trim().toLowerCase()
  const kind = notificationType?.trim().toLowerCase()

  if ((type === 'route' || type === 'routes') && entityId) {
    return { destination: 'route', id: entityId }
  }
  if (type === 'climb' && entityId) {
    return { destination: 'climb', id: entityId }
  }
  if (type === 'crew_invite') {
    return { destination: 'crew' }
  }
  if (type === 'user' && entityId) {
    return { destination: 'public-profile', id: entityId }
  }
  if (
    type === 'belay_verification' ||
    type === 'belay_verify_request' ||
    type === 'belay_verify_result' ||
    kind === 'belay_verify_request' ||
    kind === 'belay_verify_result'
  ) {
    return {
      destination: 'profile-guidance',
      message: 'Respond to belay verification in the Peen iOS or Android app.',
    }
  }
  if (type === 'climb_request') {
    return {
      destination: 'native-guidance',
      message: 'Open this climb request in the Peen iOS or Android app.',
    }
  }
  return fallback()
}
