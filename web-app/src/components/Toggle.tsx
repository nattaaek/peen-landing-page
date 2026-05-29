export function Toggle({
  value,
  onChange,
  ariaLabel,
}: {
  value: boolean
  onChange: (next: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      className={`toggle-switch ${value ? 'on' : ''}`}
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      onClick={() => onChange(!value)}
    >
      <span className="knob" />
    </button>
  )
}
