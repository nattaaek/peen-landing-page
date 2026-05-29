/**
 * Open-Meteo forecast client — mirrors iOS `OpenMeteoForecastService.swift`.
 * @see https://open-meteo.com/en/docs
 */

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'
const CACHE_TTL_MS = 45 * 60 * 1000

export type OpenMeteoSnapshot = {
  temperatureC: number
  apparentTemperatureC?: number
  relativeHumidityPct?: number
  windSpeedKmh?: number
  windDirectionDeg?: number
  weatherCode?: number
  /** Local wall time from Open-Meteo, e.g. `2026-05-14T21:15:00`. */
  sunsetIsoLocal?: string
  timeZoneId?: string
  daily: OpenMeteoDailyPoint[]
  fetchedAt: Date
}

export type OpenMeteoDailyPoint = {
  date: Date
  maxC: number
  minC: number
  weatherCode: number
}

type CacheEntry = { snapshot: OpenMeteoSnapshot; expiresAt: number }

const cache = new Map<string, CacheEntry>()

function jsonNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

function formatSunsetWallTime(isoLocal: string, locale: string): string {
  const time = isoLocal.split('T')[1]?.slice(0, 5)
  if (!time) return ''
  const [hh, mm] = time.split(':').map(Number)
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return ''
  const d = new Date(2000, 0, 1, hh, mm)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d)
}

export function peekCachedCragWeather(cacheKey: string): OpenMeteoSnapshot | undefined {
  const entry = cache.get(cacheKey)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    cache.delete(cacheKey)
    return undefined
  }
  return entry.snapshot
}

export function decodeOpenMeteoSnapshot(root: unknown): OpenMeteoSnapshot {
  if (!root || typeof root !== 'object') throw new Error('decodeFailed')
  const r = root as Record<string, unknown>
  const current = r.current as Record<string, unknown> | undefined
  const temp = jsonNumber(current?.temperature_2m)
  if (temp == null) throw new Error('decodeFailed')

  const dailyRoot = r.daily as Record<string, unknown> | undefined
  const times = (dailyRoot?.time as string[] | undefined) ?? []
  const maxTemps = (dailyRoot?.temperature_2m_max as number[] | undefined) ?? []
  const minTemps = (dailyRoot?.temperature_2m_min as number[] | undefined) ?? []
  const codes = (dailyRoot?.weather_code as number[] | undefined) ?? []
  const tzId = typeof r.timezone === 'string' ? r.timezone : undefined

  const daily: OpenMeteoDailyPoint[] = times
    .map((t, i) => ({
      date: new Date(`${t}T12:00:00`),
      maxC: maxTemps[i] ?? temp,
      minC: minTemps[i] ?? temp,
      weatherCode: codes[i] ?? jsonNumber(current?.weather_code) ?? 0,
    }))
    .filter((d) => !Number.isNaN(d.date.getTime()))

  const sunsetIsoLocal = (dailyRoot?.sunset as string[] | undefined)?.[0]

  return {
    temperatureC: temp,
    apparentTemperatureC: jsonNumber(current?.apparent_temperature),
    relativeHumidityPct: jsonNumber(current?.relative_humidity_2m),
    windSpeedKmh: jsonNumber(current?.wind_speed_10m),
    windDirectionDeg: jsonNumber(current?.wind_direction_10m),
    weatherCode: jsonNumber(current?.weather_code),
    sunsetIsoLocal,
    timeZoneId: tzId,
    daily,
    fetchedAt: new Date(),
  }
}

/**
 * Same request shape as iOS, extended with humidity / wind / 5-day daily for the web rail UI.
 */
export async function fetchCragWeather(
  cacheKey: string,
  latitude: number,
  longitude: number,
): Promise<OpenMeteoSnapshot> {
  const cached = peekCachedCragWeather(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'auto',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','),
    daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunset'].join(','),
    forecast_days: '5',
  })

  const res = await fetch(`${BASE_URL}?${params}`, {
    method: 'GET',
    cache: 'default',
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`badHTTP:${res.status}`)
  const json: unknown = await res.json()
  const snapshot = decodeOpenMeteoSnapshot(json)
  cache.set(cacheKey, { snapshot, expiresAt: Date.now() + CACHE_TTL_MS })
  return snapshot
}

export function formatDegreesC(c: number): string {
  if (Math.abs(c - Math.round(c)) < 0.05) return `${Math.round(c)}°`
  return `${c.toFixed(1)}°`
}

/** iOS `CragWeatherSnapshot.detailSubtitle` */
export function weatherDetailSubtitle(snapshot: OpenMeteoSnapshot, locale = 'en'): string {
  const parts: string[] = []
  if (
    snapshot.apparentTemperatureC != null &&
    Math.abs(snapshot.apparentTemperatureC - snapshot.temperatureC) >= 2
  ) {
    parts.push(`Feels like ${formatDegreesC(snapshot.apparentTemperatureC)}`)
  }
  if (snapshot.sunsetIsoLocal) {
    const wall = formatSunsetWallTime(snapshot.sunsetIsoLocal, locale)
    if (wall) parts.push(`Sun sets ${wall}`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Forecast at crag'
}
