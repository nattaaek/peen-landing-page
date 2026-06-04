import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/Icon'
import type { CommunityPartner } from '../../domain/communityPartner'
import type { ClimbLogRow } from '../../types/api'
import { RouteSendsList } from './RouteSendsList'

type Segment = 'sends' | 'partners' | 'beta'

export function RouteDetailCommunityTabs({
  publicLogs,
  publicLoading,
  partners,
  partnersLoading,
  fallbackGrade,
  onViewAllSends,
}: {
  publicLogs: ClimbLogRow[]
  publicLoading: boolean
  partners: CommunityPartner[]
  partnersLoading: boolean
  fallbackGrade?: string
  onViewAllSends?: () => void
}) {
  const navigate = useNavigate()
  const [segment, setSegment] = useState<Segment>('sends')

  const tabs: { id: Segment; label: string; count: string }[] = [
    { id: 'sends', label: 'Sends', count: String(publicLogs.length) },
    { id: 'partners', label: 'Partners', count: String(partners.length) },
    { id: 'beta', label: 'Beta', count: '0' },
  ]

  return (
    <div className="route-community-block">
      <div className="route-community-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={segment === t.id}
            className={`route-community-tab${segment === t.id ? ' active' : ''}`}
            onClick={() => setSegment(t.id)}
          >
            <span>{t.label}</span>
            <span className="route-community-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="rail-card route-sends-card">
        {segment === 'sends' && (
          <>
            <RouteSendsList
              logs={publicLogs}
              loading={publicLoading}
              fallbackGrade={fallbackGrade}
              compact
            />
            {publicLogs.length > 3 && onViewAllSends && (
              <button type="button" className="link-btn route-community-more" onClick={onViewAllSends}>
                View all {publicLogs.length} sends
              </button>
            )}
          </>
        )}

        {segment === 'partners' && (
          <>
            {partnersLoading && <div className="route-sends-row muted">Loading partners…</div>}
            {!partnersLoading && partners.length === 0 && (
              <div className="route-community-empty">
                <p className="muted">No climbers are looking for a partner on this route right now.</p>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/crew')}>
                  Find a belay
                </button>
              </div>
            )}
            {!partnersLoading &&
              partners.map((p) => (
                <div key={p.id} className="route-partner-row">
                  <Avatar name={p.name} size={32} color={p.color} />
                  <div className="route-sends-meta">
                    <div className="route-sends-name">{p.name}</div>
                    <div className="muted route-sends-sub">
                      {p.availability} · {p.style}
                    </div>
                    <div className="muted route-sends-grade">{p.grade}</div>
                  </div>
                </div>
              ))}
            {!partnersLoading && partners.length > 0 && (
              <button type="button" className="link-btn route-community-more" onClick={() => navigate('/crew')}>
                Partners hub
              </button>
            )}
          </>
        )}

        {segment === 'beta' && (
          <div className="route-community-empty">
            <p className="muted">
              Per-route beta threads are not available yet. Browse community beta spray from the Crew tab.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/crew')}>
              Open Crew tab
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
