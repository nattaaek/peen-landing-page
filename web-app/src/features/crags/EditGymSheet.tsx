import { useId, useState } from 'react'
import { useGymWriteSession } from '../../hooks/useGymVisit'
import {
  draftFromVisitInfo,
  fieldDomId,
  hasListedVisitInfo,
  planGymVisitUpdate,
  type FieldError,
  type VisitInfoDraft,
} from '../../lib/gymVisitInfo'
import { submitGymVisitUpdate, type GymWriter } from '../../lib/gymWriteController'
import type { ApiGym } from '../../types/api'
import { AcknowledgedSaveNotice, ErrorSummary, GymSheetFrame, GymVisitForm } from './GymVisitForm'

/** Mount only while open and key it by account and gym, so a switch drops the draft and any late result. */
export function EditGymSheet({
  gym,
  writer,
  onClose,
  onSaved,
}: {
  gym: ApiGym
  writer: GymWriter
  onClose: () => void
  onSaved: (gym: ApiGym) => void
}) {
  const formId = useId()
  const { save, reconcile, pending, error, acknowledged } = useGymWriteSession()
  const blocked = pending || !!acknowledged
  const [visit, setVisit] = useState<VisitInfoDraft>(() => draftFromVisitInfo(gym.visit_info))
  const [errors, setErrors] = useState<FieldError[]>([])
  const [confirmClear, setConfirmClear] = useState(false)
  const hasInfo = hasListedVisitInfo(gym.visit_info)

  const submit = async () => {
    if (blocked) return
    const planned = planGymVisitUpdate(gym.id, visit)
    if (!planned.ok) {
      setErrors(planned.errors)
      document.getElementById(fieldDomId(formId, planned.errors[0].field))?.focus()
      return
    }
    setErrors([])
    const saved = await save((scope) => submitGymVisitUpdate(writer, planned.plan, scope.accessToken))
    if (saved) onSaved(saved)
  }

  const checkGymList = async () => {
    const saved = await reconcile()
    if (saved) onSaved(saved)
  }

  const clear = async () => {
    if (blocked) return
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    setErrors([])
    const saved = await save((scope) => submitGymVisitUpdate(writer, { id: gym.id, visit_info: null }, scope.accessToken))
    if (saved) onSaved(saved)
  }

  return (
    <GymSheetFrame
      title={hasInfo ? 'Edit posted info' : 'Add posted info'}
      subtitle={gym.name}
      onClose={onClose}
      footer={
        <>
          {hasInfo && (
            <button type="button" className="btn btn-ghost gym-form-danger" aria-disabled={blocked} onClick={() => void clear()}>
              {confirmClear ? 'Confirm remove all posted info' : 'Remove posted info'}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" aria-disabled={blocked} onClick={() => void submit()}>
            {pending ? 'Saving…' : acknowledged ? 'Already sent' : 'Save posted info'}
          </button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <ErrorSummary formId={formId} errors={errors} />
        {error && (
          <div className="gym-form-server-error" role="alert">
            {error}
          </div>
        )}
        {acknowledged && (
          <AcknowledgedSaveNotice message={acknowledged.message} checking={acknowledged.checking} onCheck={() => void checkGymList()} />
        )}
        {confirmClear && (
          <p className="gym-form-server-error" role="status">
            This removes hours, prices and grade colours for everyone. Select confirm to remove, or keep editing.
          </p>
        )}
        <GymVisitForm formId={formId} draft={visit} errors={errors} onChange={setVisit} />
      </form>
    </GymSheetFrame>
  )
}
