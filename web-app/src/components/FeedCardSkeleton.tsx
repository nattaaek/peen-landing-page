export function FeedCardSkeleton() {
  return (
    <article className="feed-card feed-card-skeleton" aria-hidden>
      <div className="feed-head">
        <div className="sk-circle" />
        <div style={{ flex: 1 }}>
          <div className="sk-line" style={{ width: '42%' }} />
          <div className="sk-line short" style={{ width: '28%', marginTop: 6 }} />
        </div>
      </div>
      <div className="sk-block" style={{ margin: '0 18px 12px', height: 72, borderRadius: 12 }} />
      <div className="feed-actions">
        <div className="sk-line" style={{ width: 48 }} />
        <div className="sk-line" style={{ width: 48 }} />
        <div className="sk-line" style={{ width: 32 }} />
      </div>
    </article>
  )
}
