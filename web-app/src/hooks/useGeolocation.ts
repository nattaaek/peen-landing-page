import { useEffect, useState } from 'react'

export type GeoPoint = { lat: number; lng: number }

export function useGeolocation() {
  const [point, setPoint] = useState<GeoPoint | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setDenied(false)
      },
      () => setDenied(true),
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 12_000 },
    )
  }, [])

  return { point, denied }
}
