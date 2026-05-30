import { env } from './env'
import { uploadFile } from './peen-api/storage'
import type { ApproachGPXVersionRow } from '../types/api'

export type GpxPoint = { lat: number; lng: number }

export function canonicalApproachStoragePath(areaId: string): string {
  return `areas/${areaId.toLowerCase()}.gpx`
}

export function approachGpxPublicUrl(storagePath: string): string {
  const base = env.supabaseUrl().replace(/\/$/, '')
  const path = storagePath.replace(/^\//, '')
  return `${base}/storage/v1/object/public/approach-gpx/${path}`
}

export function resolveApproachStoragePath(
  areaId: string,
  latestVersion?: ApproachGPXVersionRow | null,
): string {
  if (latestVersion?.storage_path) return latestVersion.storage_path
  return canonicalApproachStoragePath(areaId)
}

export function parseGpxTrack(xml: string): GpxPoint[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) return []
  const nodes = doc.querySelectorAll('trkpt, rtept')
  const pts: GpxPoint[] = []
  nodes.forEach((el) => {
    const lat = parseFloat(el.getAttribute('lat') ?? '')
    const lng = parseFloat(el.getAttribute('lon') ?? '')
    if (Number.isFinite(lat) && Number.isFinite(lng)) pts.push({ lat, lng })
  })
  return pts
}

export async function fetchApproachGpxXml(storagePath: string): Promise<string | null> {
  const url = approachGpxPublicUrl(storagePath)
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export function versionedApproachStoragePath(areaId: string, versionId: string): string {
  return `areas/${areaId.toLowerCase()}/${versionId.toLowerCase()}.gpx`
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

/** Upload versioned + canonical GPX (matches iOS ApproachGPXService). */
export async function uploadApproachGpxFiles(
  accessToken: string,
  areaId: string,
  file: File,
): Promise<{ versionId: string; versionPath: string; canonicalPath: string }> {
  const versionId = crypto.randomUUID()
  const versionPath = versionedApproachStoragePath(areaId, versionId)
  const canonicalPath = canonicalApproachStoragePath(areaId)
  const base64 = await fileToBase64(file)
  const contentType = file.type || 'application/gpx+xml'

  await uploadFile(accessToken, 'approach-gpx', versionPath, contentType, base64)
  await uploadFile(accessToken, 'approach-gpx', canonicalPath, contentType, base64)

  return { versionId, versionPath, canonicalPath }
}

export function googleMapsDirectionsUrl(lat: number, lng: number, label?: string): string {
  const q = new URLSearchParams({
    api: '1',
    destination: `${lat},${lng}`,
  })
  if (label) q.set('destination_place_id', label)
  return `https://www.google.com/maps/dir/?${q}`
}
