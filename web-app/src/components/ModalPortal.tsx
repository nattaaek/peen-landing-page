import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'

/** Render modals on `document.body`, centered in the viewport above slideovers. */
export function ModalPortal({ children }: { children: ReactNode }) {
  useScrollLock(true)

  return createPortal(
    <div className="modal-overlay-root" role="presentation">
      {children}
    </div>,
    document.body,
  )
}
