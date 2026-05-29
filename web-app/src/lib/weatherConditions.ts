import type { ApiArea } from '../types/api'
import type { OpenMeteoSnapshot } from './openMeteoWeather'
import { weatherDetailSubtitle } from './openMeteoWeather'

export type CondTone = 'good' | 'fair' | 'poor' | 'none'

export type CragConditions = {
  temp: number
  low: number
  summary: string
  icon: 'sun' | 'cloud'
  friction: { v: string; tone: CondTone }
  humidity: string
  rock: { v: string; tone: CondTone }
  forecast: [string, number, 'sun' | 'cloud'][]
}

const PROFILES: Record<string, CragConditions> = {
  'crazy horse': {
    temp: 28,
    low: 22,
    summary: 'Clear · NE 6 km/h · feels dry',
    icon: 'sun',
    friction: { v: 'Good', tone: 'good' },
    humidity: '34%',
    rock: { v: 'Dry', tone: 'good' },
    forecast: [
      ['Fri', 29, 'sun'],
      ['Sat', 30, 'sun'],
      ['Sun', 28, 'sun'],
      ['Mon', 25, 'cloud'],
      ['Tue', 29, 'sun'],
    ],
  },
  lampang: {
    temp: 33,
    low: 24,
    summary: 'Hot · still air · midday sun',
    icon: 'sun',
    friction: { v: 'Fair', tone: 'fair' },
    humidity: '46%',
    rock: { v: 'Dry', tone: 'good' },
    forecast: [
      ['Fri', 34, 'sun'],
      ['Sat', 35, 'sun'],
      ['Sun', 33, 'sun'],
      ['Mon', 32, 'cloud'],
      ['Tue', 34, 'sun'],
    ],
  },
  lopburi: {
    temp: 30,
    low: 25,
    summary: 'Hazy · light SW wind',
    icon: 'cloud',
    friction: { v: 'Fair', tone: 'fair' },
    humidity: '58%',
    rock: { v: 'Dry', tone: 'good' },
    forecast: [
      ['Fri', 31, 'cloud'],
      ['Sat', 30, 'cloud'],
      ['Sun', 32, 'sun'],
      ['Mon', 30, 'cloud'],
      ['Tue', 29, 'cloud'],
    ],
  },
  tonsai: {
    temp: 31,
    low: 26,
    summary: 'Humid · sea breeze · sticky',
    icon: 'cloud',
    friction: { v: 'Poor', tone: 'poor' },
    humidity: '79%',
    rock: { v: 'Damp', tone: 'poor' },
    forecast: [
      ['Fri', 31, 'cloud'],
      ['Sat', 30, 'cloud'],
      ['Sun', 32, 'sun'],
      ['Mon', 31, 'cloud'],
      ['Tue', 30, 'cloud'],
    ],
  },
  'phra nang': {
    temp: 31,
    low: 26,
    summary: 'Humid · sea breeze · sticky',
    icon: 'cloud',
    friction: { v: 'Poor', tone: 'poor' },
    humidity: '79%',
    rock: { v: 'Damp', tone: 'poor' },
    forecast: [
      ['Fri', 31, 'cloud'],
      ['Sat', 30, 'cloud'],
      ['Sun', 32, 'sun'],
      ['Mon', 31, 'cloud'],
      ['Tue', 30, 'cloud'],
    ],
  },
  default: {
    temp: 28,
    low: 22,
    summary: 'Clear · NE 6 km/h · feels dry',
    icon: 'sun',
    friction: { v: 'Good', tone: 'good' },
    humidity: '34%',
    rock: { v: 'Dry', tone: 'good' },
    forecast: [
      ['Fri', 29, 'sun'],
      ['Sat', 30, 'sun'],
      ['Sun', 28, 'sun'],
      ['Mon', 25, 'cloud'],
      ['Tue', 29, 'sun'],
    ],
  },
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function wmoToIcon(code: number | undefined): 'sun' | 'cloud' {
  if (code == null) return 'sun'
  if (code === 0) return 'sun'
  if (code <= 3) return 'sun'
  if (code >= 51) return 'cloud'
  return 'cloud'
}

function compassLabel(deg: number | undefined): string {
  if (deg == null) return ''
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
  const idx = Math.round(deg / 45) % 8
  return dirs[idx]
}

function frictionFromHumidity(h: number | undefined): { v: string; tone: CondTone } {
  if (h == null) return { v: '—', tone: 'none' }
  if (h < 45) return { v: 'Good', tone: 'good' }
  if (h < 65) return { v: 'Fair', tone: 'fair' }
  return { v: 'Poor', tone: 'poor' }
}

function rockFromHumidityAndCode(h: number | undefined, code: number | undefined): {
  v: string
  tone: CondTone
} {
  if (code != null && code >= 51) return { v: 'Damp', tone: 'poor' }
  if (h == null) return { v: '—', tone: 'none' }
  if (h < 55) return { v: 'Dry', tone: 'good' }
  if (h < 72) return { v: 'Dry', tone: 'good' }
  return { v: 'Damp', tone: 'poor' }
}

/** Map Open-Meteo (iOS data source) into the web rail card shape. */
export function conditionsFromOpenMeteo(snapshot: OpenMeteoSnapshot): CragConditions {
  const today = snapshot.daily[0]
  const low = today ? Math.round(today.minC) : Math.round(snapshot.temperatureC - 4)
  const temp = Math.round(snapshot.temperatureC)
  const humidity = snapshot.relativeHumidityPct
  const wind =
    snapshot.windSpeedKmh != null
      ? `${compassLabel(snapshot.windDirectionDeg)} ${Math.round(snapshot.windSpeedKmh)} km/h`.trim()
      : ''
  const subtitle = weatherDetailSubtitle(snapshot)
  const summaryParts = [wind, subtitle !== 'Forecast at crag' ? subtitle : ''].filter(Boolean)

  const forecast: CragConditions['forecast'] = snapshot.daily.slice(0, 5).map((d) => {
    const label = DAY_LABELS[d.date.getDay()]
    return [label, Math.round(d.maxC), wmoToIcon(d.weatherCode)] as [string, number, 'sun' | 'cloud']
  })
  while (forecast.length < 5) {
    const i = forecast.length
    forecast.push([DAY_LABELS[(new Date().getDay() + i) % 7], temp, wmoToIcon(snapshot.weatherCode)])
  }

  return {
    temp,
    low,
    summary: summaryParts.join(' · ') || 'Live forecast',
    icon: wmoToIcon(snapshot.weatherCode),
    friction: frictionFromHumidity(humidity),
    humidity: humidity != null ? `${Math.round(humidity)}%` : '—',
    rock: rockFromHumidityAndCode(humidity, snapshot.weatherCode),
    forecast,
  }
}

/** Fallback when coords are missing or Open-Meteo fails. */
export function conditionsForArea(area: ApiArea | undefined): CragConditions {
  if (!area?.name) return PROFILES.default
  const lower = area.name.toLowerCase()
  for (const key of Object.keys(PROFILES)) {
    if (key !== 'default' && lower.includes(key)) return PROFILES[key]
  }
  return PROFILES.default
}

export function weatherProfileSortScore(area: ApiArea): number {
  const lower = area.name.toLowerCase()
  if (lower.includes('crazy horse')) return 0
  if (lower.includes('lampang')) return 1
  if (lower.includes('lopburi')) return 2
  if (lower.includes('tonsai') || lower.includes('phra nang')) return 3
  return 10
}
