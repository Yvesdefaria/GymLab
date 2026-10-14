import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  handleLinkContextMenu,
  initSuppressLinkLongPress,
} from '@/lib/suppressLinkLongPress'

// Evento fake casteado: el entorno de tests es node, no hay DOM real.
// `pointerType`/`button` solo se agregan cuando el test los pasa: los eventos sin él cubren el fallback.
const makeContextMenuEvent = (insideLink: boolean, pointerType?: string, button?: number) => {
  const preventDefault = vi.fn()
  const event = {
    target: {
      closest: (sel: string) => (insideLink && sel === 'a' ? {} : null),
    },
    preventDefault,
    ...(pointerType === undefined ? {} : { pointerType }),
    ...(button === undefined ? {} : { button }),
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

  it('con puntero mouse NO cancela aunque la media query diga coarse (clic derecho intacto)', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
    const { event, preventDefault } = makeContextMenuEvent(true, 'mouse')
    handleLinkContextMenu(event)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('con puntero touch SÍ cancela aunque la media query diga fino (híbridos con pantalla táctil)', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    const { event, preventDefault } = makeContextMenuEvent(true, 'touch')
    handleLinkContextMenu(event)
    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  it('con puntero pen y botón primario (punta) SÍ cancela aunque la media query diga fino', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    const { event, preventDefault } = makeContextMenuEvent(true, 'pen', 0)
    handleLinkContextMenu(event)
    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  // lote 30 (R3-002): el botón secundario del lápiz (contextmenu real, button 2) conserva
  // su menú nativo — solo el long-press con la punta (button 0) se cancela.
  it('con puntero pen y botón secundario NO cancela (el menú del lápiz queda intacto)', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    const { event, preventDefault } = makeContextMenuEvent(true, 'pen', 2)
    handleLinkContextMenu(event)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  // lote 31 (R3-001 del review del lote 30): un `pen` SIN `button` (evento sintético o
  // entorno viejo — el hardware real siempre lo trae) se comporta como la punta y cancela:
  // restaura el baseline (todo pen se suprimía) en vez de flipear en silencio.
  it('con puntero pen sin button (sintético/viejo) SÍ cancela (baseline preservado)', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    const { event, preventDefault } = makeContextMenuEvent(true, 'pen')
    handleLinkContextMenu(event)
    expect(preventDefault).toHaveBeenCalledTimes(1)
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
