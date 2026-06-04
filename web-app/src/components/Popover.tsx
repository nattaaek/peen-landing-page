import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export function Popover({
  children,
  anchor = 'right',
  top = 40,
  placement = 'below',
}: {
  children: ReactNode
  anchor?: 'left' | 'right'
  top?: number
  /** `above` avoids clipping under feed action bars (card overflow + next card stack). */
  placement?: 'below' | 'above'
}) {
  const side = anchor === 'left' ? { left: 0 } : { right: 0 }
  const position =
    placement === 'above'
      ? { bottom: `calc(100% + 6px)`, top: 'auto' as const }
      : { top, bottom: 'auto' as const }
  return (
    <div
      className={`menu-popover${placement === 'above' ? ' menu-popover-above' : ''}`}
      style={{ position: 'absolute', minWidth: 200, ...side, ...position }}
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      {children}
    </div>
  )
}

export function PopItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: IconName
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button type="button" className={`pop-menu-item ${danger ? 'danger' : ''}`} onClick={onClick} role="menuitem">
      <Icon name={icon} size={16} />
      {label}
    </button>
  )
}

export function PopDivider() {
  return <div className="pop-menu-divider" role="separator" />
}
