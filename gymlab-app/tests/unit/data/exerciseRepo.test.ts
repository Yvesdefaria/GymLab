// Test del repo Dexie de ejercicios: getByIds consulta en lote (un solo anyOf) y
// devuelve [] con ids vacíos sin tocar la tabla (contrato de la búsqueda por lotes).
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Tabla fake con trazado de consultas: replica where('id').anyOf().toArray() de Dexie.
const dbMock = vi.hoisted(() => {
  const state = {
    rows: [] as { id: number; slug: string }[],
    anyOfCalls: [] as number[][],
  }
  return {
    state,
    db: {
      exercises: {
        where: () => ({
          anyOf: (ids: number[]) => {
            state.anyOfCalls.push(ids)
            return {
              toArray: async () => state.rows.filter((e) => ids.includes(e.id)),
            }
          },
        }),
      },
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))

const { exerciseRepo } = await import('@/data/repositories/dexie/exerciseRepo')

describe('exerciseRepo.getByIds', () => {
  beforeEach(() => {
    dbMock.state.rows = []
    dbMock.state.anyOfCalls = []
  })

  it('consulta en lote (un solo anyOf) y devuelve los ejercicios encontrados', async () => {
    dbMock.state.rows = [
      { id: 1, slug: 'press-banca' },
      { id: 3, slug: 'sentadilla' },
      { id: 5, slug: 'peso-muerto' },
    ]
    const result = await exerciseRepo.getByIds([5, 3])
    // Un solo anyOf con los ids pedidos (no un GET por id).
    expect(dbMock.state.anyOfCalls).toEqual([[5, 3]])
    expect(result.map((e) => e.id).sort()).toEqual([3, 5])
  })

  it('ids vacíos → [] sin consultar la tabla', async () => {
    const result = await exerciseRepo.getByIds([])
    expect(result).toEqual([])
    expect(dbMock.state.anyOfCalls).toEqual([])
  })
})