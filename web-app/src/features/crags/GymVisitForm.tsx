import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { ModalPortal } from '../../components/ModalPortal'
import {
  emptyGradeDraft,
  emptyHoursDraft,
  emptyPriceDraft,
  fieldDomId,
  type DraftListKey,
  type FieldError,
  type GradeDraft,
  type HoursDraft,
  type PriceDraft,
  type PriceListKey,
  type VisitInfoDraft,
} from '../../lib/gymVisitInfo'
import '../../styles/gym-visit.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Modal dialog: labelled, Escape closes, Tab stays inside, focus returns to the opener on close. */
export function GymSheetFrame({
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  footer: ReactNode
  children: ReactNode
}) {
  const titleId = useId()
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const node = dialog.current
    const first =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector('.modal-body')?.querySelector<HTMLElement>(FOCUSABLE) ??
      node?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    return () => {
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !dialog.current) return
    const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose} role="presentation" />
      <div
        ref={dialog}
        className="modal gym-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          {subtitle && <div className="modal-head-date">{subtitle}</div>}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </ModalPortal>
  )
}

/** The server accepted the save but its reply was unreadable. The only action is a read-only refresh. */
export function AcknowledgedSaveNotice({
  message,
  checking,
  onCheck,
}: {
  message: string
  checking: boolean
  onCheck: () => void
}) {
  return (
    <div className="gym-form-server-error gym-form-acknowledged" role="alert">
      <p>{message}</p>
      <button type="button" className="btn btn-ghost" aria-disabled={checking} onClick={() => (checking ? undefined : onCheck())}>
        {checking ? 'Checking gym list…' : 'Check gym list'}
      </button>
    </div>
  )
}

