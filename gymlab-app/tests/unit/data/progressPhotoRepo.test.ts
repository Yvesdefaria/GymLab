// Test del conteo liviano del repo de fotos (F120/PH-1): el proveedor global solo
// necesita el número de fotos para la medida progressPhotoCount; `count()` usa el
// count() indexado de Dexie y no materializa las data URLs de la tabla.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => {
  const state = {
    count: 0,
    countCalls: 0,
    toArrayCalls: 0,
  }
  return {
    state,
    db: {
      progressPhotos: {
        count: async () => {
          state.countCalls += 1
          return state.count
        },
        toArray: async () => {
          state.toArrayCalls += 1
          return []
        },
      },
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))
vi.mock('@/data/repositories/dexie/base', () => ({
  nextId: vi.fn(async () => 100),
}))

const { progressPhotoRepo } = await import('@/data/repositories/dexie/progressPhotoRepo')

describe('progressPhotoRepo.count (F120/PH-1)', () => {
  beforeEach(() => {
    dbMock.state.count = 0
    dbMock.state.countCalls = 0
    dbMock.state.toArrayCalls = 0
  })

  it('devuelve el conteo con el count() de Dexie, sin materializar filas', async () => {
    dbMock.state.count = 3

    await expect(progressPhotoRepo.count()).resolves.toBe(3)
    expect(dbMock.state.countCalls).toBe(1)
    expect(dbMock.state.toArrayCalls).toBe(0)
  })
})
