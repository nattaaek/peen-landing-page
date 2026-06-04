import { uploadFile } from './peen-api/storage'
import type { ApiRoute } from '../types/api'

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

/** Resize image in canvas; returns JPEG base64 without data-URL prefix. */
export async function prepareImageBase64(
  file: File,
  maxPixelDimension: number,
  quality: number,
): Promise<{ base64: string; contentType: string; extension: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxPixelDimension / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare image')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Could not encode image')
  return { base64, contentType: 'image/jpeg', extension: 'jpg' }
}

export async function uploadRouteGalleryPhoto(
  accessToken: string,
  routeId: string,
  file: File,
): Promise<string> {
  const { base64, contentType, extension } = await prepareImageBase64(file, 2048, 0.82)
  const path = `topos/${routeId}/gallery-${randomId()}.${extension}`
  const result = await uploadFile(accessToken, 'route-photos', path, contentType, base64)
  return result.public_url
}

export async function uploadRouteWallPhoto(
  accessToken: string,
  routeId: string,
  file: File,
): Promise<string> {
  const { base64, contentType, extension } = await prepareImageBase64(file, 1600, 0.72)
  const path = `topos/${routeId}/${randomId()}.${extension}`
  const result = await uploadFile(accessToken, 'route-photos', path, contentType, base64)
  return result.public_url
}

export function mergeUniqueUrls(existing: string[], added: string[]): string[] {
  const set = new Set(existing)
  for (const url of added) {
    if (url.trim()) set.add(url.trim())
  }
  return [...set]
}

export function routeImageUrls(route: ApiRoute): string[] {
  return [...(route.images ?? []), ...(route.gallery_images ?? [])].filter(Boolean)
}
