import type { InstagramFeaturedMedia } from '../../types/api'
import { Icon } from '../../components/Icon'

export function FeedReelsCarousel({
  items,
  onSelect,
}: {
  items: InstagramFeaturedMedia[]
  onSelect: (item: InstagramFeaturedMedia) => void
}) {
  if (items.length === 0) return null

  return (
    <section className="feed-reels" aria-label="Community reels">
      <div className="feed-reels-head">
        <div>
          <div className="feed-reels-kicker">Community reels</div>
          <div className="feed-reels-title">Climbers on Instagram</div>
        </div>
        <Icon name="upload" size={18} style={{ color: '#DD2A7B' }} aria-hidden />
      </div>
      <div className="feed-reels-scroll">
        {items.map((item) => (
          <button
            key={item.id ?? item.ig_media_id}
            type="button"
            className="feed-reel-tile"
            onClick={() => onSelect(item)}
            aria-label={`Open Instagram reel by ${item.username ?? 'climber'}`}
          >
            <ReelThumb item={item} />
            <div className="feed-reel-overlay">
              <Icon name="upload" size={10} />
              {item.username ? <span>@{item.username}</span> : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function ReelThumb({ item }: { item: InstagramFeaturedMedia }) {
  const url = item.thumbnail_url?.trim()
  if (url) {
    return (
      <img
        className="feed-reel-thumb"
        src={url}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    )
  }
  return <div className="feed-reel-thumb feed-reel-thumb-placeholder" aria-hidden />
}
