import type { SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'feed'
  | 'map'
  | 'crew'
  | 'profile'
  | 'bell'
  | 'search'
  | 'plus'
  | 'mountain'
  | 'heart'
  | 'comment'
  | 'share'
  | 'more'
  | 'close'
  | 'chevR'
  | 'filter'
  | 'star'
  | 'starSolid'
  | 'google'
  | 'topo'
  | 'pin'
  | 'trophy'
  | 'cloud'
  | 'sun'
  | 'upload'
  | 'eye'
  | 'bolt'
  | 'heartFilled'
  | 'grade'
  | 'calendar'

const strokeProps = (size: number, stroke: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: stroke,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export function Icon({
  name,
  size = 20,
  stroke = 2,
  className,
}: {
  name: IconName
  size?: number
  stroke?: number
  className?: string
}) {
  const p = strokeProps(size, stroke)
  const wrap = (node: React.ReactNode) => (
    <span className={className} style={{ display: 'inline-flex', lineHeight: 0 }}>
      {node}
    </span>
  )

  switch (name) {
    case 'feed':
      return wrap(
        <svg {...p}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>,
      )
    case 'map':
      return wrap(
        <svg {...p}>
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>,
      )
    case 'crew':
      return wrap(
        <svg {...p}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="6.5" r="2.5" />
          <path d="M16 13c2.8 0 5 2 5 5" />
        </svg>,
      )
    case 'profile':
      return wrap(
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>,
      )
    case 'bell':
      return wrap(
        <svg {...p}>
          <path d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>,
      )
    case 'search':
      return wrap(
        <svg {...p}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>,
      )
    case 'plus':
      return wrap(
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>,
      )
    case 'close':
      return wrap(
        <svg {...p}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>,
      )
    case 'heart':
      return wrap(
        <svg {...p}>
          <path d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 6 3.5 4.5 7-2 4.5-9 9-9 9z" />
        </svg>,
      )
    case 'star':
      return wrap(
        <svg {...p}>
          <path d="m12 2 3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
        </svg>,
      )
    case 'starSolid':
      return wrap(
        <svg {...p} fill="currentColor" stroke="none">
          <path d="m12 2 3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
        </svg>,
      )
    case 'comment':
      return wrap(
        <svg {...p}>
          <path d="M21 12a8 8 0 0 1-12.5 6.6L3 20l1.4-5.5A8 8 0 1 1 21 12z" />
        </svg>,
      )
    case 'bolt':
      return wrap(
        <svg {...p} fill="currentColor" stroke="none">
          <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
        </svg>,
      )
    case 'heartFilled':
      return wrap(
        <svg {...p} fill="currentColor" stroke="none">
          <path d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 6 3.5 4.5 7-2 4.5-9 9-9 9z" />
        </svg>,
      )
    case 'grade':
      return wrap(
        <svg {...p}>
          <path d="M5 21V8l7-5 7 5v13" />
          <path d="M9 21v-6h6v6" />
        </svg>,
      )
    case 'calendar':
      return wrap(
        <svg {...p}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>,
      )
    case 'google':
      return wrap(
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-2 3.2-4.8 3.2-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8C4.1 20.7 7.8 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.9H2.3C1.5 8.5 1 10.2 1 12s.5 3.5 1.3 5.1L6 14.3z"
          />
          <path
            fill="#EA4335"
            d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.3 2.3 6.9L6 9.7c.9-2.5 3.2-4.3 6-4.3z"
          />
        </svg>,
      )
    default:
      return wrap(
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
        </svg>,
      )
  }
}

export function Avatar({
  name,
  color = 'var(--tint)',
  size = 36,
}: {
  name?: string
  color?: string
  size?: number
}) {
  const init = (name ?? '?').trim().charAt(0).toUpperCase()
  return (
    <span
      className="avatar-btn"
      style={{
        width: size,
        height: size,
        background: color,
        color: '#fff',
        fontSize: size * 0.38,
      }}
    >
      {init}
    </span>
  )
}

export function SendBadge({ type }: { type?: string }) {
  const key = (type ?? 'attempt').toLowerCase()
  const label = key === 'send' ? 'send' : key
  return <span className={`send-badge ${label}`}>{type ?? 'send'}</span>
}

export function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: 'var(--peen-flash)' }}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name={i < value ? 'starSolid' : 'star'} size={14} />
      ))}
    </span>
  )
}
