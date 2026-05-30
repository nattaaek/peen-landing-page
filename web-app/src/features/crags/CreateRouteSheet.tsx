import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useCreateRoute } from '../../hooks/useMigration'
import type { ApiRoute } from '../../types/api'

const GRADE_LADDER = [
  '5',
  '5+',
  '6a',
  '6a+',
  '6b',
  '6b+',
  '6c',
  '6c+',
  '7a',
  '7a+',
  '7b',
  '7b+',
  '7c',
  '7c+',
  '8a',
  '8a+',
  '8b',
  '8b+',
] as const

const ANGLE_TAGS = [
  { id: 'slab', label: 'Slab' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'overhung', label: 'Overhang' },
  { id: 'roof', label: 'Roof' },
] as const

export function CreateRouteSheet({
  open,
  onClose,
  onCreated,
  areaId,
  gymId,
  placeName,
  latitude,
  longitude,
}: {
  open: boolean
  onClose: () => void
  onCreated: (route: ApiRoute) => void
  areaId?: string | null
  gymId?: string | null
  placeName: string
  latitude?: number | null
  longitude?: number | null
}) {
  const create = useCreateRoute()
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<string>('7a')
  const [description, setDescription] = useState('')
  const [angles, setAngles] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setGrade('7a')
    setDescription('')
    setAngles(new Set())
    setError(null)
  }, [open, areaId, gymId])

  if (!open) return null

  const toggleAngle = (id: string) => {
    setAngles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Route name is required.')
      return
    }
    setError(null)
    try {
      const route = await create.mutateAsync({
        name: trimmed,
        grade,
        description: description.trim(),
        areaId: areaId ?? null,
        gymId: gymId ?? null,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        styleTags: [...angles],
      })
      onCreated(route)
      onClose()
      setName('')
      setDescription('')
      setAngles(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create route.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal create-route-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add route">
        <div className="modal-head">
          <h3>Add route</h3>
          <div className="modal-head-date">{placeName}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Route name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sweet & Sour"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {GRADE_LADDER.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Steepness</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ANGLE_TAGS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`chip ${angles.has(a.id) ? 'active' : ''}`}
                  onClick={() => toggleAngle(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Beta / description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes for other climbers"
              rows={3}
            />
          </div>
          {error && <div className="error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={create.isPending} onClick={() => void submit()}>
            {create.isPending ? 'Saving…' : 'Create route'}
          </button>
        </div>
      </div>
    </div>
  )
}
