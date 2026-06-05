export interface SeasonalSpotlight {
  challenge_id: string
  slug?: string
  title: string
  subtitle?: string
  reward_summary?: string
  start_date?: string
  end_date?: string
  days_left?: number
  joined_count?: number
  routes_total?: number
  my_completed_count?: number
  achievement_id?: string
  hero_image_url?: string | null
}

export interface SeasonalPastChallenge {
  challenge_id: string
  slug?: string
  title: string
  achievement_id?: string
  start_date: string
  end_date: string
  routes_total: number
}

export interface SeasonalRouteProgress {
  route_id: string
  bucket_id?: string
  grade_label: string
  sort_order: number
  editorial_note?: string | null
  completed: boolean
  status: string
  route_name?: string | null
  area_name?: string | null
  route_grade?: string | null
  latitude?: number | null
  longitude?: number | null
  area_id?: string | null
}

export interface SeasonalChallengeProgress {
  challenge_id: string
  slug?: string
  title: string
  challenge_subtitle?: string | null
  achievement_id?: string
  start_date: string
  end_date: string
  enrolled: boolean
  routes: SeasonalRouteProgress[]
  routes_completed_count: number
  routes_total: number
  overall_complete: boolean
  eligible_for_prize?: boolean
  prize_claim_status?: string
}
