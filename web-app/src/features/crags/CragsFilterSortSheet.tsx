import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  applyCragListFilters,
  countActiveCragFilters,
  CRAG_SORT_OPTIONS,
  DEFAULT_CRAG_LIST_FILTERS,
  type CragListFilters,
  type CragSortOption,
  uniqueCragRegions,
} from '../../lib/cragListFilters'
import { CRAG_RADIUS_KM } from '../../lib/cragStats'
import type { CragPanelRow } from './CragShared'

type SheetTab = 'filter' | 'sort'

export function CragsFilterSortSheet({
  open,
  tab,
  onClose,
  draftFilters,
  draftSort,
  onApply,
  previewRows,
  hasLocation,
}: {
  open: boolean
  tab: SheetTab
  onClose: () => void
  draftFilters: CragListFilters
  draftSort: CragSortOption
  onApply: (filters: CragListFilters, sort: CragSortOption) => void
  previewRows: CragPanelRow[]
  hasLocation: boolean
}) {
  const [activeTab, setActiveTab] = useState<SheetTab>(tab)
  const [filters, setFilters] = useState(draftFilters)
  const [sort, setSort] = useState(draftSort)

  useEffect(() => {
    if (!open) return
    setActiveTab(tab)
    setFilters(draftFilters)
    setSort(draftSort)
  }, [open, tab, draftFilters, draftSort])

  if (!open) return null

  const regions = uniqueCragRegions(previewRows)
  const previewCount = applyCragListFilters(previewRows, filters, sort, hasLocation).length
  const activeFilters = countActiveCragFilters(filters, hasLocation)

  const toggleRegion = (region: string) => {
    setFilters((f) => {
      const set = new Set(f.regions)
      if (set.has(region)) set.delete(region)
      else set.add(region)
      return { ...f, regions: [...set] }
    })
  }

  const reset = () => {
    setFilters(DEFAULT_CRAG_LIST_FILTERS)
    setSort(hasLocation ? 'distance' : 'name')
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal crags-filter-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-head">
          <h3>Filter & sort</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="crags-sheet-tabs">
          <button
            type="button"
            className={activeTab === 'filter' ? 'active' : ''}
            onClick={() => setActiveTab('filter')}
          >
            Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </button>
          <button
            type="button"
            className={activeTab === 'sort' ? 'active' : ''}
            onClick={() => setActiveTab('sort')}
          >
            Sort
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'filter' ? (
            <>
              {hasLocation ? (
                <div className="field" style={{ marginBottom: 20 }}>
                  <label>
                    Within {Math.round(filters.maxDistanceKm)} km
                    <span className="muted" style={{ fontWeight: 500, marginLeft: 6 }}>
                      of you
                    </span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={CRAG_RADIUS_KM}
                    step={5}
                    value={filters.maxDistanceKm}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, maxDistanceKm: Number(e.target.value) }))
                    }
                  />
                </div>
              ) : (
                <div className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
                  Enable location to filter by distance.
                </div>
              )}

              <div className="field" style={{ marginBottom: 20 }}>
                <label>Minimum routes</label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={filters.minRoutes}
                  onChange={(e) => setFilters((f) => ({ ...f, minRoutes: Number(e.target.value) }))}
                />
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {filters.minRoutes === 0 ? 'Any route count' : `At least ${filters.minRoutes} routes`}
                </div>
              </div>

              {regions.length > 0 && (
                <div className="field">
                  <label>Region</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {regions.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`chip ${filters.regions.includes(r) ? 'active' : ''}`}
                        onClick={() => toggleRegion(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="sort-pick-list">
              {CRAG_SORT_OPTIONS.map((opt) => {
                const disabled = opt.id === 'distance' && !hasLocation
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`sort-pick-row ${sort === opt.id ? 'active' : ''}`}
                    disabled={disabled}
                    onClick={() => setSort(opt.id)}
                  >
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700 }}>{opt.label}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{opt.sub}</div>
                    </div>
                    {sort === opt.id && <Icon name="check" size={18} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="modal-foot" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Reset
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onApply(filters, sort)
              onClose()
            }}
          >
            Show {previewCount} location{previewCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}
