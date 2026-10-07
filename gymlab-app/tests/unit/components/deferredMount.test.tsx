// F103/T7: el montaje diferido agenda los hosts después del primer paint.
// Usa requestIdleCallback con timeout acotado y cae a setTimeout cuando no
// existe (Safari), sin tocar el DOM al importar (seguro en SSR y tests).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  DeferredMount,
  DeferredMountView,
  createFirstPaintGate,
  scheduleAfterFirstPaint,
} from '@/components/layout/DeferredMount'

describe('scheduleAfterFirstPaint', () => {
  it('usa requestIdleCallback con timeout cuando está disponible', () => {
    let idleCallback: (() => void) | undefined
    let seenOptions: { timeout: number } | undefined
    const cancelIdleCallback = vi.fn()
    const scheduler = {
      requestIdleCallback: (callback: () => void, options?: { timeout: number }) => {
        idleCallback = callback
        seenOptions = options
        return 7
      },
      cancelIdleCallback,
      setTimeout: vi.fn(() => 1),
      clearTimeout: vi.fn(),
    }
    const mount = vi.fn()

    scheduleAfterFirstPaint(mount, scheduler)

    expect(idleCallback).toBeDefined()
    expect(seenOptions?.timeout).toBeGreaterThan(0)
    expect(mount).not.toHaveBeenCalled()
    idleCallback?.()
    expect(mount).toHaveBeenCalledTimes(1)
  })

  it('cae a setTimeout cuando requestIdleCallback no existe y el cleanup lo cancela', () => {
    let timeoutCallback: (() => void) | undefined
    const clearTimeout = vi.fn()
    const scheduler = {
      setTimeout: (callback: () => void) => {
        timeoutCallback = callback
        return 3
      },
      clearTimeout,
    }
    const mount = vi.fn()

    const cancel = scheduleAfterFirstPaint(mount, scheduler)
    expect(timeoutCallback).toBeDefined()
    expect(mount).not.toHaveBeenCalled()

    cancel()
    expect(clearTimeout).toHaveBeenCalledWith(3)
    expect(mount).not.toHaveBeenCalled()
  })
})

describe('createFirstPaintGate', () => {
  it('no queda montado hasta que dispara el idle; el callback lo enciende una vez', () => {
    let idle: (() => void) | undefined
    const cancel = vi.fn()
    const gate = createFirstPaintGate((callback) => {
      idle = callback
      return cancel
    })
    const listener = vi.fn()

    const unsubscribe = gate.subscribe(listener)
    expect(gate.getSnapshot()).toBe(false)
    expect(listener).not.toHaveBeenCalled()

    // «Tras el idle»: el callback del scheduler es lo único que enciende el gate.
    idle?.()
    expect(gate.getSnapshot()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('el cleanup antes del idle cancela el agendado (StrictMode)', () => {
    const cancel = vi.fn()
    const gate = createFirstPaintGate(() => cancel)

    const unsubscribe = gate.subscribe(() => {})
    unsubscribe()

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(gate.getSnapshot()).toBe(false)
  })
})

// Sin jsdom no hay renderer DOM: se cubre el efecto observable del gate — con el
// estado del idle encendido, la vista monta los children (y sin él, no los monta).
describe('DeferredMountView (children tras el idle)', () => {
  it('sin montar no renderiza children', () => {
    const html = renderToStaticMarkup(
      <DeferredMountView mounted={false}>
        <span>host</span>
      </DeferredMountView>,
    )
    expect(html).toBe('')
  })

  it('con el gate encendido renderiza children', () => {
    const html = renderToStaticMarkup(
      <DeferredMountView mounted>
        <span>host</span>
      </DeferredMountView>,
    )
    expect(html).toContain('<span>host</span>')
  })
})

describe('DeferredMount', () => {
  it('en SSR no renderiza children: el efecto de montaje no corre sin DOM', () => {
    const html = renderToStaticMarkup(
      <DeferredMount>
        <span>host</span>
      </DeferredMount>,
    )
    expect(html).toBe('')
  })
})
