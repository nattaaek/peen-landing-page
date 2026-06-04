/** Community partner post row from migration `fetchPartnersForProjectRoute`. */
export interface CommunityPartnerApiRow {
  id: string
  user_id: string
  bio?: string
  availability?: string
  grade?: string
  style?: string
  driving?: boolean
  user?: {
    user_id?: string
    nickname?: string | null
    full_name?: string | null
    username?: string | null
    avatar_url?: string | null
  }
}

export interface CommunityPartner {
  id: string
  userId: string
  name: string
  initials: string
  color: string
  avatarUrl?: string
  availability: string
  style: string
  grade: string
}

const PARTNER_COLORS = ['#E8A87C', '#85C1E9', '#82E0AA', '#F1948A', '#BB8FCE', '#F7DC6F']

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function colorForInitials(initials: string): string {
  let hash = 0
  for (let i = 0; i < initials.length; i++) hash = (hash + initials.charCodeAt(i) * 17) % PARTNER_COLORS.length
  return PARTNER_COLORS[hash] ?? PARTNER_COLORS[0]
}

export function mapCommunityPartner(row: CommunityPartnerApiRow): CommunityPartner {
  const display =
    row.user?.nickname?.trim() ||
    row.user?.full_name?.trim() ||
    row.user?.username?.trim() ||
    'Climber'
  const initials = initialsFromName(display)
  return {
    id: row.id,
    userId: row.user_id,
    name: display,
    initials,
    color: colorForInitials(initials),
    avatarUrl: row.user?.avatar_url?.trim() || undefined,
    availability: row.availability?.trim() || 'Flexible',
    style: row.style?.trim() || 'Any',
    grade: row.grade?.trim() || 'Any grade',
  }
}
