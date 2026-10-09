// Test de la orquestación del import CSV: el seed se espera ANTES de leer el
// texto y el catálogo (R3-001), y el catálogo leído resuelve los exerciseId
// reales del archivo (sin depender de Dexie).
import { describe, expect, it, vi } from 'vitest'
import type { Exercise } from '@/domain/types'

// El módulo usa la fachada de repos en su dep por defecto: se mockea para no
// tocar Dexie (todos los casos inyectan sus propias dependencias).
vi.mock('@/data/repositories', () => ({ exerciseRepo: { getAll: async () => [] } }))

const { prepareCsvImport } = await import('@/data/importCsv')

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

// Formato Strong (mismo header que importParsers.test.ts).
const CSV = [
  'Date,Exercise Name,Weight,Reps,Completed',
  '2024-01-02,Press de pecho con barra,60,10,Yes',
].join('\n')

const exercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 1,
  slug: 'press-de-pecho-con-barra',
  name: 'Press de pecho con barra',
  muscleGroup: 'pecho',
  equipment: ['barra', 'banco'],
  instructions: '',
  ...overrides,
})

describe('prepareCsvImport', () => {
  it('espera a que el seed termine antes de leer el texto y el catálogo', async () => {
    const seed = deferred<void>()
    const calls: string[] = []
    const pending = prepareCsvImport(
      { text: async () => { calls.push('text'); return CSV } },
      () => { calls.push('seed'); return seed.promise },
      { getAllExercises: async () => { calls.push('catalog'); return [] } }
    )

    // Con el seed en vuelo todavía no se tocó ni el archivo ni el catálogo.
    await Promise.resolve()
    expect(calls).toEqual(['seed'])

    seed.resolve()
    await pending
    expect(calls).toEqual(['seed', 'text', 'catalog'])
  })

  it('propaga el rechazo del seed sin leer el texto ni el catálogo', async () => {
    const calls: string[] = []
    await expect(
      prepareCsvImport(
        { text: async () => { calls.push('text'); return CSV } },
        async () => { calls.push('seed'); throw new Error('seed caído') },
        { getAllExercises: async () => { calls.push('catalog'); return [] } }
      )
    ).rejects.toThrow('seed caído')
    expect(calls).toEqual(['seed'])
  })

  it('parsea el CSV resolviendo los ejercicios contra el catálogo leído', async () => {
    const catalog = [exercise({ id: 42 })]
    const result = await prepareCsvImport(
      { text: async () => CSV },
      async () => {},
      { getAllExercises: async () => catalog }
    )

    expect(result.errors).toEqual([])
    expect(result.workouts).toHaveLength(1)
    expect(result.sets).toHaveLength(1)
    // El id real del catálogo (42), no el placeholder del hashCode.
    expect(result.sets[0].exerciseId).toBe(42)
    expect(result.unmatched).toEqual([])
  })
})
