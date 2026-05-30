export type CragKind = 'area' | 'gym'

export type CragPanelRow = {
  id: string
  kind: CragKind
  name: string
  regionOrAddress?: string
  routeCount: number
  wallCount: number
  distanceKm: number | null
  lat: number | null
  lng: number | null
}

function stableGradientForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  const palettes = [
    ['#E0A77A', '#7A4426'],
    ['#E5C088', '#5C3318'],
    ['#B5A99A', '#544740'],
    ['#9CA39A', '#3F523F'],
    ['#D8BA90', '#7A4426'],
    ['#1F1F20', '#4A4D52'],
    ['#2860A3', '#1F1F20'],
  ] as const
  const pick = palettes[h % palettes.length]
  return `linear-gradient(140deg, ${pick[0]}, ${pick[1]})`
}

export function CragThumb({ crag, size = 60 }: { crag: { id: string; kind: CragKind }; size?: number }) {
  const gradient = stableGradientForId(crag.id)
  const accent = crag.kind === 'gym' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.10)'

  return (
    <div
      className="thumb"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: gradient,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--separator)',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice" width={size} height={size}>
        <path d="M 0 38 C 12 26, 22 36, 34 24 S 54 16, 60 30 L 60 60 L 0 60 Z" fill="#000" opacity={0.15} />
        <path d="M 0 48 C 14 38, 28 46, 40 38 S 58 30, 60 44 L 60 60 L 0 60 Z" fill="#000" opacity={0.12} />
        {crag.kind === 'gym' && (
          <rect
            x="18"
            y="14"
            width="24"
            height="32"
            fill={accent}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
        )}
      </svg>
    </div>
  )
}
