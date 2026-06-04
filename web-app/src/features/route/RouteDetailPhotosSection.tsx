import { useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useAuth } from '../auth/AuthProvider'
import { mergeUniqueUrls } from '../../lib/routePhotos'
import type { ApiRoute } from '../../types/api'

export function RouteDetailPhotosSection({
  route,
  logPhotoUrls,
  onUploadGallery,
  onUploadWall,
  onLinkPhotos,
  uploading,
}: {
  route: ApiRoute
  logPhotoUrls: string[]
  onUploadGallery: (file: File) => Promise<void>
  onUploadWall: (file: File) => Promise<void>
  onLinkPhotos: () => void
  uploading: boolean
}) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const wallRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const { accessToken } = useAuth()

  const gallery = route.gallery_images ?? []
  const wall = route.images ?? []
  const hasContent = gallery.length > 0 || wall.length > 0 || logPhotoUrls.length > 0

  const handleFile = async (file: File | undefined, kind: 'gallery' | 'wall') => {
    if (!file || !accessToken) return
    setError(null)
    try {
      if (kind === 'gallery') await onUploadGallery(file)
      else await onUploadWall(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
  }

  if (!hasContent && !accessToken) return null

  return (
    <div className="route-photos-section">
      <div className="route-detail-section-head">
        <h4 className="route-detail-section-title">Climber photos</h4>
        {accessToken && (
          <div className="route-photos-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={uploading}
              onClick={() => wallRef.current?.click()}
            >
              Add wall photo
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={uploading}
              onClick={() => galleryRef.current?.click()}
            >
              Gallery
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={uploading} onClick={onLinkPhotos}>
              Link photo
            </button>
          </div>
        )}
      </div>
      <p className="muted route-photos-hint">From climb logs and optional gallery uploads.</p>
      {error && <p className="route-photos-error">{error}</p>}
      {uploading && <p className="muted">Uploading…</p>}

      <input
        ref={wallRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0], 'wall')
          e.target.value = ''
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0], 'gallery')
          e.target.value = ''
        }}
      />

      {(wall.length > 0 || gallery.length > 0) && (
        <div className="scroll-x route-photos-scroll">
          {mergeUniqueUrls(wall, gallery).map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="route-photo-thumb">
              <img src={url} alt="" />
            </a>
          ))}
        </div>
      )}

      {logPhotoUrls.length > 0 && (
        <>
          <div className="route-photos-subtitle">From sends</div>
          <div className="scroll-x route-photos-scroll">
            {logPhotoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="route-photo-thumb">
                <img src={url} alt="" />
              </a>
            ))}
          </div>
        </>
      )}

      {!hasContent && accessToken && (
        <div className="rail-card route-photos-empty">
          <Icon name="topo" size={24} />
          <p className="muted">Add a wall photo or link one from a nearby route.</p>
        </div>
      )}
    </div>
  )
}

/** Collect unique photo URLs from public sends (when API includes them on logs). */
export function logPhotoUrlsFromSends(
  logs: { photo_urls?: string[] }[],
): string[] {
  const urls: string[] = []
  for (const log of logs) {
    for (const u of log.photo_urls ?? []) {
      if (u && !urls.includes(u)) urls.push(u)
    }
  }
  return urls
}
