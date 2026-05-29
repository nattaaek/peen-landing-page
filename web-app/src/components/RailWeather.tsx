import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import { TopoLines } from './TopoLines'
import { useCatalogAreas } from '../hooks/useCatalog'
import type { ApiArea } from '../types/api'

type CondTone = 'good' | 'fair' | 'poor' | 'none'

type CragConditions = {
  temp: number
  low: number
  summary: string
  icon: 'sun' | 'cloud'
  friction: { v: string; tone: CondTone }
  humidity: string
  rock: { v: string; tone: CondTone }
  forecast: [string, number, 'sun' | 'cloud'][]
}

const MOCK_BY_AREA: Record<string, CragConditions> = {
  default: {
    temp: 28,
    low: 22,
    summary: 'Clear · NE 6 km/h · feels dry',
    icon: 'sun',
    friction: { v: 'Good', tone: 'good' },
    humidity: '34%',
    rock: { v: 'Dry', tone: 'good' },
    forecast: [
      ['Fri', 29, 'sun'],
      ['Sat', 30, 'sun'],
      ['Sun', 28, 'sun'],
      ['Mon', 25, 'cloud'],
      ['Tue', 29, 'sun'],
    ],
  },
}

function shortCragName(name: string): string {
  return name.replace(/ Buttress$/, '').replace(/ Limestone$/, '').replace(/ & Phra Nang$/, '')
}

function conditionsFor(area: ApiArea | undefined): CragConditions {
  if (!area?.name) return MOCK_BY_AREA.default
  const key = Object.keys(MOCK_BY_AREA).find((k) => area.name.toLowerCase().includes(k))
  return MOCK_BY_AREA[key ?? 'default'] ?? MOCK_BY_AREA.default
}

export function RailWeather({ homeAreaId }: { homeAreaId?: string | null }) {
  const areasQ = useCatalogAreas()
  const areas = areasQ.data ?? []
  const [cragId, setCragId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const list = useMemo(() => areas.slice(0, 8), [areas])

  useEffect(() => {
    if (cragId && list.some((a) => a.id === cragId)) return
    const home = homeAreaId ? list.find((a) => a.id === homeAreaId) : undefined
    setCragId(home?.id ?? list[0]?.id ?? null)
  }, [cragId, homeAreaId, list])

  useEffect(() => {
    if (!dropdownOpen) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [dropdownOpen])

  const crag = list.find((a) => a.id === cragId) ?? list[0]
  const cond = conditionsFor(crag)
  const isHome = crag && homeAreaId === crag.id

  if (!crag) {
    return (
      <div className="rail-card weather-card">
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Loading conditions…
        </p>
      </div>
    )
  }

  return (
    <div className="rail-card weather-card">
      <div className="weather-topo">
        <TopoLines />
      </div>

      <div className="weather-head">
        <span className="weather-eyebrow">Conditions</span>
        <span className="weather-live">
          <span className="weather-live-dot" />
          Live
        </span>
      </div>

      <div className="weather-cragsel" ref={ref}>
        <button
          type="button"
          className="weather-cragbtn"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-expanded={dropdownOpen}
        >
          <Icon name="pin" size={14} />
          <span className="weather-cragname">{shortCragName(crag.name)}</span>
          {isHome ? <span className="weather-home">Home</span> : null}
          <Icon
            name="chevD"
            size={14}
            style={{
              marginLeft: 'auto',
              transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>
        {dropdownOpen && list.length > 1 && (
          <div className="weather-dropdown">
            {list.map((a) => {
              const k = conditionsFor(a)
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`weather-dropitem ${a.id === cragId ? 'active' : ''}`}
                  onClick={() => {
                    setCragId(a.id)
                    setDropdownOpen(false)
                  }}
                >
                  <span className={`weather-dot tone-${k.friction.tone}`} />
                  <span className="weather-dropname">
                    {shortCragName(a.name)}
                    {homeAreaId === a.id ? <span className="weather-home">Home</span> : null}
                    {a.region ? <span className="weather-dropregion">{a.region}</span> : null}
                  </span>
                  <span className="weather-droptemp">{k.temp}°</span>
                  {a.id === cragId ? (
                    <Icon name="check" size={15} style={{ color: 'var(--tint)' }} />
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="weather-hero">
        <div
          className={`weather-icon-box ${cond.icon === 'sun' ? 'weather-icon-sun' : 'weather-icon-cloud'}`}
        >
          <Icon name={cond.icon} size={28} />
        </div>
        <div className="weather-hero-text">
          <div className="weather-temp-main">
            {cond.temp}°
            <span>
              {' '}
              / {cond.low}°
            </span>
          </div>
          <div className="weather-summary">{cond.summary}</div>
        </div>
      </div>

      <div className="weather-metrics">
        <div className="weather-metric">
          <div className={`weather-metric-val tone-${cond.friction.tone}`}>{cond.friction.v}</div>
          <div className="weather-metric-label">Friction</div>
        </div>
        <div className="weather-metric">
          <div className="weather-metric-val">{cond.humidity}</div>
          <div className="weather-metric-label">Humidity</div>
        </div>
        <div className="weather-metric">
          <div className={`weather-metric-val tone-${cond.rock.tone}`}>{cond.rock.v}</div>
          <div className="weather-metric-label">Rock</div>
        </div>
      </div>

      <div className="weather-forecast-row">
        {cond.forecast.map(([d, t, ic], i) => (
          <div key={d} className={`weather-forecast-cell ${i === 0 ? 'active' : ''}`}>
            <div className="weather-forecast-day">{d}</div>
            <Icon name={ic} size={16} style={{ color: ic === 'cloud' ? 'var(--fg-2)' : 'var(--fg-1)' }} />
            <div className="weather-forecast-temp">{t}°</div>
          </div>
        ))}
      </div>
    </div>
  )
}
