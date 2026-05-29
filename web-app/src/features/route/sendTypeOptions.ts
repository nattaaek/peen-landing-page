import type { SendType } from '../../types/api'
import { SEND_COLORS } from '../../types/api'

export type SendTypeOption = {
  id: SendType
  label: string
  sub: string
  color: string
}

export const SEND_TYPE_OPTIONS: SendTypeOption[] = [
  { id: 'flash', label: 'Flash', color: SEND_COLORS.flash, sub: '1st try, beta' },
  { id: 'onsight', label: 'Onsight', color: SEND_COLORS.onsight, sub: '1st try, blind' },
  { id: 'redpoint', label: 'Redpoint', color: SEND_COLORS.redpoint, sub: 'after work' },
  { id: 'repeat', label: 'Repeat', color: SEND_COLORS.repeat, sub: 'sent before' },
  { id: 'attempt', label: 'Attempt', color: '#1F1F20', sub: "didn't send" },
  { id: 'dog', label: 'Dog', color: SEND_COLORS.dog, sub: 'hung on rope' },
]

export function isSendForBelay(sendType: SendType): boolean {
  return sendType === 'flash' || sendType === 'onsight' || sendType === 'redpoint' || sendType === 'repeat'
}

export function routeLocationLabel(route: {
  area?: { name?: string } | null
  gym?: { name?: string } | null
}): string {
  return route.area?.name ?? route.gym?.name ?? '—'
}
