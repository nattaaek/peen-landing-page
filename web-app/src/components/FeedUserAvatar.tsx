const CLIMBER_COLORS = ['#D55A1F', '#2860A3', '#459B51', '#9B59B6', '#1F1F20', '#D55A1F', '#2860A3']

function climberColor(seed?: string) {
  if (!seed) return CLIMBER_COLORS[0]
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return CLIMBER_COLORS[n % CLIMBER_COLORS.length]
}

export function FeedUserAvatar({
  name,
  avatarUrl,
  colorSeed,
  size = 40,
  following = false,
}: {
  name: string
  avatarUrl?: string | null
  colorSeed?: string
  size?: number
  following?: boolean
}) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase()
  const photo = avatarUrl?.trim()
  const inner =
    photo?.startsWith('http') ? (
      <span
        className="av"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${photo})`,
        }}
        role="img"
        aria-label={name}
      />
    ) : (
      <span
        className="av"
        style={{
          width: size,
          height: size,
          background: climberColor(colorSeed),
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: Math.round(size * 0.4),
        }}
      >
        {initial}
      </span>
    )

  if (!following) return inner

  return (
    <span className="av-wrap" style={{ position: 'relative', display: 'inline-flex', flex: `0 0 ${size}px` }}>
      {inner}
      <span className="av-following-badge" title="Following">
        <svg width={Math.max(8, size * 0.22)} height={Math.max(8, size * 0.22)} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      </span>
    </span>
  )
}
