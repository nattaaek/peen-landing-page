import { useEffect, useRef, useState } from 'react'
import type { PassportPage } from '../../lib/passport'
import type { PassportRenderer } from './passportRenderer'
export function PassportScene({ page, onPocket, onOpen }: Readonly<{
  page: PassportPage
  onPocket: (index: number) => void
  onOpen: () => void
}>) {
  const host = useRef<HTMLDivElement>(null)
  const renderer = useRef<PassportRenderer | null>(null)
  const callbacks = useRef({ onPocket, onOpen })
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  useEffect(() => { callbacks.current = { onPocket, onOpen } }, [onPocket, onOpen])
  useEffect(() => {
    let disposed = false
    let instance: PassportRenderer | null = null
    const element = host.current
    const failed = () => setState('failed')
    element?.addEventListener('passport-context-lost', failed)
    import('./passportRenderer').then(async module => {
      if (!host.current || disposed) return
      instance = await module.createPassportRenderer(host.current, index => callbacks.current.onPocket(index), () => callbacks.current.onOpen())
      if (disposed) { instance.dispose(); return }
      renderer.current = instance; setState('ready')
    }).catch(() => { if (!disposed) setState('failed') })
    return () => { disposed = true; element?.removeEventListener('passport-context-lost', failed); instance?.dispose(); renderer.current = null }
  }, [])
  useEffect(() => { if (state === 'ready') renderer.current?.setPage(page) }, [page, state])
  return <div className="passport-stage" data-state={state}>
    <div ref={host} className="passport-canvas" aria-hidden="true" />
    {state === 'loading' && <p className="passport-stage-status" role="status">Preparing your passport…</p>}
    {state === 'failed' && <div className="passport-stage-status" role="alert"><img src={`${import.meta.env.BASE_URL}passport/cover.png`} alt="Poda Best routes ever passport cover" /><p>3D could not load. Your routes are still available in Static collection.</p></div>}
    {state === 'ready' && <p className="passport-stage-caption">{page === 'cover' ? 'Open your passport to explore the pockets.' : 'Physical patch previews · select a pocket or a grade below.'}</p>}
  </div>
}
