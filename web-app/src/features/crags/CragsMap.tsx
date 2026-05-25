import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ApiArea, ApiGym } from '../../types/api'

export function CragsMap({
  areas,
  gyms,
  selectedId,
  onSelect,
}: {
  areas: ApiArea[]
  gyms: ApiGym[]
  selectedId?: string | null
  onSelect?: (id: string, kind: 'area' | 'gym') => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [98.98, 18.79],
      zoom: 6,
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const features: GeoJSON.Feature[] = [
      ...areas
        .filter((a) => a.latitude && a.longitude)
        .map((a) => ({
          type: 'Feature' as const,
          properties: { id: a.id, kind: 'area', name: a.name },
          geometry: {
            type: 'Point' as const,
            coordinates: [a.longitude!, a.latitude!],
          },
        })),
      ...gyms
        .filter((g) => g.latitude && g.longitude)
        .map((g) => ({
          type: 'Feature' as const,
          properties: { id: g.id, kind: 'gym', name: g.name },
          geometry: {
            type: 'Point' as const,
            coordinates: [g.longitude!, g.latitude!],
          },
        })),
    ]

    const sourceId = 'crags'
    if (map.getSource(sourceId)) {
      ;(map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features,
      })
    } else {
      map.on('load', () => {
        map.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
        })
        map.addLayer({
          id: 'crags-dots',
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'match',
              ['get', 'kind'],
              'gym',
              '#2860A3',
              '#D55A1F',
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        })
        map.on('click', 'crags-dots', (e) => {
          const f = e.features?.[0]
          if (!f?.properties) return
          onSelect?.(String(f.properties.id), f.properties.kind as 'area' | 'gym')
        })
      })
    }
  }, [areas, gyms, onSelect, selectedId])

  return (
    <div
      ref={containerRef}
      className="crags-map"
      style={{ height: '100%', minHeight: 320, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    />
  )
}
