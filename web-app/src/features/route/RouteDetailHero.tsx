import { Icon } from '../../components/Icon'
import type { RouteTopoLine } from '../../types/api'
import { TopoImageWithLines } from './TopoImageWithLines'

export function RouteDetailHero({
  imageUrls,
  activeImageUrl,
  onSelectImage,
  topoLines,
  onOpenTopo,
}: {
  imageUrls: string[]
  activeImageUrl: string | null
  onSelectImage: (url: string) => void
  topoLines: RouteTopoLine[]
  onOpenTopo: () => void
}) {
  const activeIndex = activeImageUrl ? imageUrls.indexOf(activeImageUrl) : -1

  return (
    <div className="route-detail-hero">
      {activeImageUrl ? (
        <TopoImageWithLines imageUrl={activeImageUrl} lines={topoLines} />
      ) : (
        <div className="route-hero-placeholder" />
      )}
      <div className="route-detail-hero-actions">
        {imageUrls.length > 1 && activeIndex >= 0 && (
          <span className="chip route-detail-hero-chip">{activeIndex + 1} / {imageUrls.length}</span>
        )}
        <button
          type="button"
          className="icon-btn route-detail-hero-topo-btn"
          aria-label="Open topo viewer"
          onClick={onOpenTopo}
        >
          <Icon name="topo" size={16} />
        </button>
      </div>
      {imageUrls.length > 1 && (
        <div className="route-detail-hero-thumbs scroll-x">
          {imageUrls.map((url) => {
            const active = url === activeImageUrl
            return (
              <button
                key={url}
                type="button"
                className={`route-topo-thumb${active ? ' active' : ''}`}
                onClick={() => onSelectImage(url)}
                aria-label="Select photo"
              >
                <img src={url} alt="" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
