import { Icon } from './Icon'

/** Like animation from peen-web FeedCard. */
export function HeartBurst() {
  return (
    <>
      <span className="heart-burst-pulse" aria-hidden>
        <Icon name="heartFilled" size={18} />
      </span>
      {[-14, 0, 14].map((fx, i) => (
        <span
          key={fx}
          className="heart-burst-float"
          style={{ ['--fx' as string]: `${fx}px`, animationDelay: `${i * 0.05}s` }}
          aria-hidden
        >
          <Icon name="heartFilled" size={12} />
        </span>
      ))}
    </>
  )
}
