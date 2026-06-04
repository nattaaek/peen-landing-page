import { Icon } from '../../components/Icon'
import type { ClimbLogRow } from '../../types/api'
import { RouteSendsList } from './RouteSendsList'

export function PublicSendsSheet({
  open,
  routeName,
  logs,
  loading,
  onClose,
}: {
  open: boolean
  routeName: string
  logs: ClimbLogRow[]
  loading: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <>
      <div className="modal-backdrop route-stack-modal-backdrop" onClick={onClose} role="presentation" />
      <div
        className="modal route-stack-modal"
        role="dialog"
        aria-label="Public sends"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>Sends · {routeName}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="rail-card route-sends-card">
            <RouteSendsList logs={logs} loading={loading} />
          </div>
        </div>
      </div>
    </>
  )
}
