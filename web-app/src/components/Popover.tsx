import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export function Popover({
  children,
  anchor = 'right',
  top = 40,
}: {
  children: ReactNode
  anchor?: 'left' | 'right'
  top?: number
}) {
  const side = anchor === 'left' ? { left: 0 } : { right: 0 }
  return (
    <div
      className="menu-popover"
      style={{ position: 'absolute', top, minWidth: 200, ...side }}
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
