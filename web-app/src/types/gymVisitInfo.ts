/** `Gym.visit_info` schema_version 1. See docs/gym-visit-info/README.md. */
export interface GymVisitHours {
  label: string
  opens_at: string
  closes_at: string
  note: string | null
}

export interface GymVisitPrice {
  label: string
  amount_minor: number
  currency: string
  conditions: string | null
}

export interface GymVisitGrade {
  grade: string
  color_name: string
  color_hex: string | null
}

export interface GymVisitProvenance {
  source: 'posted_sign'
  verified_at: string | null
  note: string | null
}

export interface GymVisitInfo {
  schema_version: 1
  hours: GymVisitHours[]
  admission: GymVisitPrice[]
  rentals: GymVisitPrice[]
  grade_legend: GymVisitGrade[]
  /** `null` when the source is missing or not one this client knows. */
  provenance: GymVisitProvenance | null
}
