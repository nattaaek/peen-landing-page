import { useState } from 'react'
import { useLogClimb } from '../../hooks/useMigration'
import type { ApiRoute, SendType } from '../../types/api'

const SEND_TYPES: SendType[] = ['flash', 'onsight', 'redpoint', 'repeat', 'attempt', 'dog']

export function LogComposer({
  route,
  open,
  onClose,
  onSuccess,
}: {
  route: ApiRoute | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [sendType, setSendType] = useState<SendType>('redpoint')
  const [notes, setNotes] = useState('')
  const [stars, setStars] = useState(5)
  const log = useLogClimb()

  if (!open || !route) return null

  const submit = async () => {
    const climbed_date = new Date().toISOString().slice(0, 10)
    await log.mutateAsync({
      route_id: route.id,
      send_type: sendType,
      climbed_date,
      notes,
      personal_rating: stars,
      is_public: true,
      attempts: 1,
    })
    onSuccess()
    onClose()
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div className="modal log-composer" role="dialog">
        <h2>Log a send</h2>
        <p className="muted">
          {route.name} · {route.grade}
        </p>
        <div className="chip-row" style={{ margin: '16px 0' }}>
          {SEND_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${sendType === t ? 'active' : ''}`}
              onClick={() => setSendType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
        <label className="field">
          <span>Stars ({stars})</span>
          <input
            type="range"
            min={1}
            max={5}
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
          />
        </label>
        {log.isError && <p className="error">Could not save send.</p>}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 16 }}
          disabled={log.isPending}
          onClick={() => submit()}
        >
          {log.isPending ? 'Saving…' : 'Save send'}
        </button>
      </div>
    </>
  )
}
