import type { ApiArea, ApiGym, ApiRoute } from '../types/api'

export type WeatherCoordinateResolution = {
  latitude: number
  longitude: number
  cacheKey: string
}

function hasUsableCoords(lat?: number, lon?: number): boolean {
  if (lat == null || lon == null) return false
  return lat !== 0 || lon !== 0
}

/** Matches iOS `Route.resolvedWeatherCoordinate()` — prefer area pin, else route coords. */
export function resolveRouteWeatherCoordinate(route: ApiRoute): WeatherCoordinateResolution | null {
  const area = route.area
  if (area && hasUsableCoords(area.latitude, area.longitude)) {
    return {
      latitude: area.latitude!,
      longitude: area.longitude!,
      cacheKey: `area:${area.id}`,
    }
  }
  if (hasUsableCoords(route.latitude, route.longitude)) {
    const rlat = Math.round((route.latitude! * 1000)) / 1000
    const rlon = Math.round((route.longitude! * 1000)) / 1000
    return {
      latitude: route.latitude!,
      longitude: route.longitude!,
      cacheKey: `coord:${rlat.toFixed(3)},${rlon.toFixed(3)}`,
    }
  }
  return null
}

export function resolveAreaWeatherCoordinate(area: ApiArea): WeatherCoordinateResolution | null {
  if (!hasUsableCoords(area.latitude, area.longitude)) return null
  return {
    latitude: area.latitude!,
    longitude: area.longitude!,
    cacheKey: `area:${area.id}`,
  }
}

export function resolveGymWeatherCoordinate(gym: ApiGym): WeatherCoordinateResolution | null {
  if (!hasUsableCoords(gym.latitude, gym.longitude)) return null
  return {
    latitude: gym.latitude!,
    longitude: gym.longitude!,
    cacheKey: `gym:${gym.id}`,
  }
}
