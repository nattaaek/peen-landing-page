export interface ApiArea {
  id: string
  name: string
  region?: string
  approach_minutes_from_carpark?: number | null
  walk_in_angle?: string | null
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

export interface ApiRouteType {
  id: string
  name: string
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
  images?: string[]
  gallery_images?: string[]
  bolted_by?: string
  first_ascent?: string
  bolt_count?: number
  last_edited_by?: string | null
  last_edited_at?: string | null
  area?: ApiArea | null
  gym?: ApiGym | null
  route_type?: ApiRouteType | null
}

export interface HazardReportRow {
  id: string
  route_id: string
  area_id: string | null
  reported_by: string
  hazard_type: string
  severity: 'low' | 'medium' | 'high' | string
  title: string
  description: string | null
  is_resolved: boolean
  expires_at: string
  created_at: string
  updated_at: string
}

export interface RouteTopoPoint {
  x: number
  y: number
}

export interface RouteTopoLine {
  id: string
  route_id: string
  image_url: string
  path_points: RouteTopoPoint[]
  color: string
  label: string | null
  created_by: string | null
  created_at: string
  last_edited_by: string | null
  last_edited_at: string | null
}

export interface ApproachGPXVersionRow {
  id: string
  area_id: string
  uploader_id: string
  uploaded_at: string
  storage_path: string
  supersedes_id: string | null
  notes: string | null
}

export interface UserProfile {
  user_id: string
  nickname?: string | null
  username?: string | null
  avatar_url?: string | null
  bio?: string | null
  is_profile_public?: boolean
  featured_achievement_id?: string | null
}

export interface InstagramFeaturedMedia {
  id: string
  ig_media_id: string
  media_type?: string
  permalink: string
  shortcode?: string | null
  thumbnail_url?: string | null
  caption?: string | null
  username?: string | null
  published_at?: string | null
  source?: string
  status?: string
}

export interface FeedReactionCountRow {
  climb_id: string
  likes_count?: number
  sendits_count?: number
  comments_count?: number
}

export interface PublicFeedPayload {
  posts: FeedClimbRow[]
  likedClimbIds: string[]
  sendItClimbIds: string[]
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
  profile?: {
    id?: string
    nickname?: string
    username?: string
    avatar_url?: string
    featured_achievement_id?: string
  }
  featured_achievement_id?: string
}

export interface ClimbLogRow {
  id: string
  route_id?: string
  send_type?: string
  grade?: string
  climbed_date?: string
  notes?: string
  photo_urls?: string[]
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
  profile?: { nickname?: string; username?: string; avatar_url?: string }
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

export interface AngleVoteCount {
  angle: string
  count: number
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
  actor_id?: string
  // hydrated client-side
  sender_name?: string
  sender_username?: string
  sender_avatar?: string
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
  display_name?: string
  nickname?: string
  username?: string
}

export interface WeeklyLeaderboardRow {
  user_id: string
  sends?: number
  send_count?: number
  hardest?: string
  delta?: string
  display_name?: string
  nickname?: string
  username?: string
}

export interface SharedProjectRow {
  id: string
  route?: string
  route_id?: string
  crag?: string
  grade?: string
  who_user_ids?: string[]
  count?: number
  your_attempts?: number
}

export interface BetaSprayRow {
  id: string
  user_id?: string
  display_name?: string
  username?: string
  route?: string
  route_id?: string
  grade?: string
  body?: string
  created_at?: string
}

export interface CommunityChallengeRow {
  id: string
  title?: string
  subtitle?: string
  reward?: string
  done?: number
  total?: number
  joined?: number
  days_left?: number
  color_hex?: string
}

export interface CrewInviteRow {
  id: string
  inviter_id?: string
  created_at?: string
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
