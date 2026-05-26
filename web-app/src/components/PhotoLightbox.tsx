import { useEffect } from 'react'
import { Icon } from './Icon'

export function PhotoLightbox({
  urls,
  index,
  onClose,
  onIndexChange,
}: {
  urls: string[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}) {
  const safeIndex = Math.min(Math.max(0, index), urls.length - 1)
  const hasMany = urls.length > 1

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasMany) {
        onIndexChange((safeIndex - 1 + urls.length) % urls.length)
      }
      if (e.key === 'ArrowRight' && hasMany) {
        onIndexChange((safeIndex + 1) % urls.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasMany, onClose, onIndexChange, safeIndex, urls.length])

  return (
    <>
      <div className="photo-lightbox-backdrop" onClick={onClose} role="presentation" />
      <div className="photo-lightbox" role="dialog" aria-modal aria-label="Photo viewer">
        <button
          type="button"
          className="photo-lightbox-close icon-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="close" size={22} />
        </button>
        {hasMany ? (
          <>
            <button
              type="button"
              className="photo-lightbox-nav photo-lightbox-prev icon-btn"
              onClick={() => onIndexChange((safeIndex - 1 + urls.length) % urls.length)}
              aria-label="Previous photo"
            >
              <span aria-hidden>‹</span>
            </button>
            <button
              type="button"
              className="photo-lightbox-nav photo-lightbox-next icon-btn"
              onClick={() => onIndexChange((safeIndex + 1) % urls.length)}
              aria-label="Next photo"
            >
              <span aria-hidden>›</span>
            </button>
            <span className="photo-lightbox-counter">
              {safeIndex + 1} / {urls.length}
            </span>
          </>
        ) : null}
        <img src={urls[safeIndex]} alt="" className="photo-lightbox-img" />
      </div>
    </>
  )
}
