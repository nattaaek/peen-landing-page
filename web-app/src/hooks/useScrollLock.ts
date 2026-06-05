import { useEffect } from 'react'

type ScrollSnapshot = {
  scrollY: number
  htmlOverflow: string
  bodyOverflow: string
  bodyPosition: string
  bodyTop: string
  bodyWidth: string
}

let lockCount = 0
let snapshot: ScrollSnapshot | null = null

function applyScrollLock() {
  if (lockCount === 0) {
    const scrollY = window.scrollY
    snapshot = {
      scrollY,
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
    }
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
  }
  lockCount += 1
}

function releaseScrollLock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount !== 0 || !snapshot) return
  const saved = snapshot
  snapshot = null
  document.documentElement.style.overflow = saved.htmlOverflow
  document.body.style.overflow = saved.bodyOverflow
  document.body.style.position = saved.bodyPosition
  document.body.style.top = saved.bodyTop
  document.body.style.width = saved.bodyWidth
  window.scrollTo(0, saved.scrollY)
}

/** Prevent page scroll while overlays/modals are open (ref-counted). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    applyScrollLock()
    return releaseScrollLock
  }, [active])
}
