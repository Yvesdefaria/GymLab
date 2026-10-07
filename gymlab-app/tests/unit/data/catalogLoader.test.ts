// Fallback embebido del catálogo (F103/T3-R3-002): si el import dinámico del
// seed masivo también falla, loadCatalog no debe rechazar — el seed continúa
// con el catálogo base en vez de romper el arranque completo.
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/seed/exercisesExtra', () => {
  throw new Error('chunk del fallback inaccesible')
})

const { loadCatalog } = await import('@/data/catalogLoader')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadCatalog — fallback embebido inaccesible', () => {
  it('con el remoto caído y el chunk embebido rechazando, resuelve [] sin romper', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(loadCatalog()).resolves.toEqual([])

    // El fallo queda visible en logs (no se traga en silencio).
    expect(errorSpy).toHaveBeenCalled()
  })
})
