// F103/T7: el montaje diferido agenda los hosts después del primer paint.
// Usa requestIdleCallback con timeout acotado y cae a setTimeout cuando no
// existe (Safari), sin tocar el DOM al importar (seguro en SSR y tests).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DeferredMount, scheduleAfterFirstPaint } from '@/components/layout/DeferredMount'

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
