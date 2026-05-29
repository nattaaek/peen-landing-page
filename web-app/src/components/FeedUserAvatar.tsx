import { useEffect, useState } from 'react'

const CLIMBER_COLORS = ['#D55A1F', '#2860A3', '#459B51', '#9B59B6', '#1F1F20', '#D55A1F', '#2860A3']

function climberColor(seed?: string) {
  if (!seed) return CLIMBER_COLORS[0]
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return CLIMBER_COLORS[n % CLIMBER_COLORS.length]
}

function isUsableAvatarUrl(url?: string | null): url is string {
  const trimmed = url?.trim()
  if (!trimmed) return false
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('//')
  )
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
  const [imgFailed, setImgFailed] = useState(false)
  const initial = (name.trim().charAt(0) || '?').toUpperCase()
  const photo =
    isUsableAvatarUrl(avatarUrl) && !imgFailed ? avatarUrl.trim() : null

  useEffect(() => {
    setImgFailed(false)
  }, [avatarUrl])

  const inner = photo ? (
    <img
      className="av"
      src={photo}
      alt=""
      width={size}
      height={size}
      decoding="async"
      onError={() => setImgFailed(true)}
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
      aria-hidden={!name}
    >
      {initial}
    </span>
  )

  return (
    <span
      className="av-wrap"
      style={{
        position: 'relative',
        display: 'inline-flex',
        flex: `0 0 ${size}px`,
        width: size,
        height: size,
      }}
    >
      {inner}
      {following ? (
        <span className="av-following-badge" title="Following">
          <svg
            width={Math.max(8, size * 0.22)}
            height={Math.max(8, size * 0.22)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
          >
            <path d="m5 12 4 4 10-10" />
          </svg>
        </span>
      ) : null}
    </span>
  )
}
