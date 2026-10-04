import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  handleLinkContextMenu,
  initSuppressLinkLongPress,
} from '@/lib/suppressLinkLongPress'

// Evento fake casteado: el entorno de tests es node, no hay DOM real.
const makeContextMenuEvent = (insideLink: boolean) => {
  const preventDefault = vi.fn()
  const event = {
    target: {
      closest: (sel: string) => (insideLink && sel === 'a' ? {} : null),
    },
    preventDefault,
  } as unknown as MouseEvent
  return { event, preventDefault }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('handleLinkContextMenu — supresión del menú nativo de links', () => {
  it('en táctil cancela el contextmenu cuando el target está dentro de un link', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
    const { event, preventDefault } = makeContextMenuEvent(true)
    handleLinkContextMenu(event)
    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  it('en táctil NO cancela nada si el target está fuera de un link', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
    const { event, preventDefault } = makeContextMenuEvent(false)
    handleLinkContextMenu(event)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('NO cancela con puntero fino (desktop): el clic derecho queda intacto', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    const { event, preventDefault } = makeContextMenuEvent(true)
    handleLinkContextMenu(event)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('sin matchMedia disponible NO cancela', () => {
    vi.stubGlobal('window', {})
    const { event, preventDefault } = makeContextMenuEvent(true)
    handleLinkContextMenu(event)
    expect(preventDefault).not.toHaveBeenCalled()
  })
})

describe('initSuppressLinkLongPress — registro idempotente', () => {
  it('registra el listener contextmenu una sola vez aunque se llame dos veces', () => {
    const addEventListener = vi.fn()
    vi.stubGlobal('document', { addEventListener })
    initSuppressLinkLongPress()
    initSuppressLinkLongPress()
    expect(addEventListener).toHaveBeenCalledTimes(1)
    expect(addEventListener).toHaveBeenCalledWith('contextmenu', handleLinkContextMenu)
  })
})
