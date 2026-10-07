// F103/T7: montaje diferido compartido para hosts que no necesitan el primer paint.
// Agenda el mount al primer idle (con timeout acotado) y cae a setTimeout en
// navegadores sin requestIdleCallback (Safari). Sin window/efectos en SSR.
// F120/W6-R3-003: el gate vive en un controlador puro (sin DOM) y la vista que
// consume el estado queda separada, para poder cubrir «children tras el idle»
// en el entorno node del repo (sin jsdom).
import { useState, useSyncExternalStore, type ReactNode } from 'react'

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

export interface FirstPaintGate {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => boolean
}

// Controlador del gate: enciende el mount UNA sola vez cuando dispara el
// scheduler y avisa a los suscriptores; el cleanup previo al idle cancela (el
// doble efecto de StrictMode monta/desmonta antes de que llegue el idle).
export const createFirstPaintGate = (
  schedule: (callback: () => void) => () => void = (callback) =>
    scheduleAfterFirstPaint(callback),
): FirstPaintGate => {
  let mounted = false
  let cancel: (() => void) | null = null
  const listeners = new Set<() => void>()

  return {
    subscribe: (listener) => {
      listeners.add(listener)
      if (!mounted && !cancel) {
        cancel = schedule(() => {
          cancel = null
          mounted = true
          for (const current of [...listeners]) current()
        })
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && !mounted) {
          cancel?.()
          cancel = null
        }
      }
    },
    getSnapshot: () => mounted,
  }
}

// Vista pura: children recién cuando el idle encendió `mounted`.
export const DeferredMountView = ({
  mounted,
  children,
}: {
  mounted: boolean
  children: ReactNode
}) => (mounted ? <>{children}</> : null)

export const DeferredMount = ({ children }: { children: ReactNode }) => {
  const [gate] = useState(createFirstPaintGate)
  const mounted = useSyncExternalStore(gate.subscribe, gate.getSnapshot, () => false)

  return <DeferredMountView mounted={mounted}>{children}</DeferredMountView>
}