export function ErrorSummary({ formId, errors }: { formId: string; errors: FieldError[] }) {
  if (errors.length === 0) return null
  return (
    <div className="gym-form-errors" role="alert">
      <p>Fix {errors.length === 1 ? 'this' : `these ${errors.length}`} before saving:</p>
      <ul>
        {errors.map((e, i) => (
          <li key={`${e.field}-${i}`}>
            <a
              href={`#${fieldDomId(formId, e.field)}`}
              onClick={(ev) => {
                ev.preventDefault()
                document.getElementById(fieldDomId(formId, e.field))?.focus()
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function GymTextField({
  formId,
  field,
  label,
  value,
  onChange,
  errors,
  hint,
  optional,
  autoFocus,
  ...input
}: {
  formId: string
  field: string
  label: string
  value: string
  onChange: (value: string) => void
  errors: FieldError[]
  hint?: string
  optional?: boolean
  autoFocus?: boolean
  type?: string
  inputMode?: 'decimal' | 'text'
  maxLength?: number
  placeholder?: string
  autoComplete?: string
  autoCapitalize?: string
}) {
  const id = fieldDomId(formId, field)
  const error = errors.find((e) => e.field === field)
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ')
  return (
    <div className="field gym-field">
      <label htmlFor={id}>
        {label}
        {optional && <span className="field-label-optional"> (optional)</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        data-autofocus={autoFocus ? '' : undefined}
        {...input}
      />
      {hint && (
        <span id={`${id}-hint`} className="gym-field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="gym-field-error">
          {error.message}
        </span>
      )}
    </div>
  )
}

type RowProps<T> = {
  formId: string
  list: DraftListKey
  row: T
  index: number
  errors: FieldError[]
  onChange: (next: T) => void
  onRemove: () => void
}

function RowShell({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) {
  return (
    <fieldset className="gym-form-row">
      <legend>{title}</legend>
      <div className="gym-form-grid">{children}</div>
      <button type="button" className="btn btn-ghost gym-form-remove" onClick={onRemove}>
        Remove {title.toLowerCase()}
      </button>
    </fieldset>
  )
}

function HoursRow({ formId, row, index, errors, onChange, onRemove }: RowProps<HoursDraft>) {
  const f = (name: string) => `hours:${row.key}:${name}`
  const set = (patch: Partial<HoursDraft>) => onChange({ ...row, ...patch })
  return (
    <RowShell title={`Hours row ${index + 1}`} onRemove={onRemove}>
      <GymTextField formId={formId} errors={errors} field={f('label')} label="Days" placeholder="e.g. Every day" value={row.label} onChange={(v) => set({ label: v })} />
      <GymTextField formId={formId} errors={errors} field={f('opens_at')} label="Opens" type="time" value={row.opens_at} onChange={(v) => set({ opens_at: v })} />
      <GymTextField formId={formId} errors={errors} field={f('closes_at')} label="Closes" type="time" value={row.closes_at} onChange={(v) => set({ closes_at: v })} />
      <GymTextField formId={formId} errors={errors} field={f('note')} label="Note" optional value={row.note} onChange={(v) => set({ note: v })} />
    </RowShell>
  )
}

function PriceRow({ formId, list, row, index, errors, onChange, onRemove }: RowProps<PriceDraft>) {
  const f = (name: string) => `${list}:${row.key}:${name}`
  const set = (patch: Partial<PriceDraft>) => onChange({ ...row, ...patch })
  return (
    <RowShell title={`${list === 'admission' ? 'Admission' : 'Rental'} row ${index + 1}`} onRemove={onRemove}>
      <GymTextField formId={formId} errors={errors} field={f('label')} label="Item" placeholder={list === 'admission' ? 'e.g. Day pass' : 'e.g. Shoe rental'} value={row.label} onChange={(v) => set({ label: v })} />
      <GymTextField formId={formId} errors={errors} field={f('amount')} label="Price" inputMode="decimal" placeholder="e.g. 380" value={row.amount} onChange={(v) => set({ amount: v })} />
      <GymTextField formId={formId} errors={errors} field={f('currency')} label="Currency" maxLength={3} autoCapitalize="characters" value={row.currency} onChange={(v) => set({ currency: v.toUpperCase() })} />
      <GymTextField formId={formId} errors={errors} field={f('conditions')} label="Conditions" optional value={row.conditions} onChange={(v) => set({ conditions: v })} />
    </RowShell>
  )
}

function GradeRow({ formId, row, index, errors, onChange, onRemove }: RowProps<GradeDraft>) {
  const f = (name: string) => `grade_legend:${row.key}:${name}`
  const set = (patch: Partial<GradeDraft>) => onChange({ ...row, ...patch })
  return (
    <RowShell title={`Grade colour row ${index + 1}`} onRemove={onRemove}>
      <GymTextField formId={formId} errors={errors} field={f('grade')} label="Grade" placeholder="e.g. V0" value={row.grade} onChange={(v) => set({ grade: v })} />
      <GymTextField formId={formId} errors={errors} field={f('color_name')} label="Colour name" placeholder="e.g. White" value={row.color_name} onChange={(v) => set({ color_name: v })} />
      <GymTextField formId={formId} errors={errors} field={f('color_hex')} label="Colour code" optional placeholder="#RRGGBB" maxLength={7} value={row.color_hex} onChange={(v) => set({ color_hex: v })} />
    </RowShell>
  )
}

function ListSection<T extends { key: string }>({
  formId,
  list,
  title,
  addLabel,
  rows,
  make,
  errors,
  onRows,
  Row,
}: {
  formId: string
  list: DraftListKey
  title: string
  addLabel: string
  rows: T[]
  make: () => T
  errors: FieldError[]
  onRows: (rows: T[]) => void
  Row: (props: RowProps<T>) => ReactNode
}) {
  const addField = `${list}:add`
  const addError = errors.find((e) => e.field === addField)
  const add = () => {
    const row = make()
    onRows([...rows, row])
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[id^="${CSS.escape(fieldDomId(formId, `${list}:${row.key}:`))}"]`)?.focus()
    })
  }
  return (
    <section className="gym-form-section">
      <h4>{title}</h4>
      {rows.map((row, i) => (
        <Row
          key={row.key}
          formId={formId}
          list={list}
          row={row}
          index={i}
          errors={errors}
          onChange={(next) => onRows(rows.map((r) => (r.key === row.key ? next : r)))}
          onRemove={() => {
            onRows(rows.filter((r) => r.key !== row.key))
            requestAnimationFrame(() => document.getElementById(fieldDomId(formId, addField))?.focus())
          }}
        />
      ))}
      <button
        type="button"
        id={fieldDomId(formId, addField)}
        className="btn btn-ghost gym-form-add"
        onClick={add}
        aria-describedby={addError ? `${fieldDomId(formId, addField)}-error` : undefined}
      >
        <Icon name="plus" size={14} /> {addLabel}
      </button>
      {addError && (
        <span id={`${fieldDomId(formId, addField)}-error`} className="gym-field-error">
          {addError.message}
        </span>
      )}
    </section>
  )
}

/** Posted visit info editor. Leave every row empty when the info is unknown. */
export function GymVisitForm({
  formId,
  draft,
  errors,
  onChange,
}: {
  formId: string
  draft: VisitInfoDraft
  errors: FieldError[]
  onChange: (next: VisitInfoDraft) => void
}) {
  const priceSection = (list: PriceListKey, title: string, addLabel: string) => (
    <ListSection<PriceDraft>
      formId={formId}
      list={list}
      title={title}
      addLabel={addLabel}
      rows={draft[list]}
      make={emptyPriceDraft}
      errors={errors}
      onRows={(rows) => onChange({ ...draft, [list]: rows })}
      Row={PriceRow}
    />
  )
  return (
    <div className="gym-visit-form">
      <p className="gym-field-hint">
        Only enter what the gym has posted. Leave a section empty if you don't know it. Prices are in the posted currency.
      </p>
      <ListSection<HoursDraft>
        formId={formId}
        list="hours"
        title="Hours"
        addLabel="Add hours"
        rows={draft.hours}
        make={emptyHoursDraft}
        errors={errors}
        onRows={(rows) => onChange({ ...draft, hours: rows })}
        Row={HoursRow}
      />
      {priceSection('admission', 'Admission', 'Add admission price')}
      {priceSection('rentals', 'Rentals', 'Add rental price')}
      <ListSection<GradeDraft>
        formId={formId}
        list="grade_legend"
        title="Grade colours"
        addLabel="Add grade colour"
        rows={draft.grade_legend}
        make={emptyGradeDraft}
        errors={errors}
        onRows={(rows) => onChange({ ...draft, grade_legend: rows })}
        Row={GradeRow}
      />
      <section className="gym-form-section">
        <h4>Source</h4>
        <p className="gym-field-hint">Source: posted sign at the gym.</p>
        <div className="gym-form-grid">
          <GymTextField
            formId={formId}
            errors={errors}
            field="provenance:verified_at"
            label="Date you checked the sign"
            optional
            type="date"
            value={draft.verified_at}
            onChange={(v) => onChange({ ...draft, verified_at: v })}
          />
          <GymTextField
            formId={formId}
            errors={errors}
            field="provenance:note"
            label="Source note"
            optional
            value={draft.provenance_note}
            onChange={(v) => onChange({ ...draft, provenance_note: v })}
          />
        </div>
      </section>
    </div>
  )
}
