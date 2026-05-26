export interface ApiArea {
  id: string
  name: string
  region?: string
  latitude?: number
  longitude?: number
}

export interface ApiGym {
  id: string
  name: string
  latitude?: number
  longitude?: number
  address?: string
}

export interface ApiRoute {
  id: string
  name: string
  grade?: string
  latitude?: number
  longitude?: number
  area_id?: string | null
  gym_id?: string | null
  description?: string
  length_meters?: number
  style_tags?: string[]
  area?: ApiArea | null
  gym?: ApiGym | null
}

export interface UserProfile {
  user_id: string
  nickname?: string | null
  username?: string | null
  avatar_url?: string | null
  bio?: string | null
}

export interface FeedClimbRow {
  id: string
  user_id?: string
  route_id?: string
  send_type?: string
  notes?: string
  photo_urls?: string[]
  like_count?: number
  comment_count?: number
  attempts?: number
  personal_rating?: number
  created_at?: string
  route?: ApiRoute
  profile?: { id?: string; nickname?: string; username?: string; avatar_url?: string }
}

export interface ClimbLogRow {
  id: string
  route_id?: string
  send_type?: string
  grade?: string
  climbed_date?: string
  notes?: string
  personal_rating?: number
  attempts?: number
  is_public?: boolean
  created_at?: string
  route?: ApiRoute
  profile?: { nickname?: string; username?: string }
}

export interface ClimbComment {
  id: string
  climb_id?: string
  user_id?: string
  body?: string
  created_at?: string
}

export interface RouteRatingSummary {
  avg_rating?: number
  rating_count?: number
}

export interface AngleConsensus {
  route_id?: string
  votes?: number
  top_angle?: string
}

export interface InboxNotification {
  id: string
  kind?: string
  type?: string
  title?: string
  body?: string
  read?: boolean
  read_at?: string | null
  entity_type?: string
  entity_id?: string
  created_at?: string
}

export interface PartnerPost {
  id: string
  user_id?: string
  when_text?: string
  crag_name?: string
  styles?: string[]
  grade_band?: string
  seats?: number
  transport?: string
}

export type SendType = 'flash' | 'onsight' | 'redpoint' | 'repeat' | 'attempt' | 'dog'

export const SEND_COLORS: Record<string, string> = {
  flash: '#FFD700',
  onsight: '#2860A3',
  redpoint: '#D55A1F',
  repeat: '#459B51',
  dog: '#9B59B6',
  attempt: '#E5E5EA',
}
