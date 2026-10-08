import type { SeasonalRouteProgress } from '../types/seasonalChallenge'
export const PASSPORT_GRADES = ['6a/+', '6b/+', '6c/+', '7a/+', '7b/+', '7c/+'] as const
export type PassportPage = 'cover' | 'front' | 'back'
export function passportPage(value: string | null): PassportPage {
  return value === 'front' || value === 'back' ? value : 'cover'
}
export function passportBands(routes: SeasonalRouteProgress[]) {
  return PASSPORT_GRADES.map(grade => {
    const rows = routes.filter(row => row.grade_label.replace(/\s/g, '').toLowerCase() === grade).sort((a,b) => a.sort_order-b.sort_order)
    return { grade, routes: rows, completed: rows.filter(row => row.completed).length }
  })
}
