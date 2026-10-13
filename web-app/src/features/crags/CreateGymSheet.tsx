import { useId, useState } from 'react'
import { useGymWriteSession } from '../../hooks/useGymVisit'
import {
  emptyVisitInfoDraft,
  fieldDomId,
  planGymCreate,
  type FieldError,
  type GymLocationDraft,
  type VisitInfoDraft,
} from '../../lib/gymVisitInfo'
import { submitGymCreate, type GymWriter } from '../../lib/gymWriteController'
import type { ApiGym } from '../../types/api'
import { AcknowledgedSaveNotice, ErrorSummary, GymSheetFrame, GymTextField, GymVisitForm } from './GymVisitForm'

/** Mount only while open and key it by account, so closing or switching account drops the draft and any late result. */
export function CreateGymSheet({
  writer,
  onClose,
  onCreated,
}: {
  writer: GymWriter
  onClose: () => void
  onCreated: (gym: ApiGym) => void
}) {
  const formId = useId()
  const { save, reconcile, pending, error, acknowledged } = useGymWriteSession()
  const blocked = pending || !!acknowledged
  const [location, setLocation] = useState<GymLocationDraft>({ name: '', latitude: '', longitude: '', address: '' })
  const [visit, setVisit] = useState<VisitInfoDraft>(emptyVisitInfoDraft)
  const [errors, setErrors] = useState<FieldError[]>([])

  const setField = (key: keyof GymLocationDraft) => (value: string) => setLocation((l) => ({ ...l, [key]: value }))

  const submit = async () => {
    if (blocked) return
    const planned = planGymCreate(location, visit)
    if (!planned.ok) {
      setErrors(planned.errors)
      document.getElementById(fieldDomId(formId, planned.errors[0].field))?.focus()
      return
    }
    setErrors([])
    const gym = await save((scope) => submitGymCreate(writer, planned.plan, scope.accessToken))
    if (gym) onCreated(gym)
  }

  const checkGymList = async () => {
    const gym = await reconcile()
    if (gym) onCreated(gym)
  }

  return (
    <GymSheetFrame
      title="Add gym"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            aria-disabled={blocked}
            onClick={() => void submit()}
          >
            {pending ? 'Saving…' : acknowledged ? 'Already sent' : 'Add gym'}
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
        <GymTextField formId={formId} errors={errors} field="gym:name" label="Gym name" autoFocus maxLength={120} value={location.name} onChange={setField('name')} />
        <div className="gym-form-grid">
          <GymTextField
            formId={formId}
            errors={errors}
            field="gym:latitude"
            label="Latitude"
            inputMode="decimal"
            placeholder="e.g. 13.149184"
            hint="Decimal degrees, -90 to 90"
            value={location.latitude}
            onChange={setField('latitude')}
          />
          <GymTextField
            formId={formId}
            errors={errors}
            field="gym:longitude"
            label="Longitude"
            inputMode="decimal"
            placeholder="e.g. 100.917083"
            hint="Decimal degrees, -180 to 180"
            value={location.longitude}
            onChange={setField('longitude')}
          />
        </div>
        <GymTextField formId={formId} errors={errors} field="gym:address" label="Address" optional autoComplete="street-address" maxLength={300} value={location.address} onChange={setField('address')} />
        <h4 className="gym-form-subhead">Posted visit info (optional)</h4>
        <GymVisitForm formId={formId} draft={visit} errors={errors} onChange={setVisit} />
      </form>
    </GymSheetFrame>
  )
}
