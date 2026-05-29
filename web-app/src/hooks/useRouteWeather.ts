import { useEffect, useState } from 'react'
import type { ApiRoute } from '../types/api'
import { fetchCragWeather, peekCachedCragWeather, formatDegreesC, weatherDetailSubtitle } from '../lib/openMeteoWeather'
import { conditionsForArea } from '../lib/weatherConditions'
import { resolveRouteWeatherCoordinate } from '../lib/weatherCoordinates'

/** iOS route-detail / routes-list weather — Open-Meteo at crag coordinates. */
export function useRouteWeather(route: ApiRoute | null | undefined) {
  const [label, setLabel] = useState('—')
  const [subtitle, setSubtitle] = useState('Conditions TBD')
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!route) {
      setLabel('—')
      setSubtitle('Conditions TBD')
      return
    }

    const coord = resolveRouteWeatherCoordinate(route)
    if (!coord) {
      const mock = conditionsForArea(route.area ?? undefined)
      setLabel(`${mock.temp}°`)
      setSubtitle('No location for forecast')
      setFailed(false)
      setLoading(false)
      return
    }

    const applyMock = () => {
      const mock = conditionsForArea(route.area ?? undefined)
      setLabel(`${mock.temp}°`)
      setSubtitle('Weather unavailable')
      setFailed(true)
    }

    const cached = peekCachedCragWeather(coord.cacheKey)
    if (cached) {
      setLabel(formatDegreesC(cached.temperatureC))
      setSubtitle(weatherDetailSubtitle(cached))
      setFailed(false)
      setLoading(false)
    } else {
      setLoading(true)
      setFailed(false)
    }

    let cancelled = false
    fetchCragWeather(coord.cacheKey, coord.latitude, coord.longitude)
      .then((snap) => {
        if (cancelled) return
        setLabel(formatDegreesC(snap.temperatureC))
        setSubtitle(weatherDetailSubtitle(snap))
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) applyMock()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [route?.id, route?.latitude, route?.longitude, route?.area?.id])

  return { label, subtitle, loading, failed }
}
