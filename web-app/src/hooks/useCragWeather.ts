import { useEffect, useState } from 'react'
import type { ApiArea } from '../types/api'
import { fetchCragWeather, peekCachedCragWeather, type OpenMeteoSnapshot } from '../lib/openMeteoWeather'
import {
  conditionsForArea,
  conditionsFromOpenMeteo,
  type CragConditions,
} from '../lib/weatherConditions'
import { resolveAreaWeatherCoordinate } from '../lib/weatherCoordinates'

export function useCragWeather(area: ApiArea | undefined) {
  const [conditions, setConditions] = useState<CragConditions | null>(() =>
    area ? conditionsForArea(area) : null,
  )
  const [loading, setLoading] = useState(false)
  const [live, setLive] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!area) {
      setConditions(null)
      setLoading(false)
      setLive(false)
      setFailed(false)
      return
    }

    const coord = resolveAreaWeatherCoordinate(area)
    if (!coord) {
      setConditions(conditionsForArea(area))
      setLive(false)
      setFailed(false)
      setLoading(false)
      return
    }

    const cached = peekCachedCragWeather(coord.cacheKey)
    if (cached) {
      setConditions(conditionsFromOpenMeteo(cached))
      setLive(true)
      setFailed(false)
      setLoading(false)
    } else {
      setConditions(conditionsForArea(area))
      setLive(false)
      setLoading(true)
    }

    let cancelled = false
    fetchCragWeather(coord.cacheKey, coord.latitude, coord.longitude)
      .then((snap) => {
        if (cancelled) return
        setConditions(conditionsFromOpenMeteo(snap))
        setLive(true)
        setFailed(false)
      })
      .catch(() => {
        if (cancelled) return
        setConditions(conditionsForArea(area))
        setLive(false)
        setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [area?.id, area?.latitude, area?.longitude, area?.name])

  return { conditions, loading, live, failed }
}

export function useAreaWeatherTemp(area: ApiArea): number | null {
  const [temp, setTemp] = useState<number | null>(null)

  useEffect(() => {
    const coord = resolveAreaWeatherCoordinate(area)
    if (!coord) {
      setTemp(null)
      return
    }
    const cached = peekCachedCragWeather(coord.cacheKey)
    if (cached) {
      setTemp(Math.round(cached.temperatureC))
      return
    }
    let cancelled = false
    fetchCragWeather(coord.cacheKey, coord.latitude, coord.longitude)
      .then((snap) => {
        if (!cancelled) setTemp(Math.round(snap.temperatureC))
      })
      .catch(() => {
        if (!cancelled) setTemp(conditionsForArea(area).temp)
      })
    return () => {
      cancelled = true
    }
  }, [area.id, area.latitude, area.longitude, area.name])

  return temp
}

export type { OpenMeteoSnapshot }
