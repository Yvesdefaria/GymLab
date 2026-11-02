import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  registerBackHandler,
  resetBackHandlers,
  runBackHandlers,
} from '@/lib/backHandlers'

afterEach(() => {
  resetBackHandlers()
})

describe('runBackHandlers — pila LIFO del botón back', () => {
  it('sin handlers registrados no consume el back', () => {
    expect(runBackHandlers()).toBe(false)
  })

  it('el último handler registrado corre primero y consume el evento', () => {
    const order: string[] = []
    registerBackHandler(() => {
      order.push('sesion')
      return false
    })
    registerBackHandler(() => {
      order.push('overlay')
      return true
    })

    expect(runBackHandlers()).toBe(true)
    expect(order).toEqual(['overlay'])
  })

  it('un handler que devuelve false cede el turno al anterior', () => {
    const order: string[] = []
    registerBackHandler(() => {
      order.push('sesion')
      return true
    })
    registerBackHandler(() => {
      order.push('overlay-inactivo')
      return false
    })

    expect(runBackHandlers()).toBe(true)
    expect(order).toEqual(['overlay-inactivo', 'sesion'])
  })

  it('desregistrar quita solo ese handler y respeta a los demás', () => {
    const keep = vi.fn(() => true)
    const unregister = registerBackHandler(keep)
    const detach = registerBackHandler(() => false)

    detach()
    detach()
    expect(runBackHandlers()).toBe(true)
    expect(keep).toHaveBeenCalledTimes(1)

    unregister()
    expect(runBackHandlers()).toBe(false)
  })

  it('un handler que se desregistra durante la ejecución no rompe el recorrido', () => {
    const outer = vi.fn(() => true)
    registerBackHandler(outer)

    const unregisterSelf = registerBackHandler(() => {
      unregisterSelf()
      return false
    })

    expect(runBackHandlers()).toBe(true)
    expect(outer).toHaveBeenCalledTimes(1)
    expect(runBackHandlers()).toBe(true)
  })
})
