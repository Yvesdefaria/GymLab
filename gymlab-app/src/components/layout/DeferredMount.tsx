// F103/T7: montaje diferido compartido para hosts que no necesitan el primer paint.
// Agenda el mount al primer idle (con timeout acotado) y cae a setTimeout en
// navegadores sin requestIdleCallback (Safari). Sin window/efectos en SSR.
import { useEffect, useState, type ReactNode } from 'react'

export interface IdleScheduler {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
  setTimeout: (callback: () => void, ms: number) => number
  clearTimeout: (handle: number) => void
}

// Tope del idle: si el hilo está ocupado, montamos igual pasado este tiempo.
export const IDLE_TIMEOUT_MS = 1500
// Fallback sin requestIdleCallback: un tick después del paint alcanza.
export const FALLBACK_DELAY_MS = 200

export const scheduleAfterFirstPaint = (
  callback: () => void,
  scheduler: IdleScheduler = globalThis,
): (() => void) => {
  if (typeof scheduler.requestIdleCallback === 'function') {
    const handle = scheduler.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS })
    return () => scheduler.cancelIdleCallback?.(handle)
  }
  const handle = scheduler.setTimeout(callback, FALLBACK_DELAY_MS)
  return () => scheduler.clearTimeout(handle)
}

export const DeferredMount = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (mounted) return
    return scheduleAfterFirstPaint(() => setMounted(true))
  }, [mounted])

  return mounted ? <>{children}</> : null
}
