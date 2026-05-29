import { uploadFile } from '../../lib/peen-api/storage'

const MAX_PHOTOS = 6

export function climbLogPhotoPath(routeId: string, file: File): string {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `topos/${routeId}/climb-log-${crypto.randomUUID().toLowerCase()}.${ext}`
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

export async function uploadClimbLogPhotos(
  accessToken: string,
  routeId: string,
  files: File[],
): Promise<string[]> {
  const slice = files.slice(0, MAX_PHOTOS)
  const urls: string[] = []
  for (const file of slice) {
    const base64 = await fileToBase64(file)
    const contentType = file.type || 'image/jpeg'
    const path = climbLogPhotoPath(routeId, file)
    const { public_url } = await uploadFile(accessToken, 'route-photos', path, contentType, base64)
    urls.push(public_url)
  }
  return urls
}

export { MAX_PHOTOS }
