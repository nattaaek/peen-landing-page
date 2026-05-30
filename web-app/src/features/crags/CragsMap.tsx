import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export type CragMapPin = {
  id: string
  kind: 'area' | 'gym'
  name: string
  lat: number
  lng: number
}

export type CragsMapHandle = {
  zoomIn: () => void
  zoomOut: () => void
  flyTo: (lng: number, lat: number, zoom?: number) => void
}

function pinLabel(name: string): string {
  return name.split(' ').slice(0, 2).join(' ')
}

function buildPinElement(pin: CragMapPin, active: boolean, onSelect: () => void): HTMLDivElement {
  const root = document.createElement('div')
  root.className = `pin ${active ? 'active' : ''}`
  root.addEventListener('click', (e) => {
    e.stopPropagation()
    onSelect()
  })

  const body = document.createElement('span')
  body.className = 'pin-body'

  const icon = document.createElement('span')
  icon.className = 'pin-icon'
  icon.innerHTML =
    pin.kind === 'gym'
      ? '<svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/></svg>'
      : '<svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 20 6-10 4 6 3-4 5 8z" fill="currentColor"/></svg>'

  const label = document.createElement('span')
  label.textContent = pinLabel(pin.name)

  body.append(icon, label)
  root.append(body)
  return root
}

export const CragsMap = forwardRef<
  CragsMapHandle,
  {
    pins: CragMapPin[]
    selectedId?: string | null
    onSelect?: (id: string, kind: 'area' | 'gym') => void
  }
>(function CragsMap({ pins, selectedId, onSelect }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomTo((mapRef.current.getZoom() ?? 6) + 1, { duration: 200 }),
    zoomOut: () => mapRef.current?.zoomTo((mapRef.current.getZoom() ?? 6) - 1, { duration: 200 }),
    flyTo: (lng, lat, zoom = 10) =>
      mapRef.current?.flyTo({ center: [lng, lat], zoom: Math.max(mapRef.current.getZoom(), zoom), duration: 450 }),
  }))

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [98.98, 18.79],
      zoom: 6,
      attributionControl: false,
    })
    mapRef.current = map
    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const sync = () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      for (const pin of pins) {
        const el = buildPinElement(pin, pin.id === selectedId, () => onSelect?.(pin.id, pin.kind))
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map)
        markersRef.current.push(marker)
      }
    }

    if (map.isStyleLoaded()) sync()
    else map.once('load', sync)
  }, [pins, selectedId, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const pin = pins.find((p) => p.id === selectedId)
    if (!pin) return
    const fly = () => {
      map.flyTo({
        center: [pin.lng, pin.lat],
        zoom: Math.max(map.getZoom(), 10),
        duration: 450,
        essential: true,
      })
    }
    if (map.isStyleLoaded()) fly()
    else map.once('load', fly)
  }, [selectedId, pins])

  return <div ref={containerRef} className="map-svg" aria-label="Crags map" />
})
