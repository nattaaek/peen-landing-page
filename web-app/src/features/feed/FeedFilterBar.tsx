import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import {
  DEFAULT_GRADE_RANGE,
  FEED_GRADES,
  GRADE_PRESET_MY_RANGE,
  SEND_STYLES,
  SORT_OPTS,
  WHEN_OPTS,
  type SortChoice,
  type WhenChoice,
} from './feedConstants'
import { countActiveFilters, type FeedFilterState } from './feedFilterLogic'

function FilterControl({
  id,
  label,
  value,
  icon,
  openMenu,
  setOpenMenu,
  alignRight,
  children,
}: {
  id: string
  label: string
  value: string | null
  icon?: React.ComponentProps<typeof Icon>['name']
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  alignRight?: boolean
  children: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const isOpen = openMenu === id
  const isActive = value != null

  useEffect(() => {
    if (!isOpen) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, setOpenMenu])

  return (
    <div ref={rootRef} className={`filter-control ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className={`filter-btn ${isActive ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpenMenu(isOpen ? null : id)
        }}
        aria-expanded={isOpen}
      >
        {icon ? <Icon name={icon} size={13} /> : null}
        <span>{label}</span>
        {value ? <span className="filter-val">{value}</span> : null}
        <Icon name="chevD" size={11} style={{ opacity: 0.55 }} />
      </button>
      {isOpen ? (
        <div
          className={`filter-popover ${alignRight ? 'align-right' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

function GradeSlider({
  value,
  onChange,
}: {
  value: [number, number]
  onChange: (range: [number, number]) => void
}) {
  const [lo, hi] = value
  const trackRef = useRef<HTMLDivElement>(null)
  const last = FEED_GRADES.length - 1

  const drag = (which: 'lo' | 'hi') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent | TouchEvent) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
      const pct = Math.max(0, Math.min(1, (cx - rect.left) / rect.width))
      const idx = Math.round(pct * last)
      if (which === 'lo') onChange([Math.min(idx, hi), hi])
      else onChange([lo, Math.max(idx, lo)])
    }
    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', up)
  }

  const pct = (i: number) => `${(i / last) * 100}%`

  return (
    <div className="grade-slider">
      <div className="grade-readout">
        <span className="grade-pill">{FEED_GRADES[lo]}</span>
        <span className="grade-arrow">to</span>
        <span className="grade-pill">{FEED_GRADES[hi]}</span>
      </div>
      <div className="grade-track" ref={trackRef}>
        <div className="grade-fill" style={{ left: pct(lo), right: `calc(100% - ${pct(hi)})` }} />
        <button
          type="button"
          className="grade-thumb"
          style={{ left: pct(lo) }}
          onMouseDown={drag('lo')}
          onTouchStart={drag('lo')}
          aria-label="Min grade"
        />
        <button
          type="button"
          className="grade-thumb"
          style={{ left: pct(hi) }}
          onMouseDown={drag('hi')}
          onTouchStart={drag('hi')}
          aria-label="Max grade"
        />
      </div>
      <div className="grade-scale">
        {FEED_GRADES.map((g, i) => (
          <span key={g} className={i === 0 || i === last || i % 3 === 0 ? 'shown' : ''}>
            {g}
          </span>
        ))}
      </div>
    </div>
  )
}

export function FeedFilterBar({
  state,
  onChange,
  cragOptions,
  cragCounts,
  resultCount,
}: {
  state: FeedFilterState
  onChange: (next: FeedFilterState) => void
  cragOptions: string[]
  cragCounts: Map<string, number>
  resultCount: number
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const gradeActive =
    state.gradeRange[0] > DEFAULT_GRADE_RANGE[0] ||
    state.gradeRange[1] < DEFAULT_GRADE_RANGE[1]
  const activeCount = countActiveFilters(state)

  const toggleInSet = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const clearAll = () => {
    onChange({
      ...state,
      styleSet: new Set(),
      gradeRange: [...DEFAULT_GRADE_RANGE],
      cragSet: new Set(),
      whenChoice: 'any',
    })
  }

  const styleSummary = [...state.styleSet]
    .map((id) => SEND_STYLES.find((s) => s.id === id)?.label)
    .join(' · ')
  const cragSummary =
    state.cragSet.size === 1 ? [...state.cragSet][0] : `${state.cragSet.size} crags`
  const whenSummary = WHEN_OPTS.find((w) => w.id === state.whenChoice)?.label
  const sortLabel = SORT_OPTS.find((s) => s.id === state.sortBy)?.label

  return (
    <>
      <div className="feed-filter-bar">
        <FilterControl
          id="style"
          label="Style"
          icon="bolt"
          value={
            state.styleSet.size > 0
              ? state.styleSet.size === 1
                ? styleSummary
                : `${state.styleSet.size}`
              : null
          }
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        >
          <div className="popover-head">
            Send style <span className="popover-hint">multi-select</span>
          </div>
          {SEND_STYLES.map((s) => {
            const on = state.styleSet.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                className="popover-row"
                onClick={() =>
                  onChange({ ...state, styleSet: toggleInSet(state.styleSet, s.id) })
                }
              >
                <span className={`pop-check ${on ? 'on' : ''}`}>
                  {on ? <Icon name="check" size={11} stroke={3} /> : null}
                </span>
                <span className="pop-dot" style={{ background: s.color }} />
                <span className="pop-row-main">
                  <span className="pop-label">{s.label}</span>
                  <span className="pop-desc">{s.desc}</span>
                </span>
              </button>
            )
          })}
        </FilterControl>

        <FilterControl
          id="grade"
          label="Grade"
          icon="flag"
          value={gradeActive ? `${FEED_GRADES[state.gradeRange[0]]}–${FEED_GRADES[state.gradeRange[1]]}` : null}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        >
          <div className="popover-head">Grade range</div>
          <GradeSlider
            value={state.gradeRange}
            onChange={(gradeRange) => onChange({ ...state, gradeRange })}
          />
          <div className="popover-foot">
            <button
              type="button"
              className="pop-link"
              onClick={() => onChange({ ...state, gradeRange: [...DEFAULT_GRADE_RANGE] })}
            >
              Reset
            </button>
            <button
              type="button"
              className="pop-link"
              onClick={() => onChange({ ...state, gradeRange: [...GRADE_PRESET_MY_RANGE] })}
            >
              My range ({FEED_GRADES[GRADE_PRESET_MY_RANGE[0]]} – {FEED_GRADES[GRADE_PRESET_MY_RANGE[1]]})
            </button>
          </div>
        </FilterControl>

        <FilterControl
          id="crag"
          label="Crag"
          icon="pin"
          value={
            state.cragSet.size > 0
              ? state.cragSet.size === 1
                ? [...state.cragSet][0].split(' ')[0]
                : `${state.cragSet.size}`
              : null
          }
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        >
          <div className="popover-head">Crag</div>
          {cragOptions.length === 0 ? (
            <p className="muted" style={{ padding: '8px 12px', fontSize: 13, margin: 0 }}>
              No crags in loaded sends yet.
            </p>
          ) : (
            cragOptions.map((c) => {
              const on = state.cragSet.has(c)
              const count = cragCounts.get(c) ?? 0
              return (
                <button
                  key={c}
                  type="button"
                  className="popover-row"
                  onClick={() => onChange({ ...state, cragSet: toggleInSet(state.cragSet, c) })}
                >
                  <span className={`pop-check ${on ? 'on' : ''}`}>
                    {on ? <Icon name="check" size={11} stroke={3} /> : null}
                  </span>
                  <span className="pop-row-main">
                    <span className="pop-label">{c}</span>
                  </span>
                  <span className="pop-count">{count}</span>
                </button>
              )
            })
          )}
        </FilterControl>

        <FilterControl
          id="when"
          label="When"
          icon="calendar"
          value={state.whenChoice !== 'any' ? (whenSummary ?? null) : null}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        >
          <div className="popover-head">Date range</div>
          {WHEN_OPTS.map((o) => (
            <button
              key={o.id}
              type="button"
              className="popover-row"
              onClick={() => {
                onChange({ ...state, whenChoice: o.id as WhenChoice })
                setOpenMenu(null)
              }}
            >
              <span className={`pop-radio ${state.whenChoice === o.id ? 'on' : ''}`} />
              <span className="pop-label">{o.label}</span>
            </button>
          ))}
        </FilterControl>

        <span style={{ flex: 1 }} />

        <FilterControl
          id="sort"
          label={`Sort: ${sortLabel}`}
          icon="sort"
          value={null}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          alignRight
        >
          <div className="popover-head">Sort by</div>
          {SORT_OPTS.map((o) => (
            <button
              key={o.id}
              type="button"
              className="popover-row"
              onClick={() => {
                onChange({ ...state, sortBy: o.id as SortChoice })
                setOpenMenu(null)
              }}
            >
              <span className={`pop-radio ${state.sortBy === o.id ? 'on' : ''}`} />
              <Icon name={o.icon} size={13} style={{ color: 'var(--fg-2)' }} />
              <span className="pop-label">{o.label}</span>
            </button>
          ))}
        </FilterControl>
      </div>

      {activeCount > 0 ? (
        <div className="feed-summary">
          <span className="feed-summary-count">
            {resultCount} {resultCount === 1 ? 'send' : 'sends'}
            <span className="feed-summary-scope"> in loaded feed</span>
          </span>
          {state.styleSet.size > 0 ? (
            <span className="summary-tag">
              {state.styleSet.size === 1 ? styleSummary : `${state.styleSet.size} styles`}
              <button
                type="button"
                onClick={() => onChange({ ...state, styleSet: new Set() })}
                aria-label="Clear style"
              >
                <Icon name="close" size={10} stroke={3} />
              </button>
            </span>
          ) : null}
          {gradeActive ? (
            <span className="summary-tag">
              {FEED_GRADES[state.gradeRange[0]]} – {FEED_GRADES[state.gradeRange[1]]}
              <button
                type="button"
                onClick={() => onChange({ ...state, gradeRange: [...DEFAULT_GRADE_RANGE] })}
                aria-label="Clear grade"
              >
                <Icon name="close" size={10} stroke={3} />
              </button>
            </span>
          ) : null}
          {state.cragSet.size > 0 ? (
            <span className="summary-tag">
              {cragSummary}
              <button
                type="button"
                onClick={() => onChange({ ...state, cragSet: new Set() })}
                aria-label="Clear crag"
              >
                <Icon name="close" size={10} stroke={3} />
              </button>
            </span>
          ) : null}
          {state.whenChoice !== 'any' ? (
            <span className="summary-tag">
              {whenSummary}
              <button
                type="button"
                onClick={() => onChange({ ...state, whenChoice: 'any' })}
                aria-label="Clear date"
              >
                <Icon name="close" size={10} stroke={3} />
              </button>
            </span>
          ) : null}
          <span style={{ flex: 1 }} />
          <button type="button" onClick={clearAll} className="feed-clear">
            Clear all
          </button>
        </div>
      ) : null}
    </>
  )
}
