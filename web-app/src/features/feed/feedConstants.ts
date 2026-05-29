export const FEED_GRADES = [
  '5a', '5b', '5c', '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b', '8c+',
] as const

export const SEND_STYLES = [
  { id: 'flash', label: 'Flash', color: '#FFD700', desc: 'First try, with beta' },
  { id: 'onsight', label: 'Onsight', color: '#2860A3', desc: 'First try, no beta' },
  { id: 'redpoint', label: 'Redpoint', color: '#D55A1F', desc: 'Worked then sent' },
  { id: 'repeat', label: 'Repeat', color: '#459B51', desc: 'Done before' },
  { id: 'attempt', label: 'Project', color: '#9B59B6', desc: 'In progress' },
] as const

export const WHEN_OPTS = [
  { id: 'any', label: 'Anytime' },
  { id: '24h', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
] as const

export const SORT_OPTS = [
  { id: 'recent', label: 'Most recent', icon: 'calendar' as const },
  { id: 'likes', label: 'Most liked', icon: 'heart' as const },
  { id: 'hardest', label: 'Hardest first', icon: 'flag' as const },
  { id: 'attempts', label: 'Most attempted', icon: 'refresh' as const },
] as const

export type WhenChoice = (typeof WHEN_OPTS)[number]['id']
export type SortChoice = (typeof SORT_OPTS)[number]['id']

export const DEFAULT_GRADE_RANGE: [number, number] = [0, FEED_GRADES.length - 1]

/** Preset: 6b+ through 7b+ (indices derived from FEED_GRADES). */
export const GRADE_PRESET_MY_RANGE: [number, number] = [
  FEED_GRADES.indexOf('6b+'),
  FEED_GRADES.indexOf('7b+'),
] as [number, number]
