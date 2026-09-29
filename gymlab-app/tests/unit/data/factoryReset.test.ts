// Reset de fábrica (F112, 112.1): orden congelado (D4), las 28 tablas reales del
// schema, claves exactas de storage y comportamiento ante fallos. Deps dobles;
// del `db` real solo se lee `db.tables` (no requiere IndexedDB).
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Los stores persisten al cargar el módulo: en node hace falta un localStorage
// en memoria ANTES de importar factoryReset.ts (patrón activeWorkoutStore.test.ts).
const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value)
  },
  removeItem: (key: string) => {
    memory.delete(key)
  },
  clear: () => {
    memory.clear()
  },
})

import type { FactoryResetDeps } from '@/data/factoryReset'

const { db } = await import('@/data/repositories/dexie/db')
const {
  performFactoryReset,
  RESET_LOCAL_STORAGE_KEYS,
  RESET_NOTIFICATION_IDS,
  RESET_SESSION_STORAGE_KEYS,
} = await import('@/data/factoryReset')

// Las 28 tablas del schema Dexie en orden de declaración (db.ts v13).
const EXPECTED_TABLES = [
  'exercises',
  'routines',
  'routineDays',
  'routineItems',
  'workouts',
  'workoutSets',
  'papers',
  'guides',
  'profile',
  'activeProgram',
  'prs',
  'meta',
  'socialProfiles',
  'posts',
  'postMedia',
  'bodyWeight',
  'dailySteps',
  'exerciseNotes',
  'bodyMeasurements',
  'skinfolds',
  'sessionJournals',
  'benchmarkResults',
  'foods',
  'mealEntries',
  'supplements',
  'progressPhotos',
  'workoutTemplates',
  'periodizationPlans',
]

const makeHarness = () => {
  const events: string[] = []
  const cleared: string[] = []
  let inTransaction = false
  const tables = EXPECTED_TABLES.map((name) => ({
    name,
    clear: async () => {
      // Toda limpieza debe ocurrir dentro de la transacción única.
      if (!inTransaction) events.push(`clear-outside-transaction:${name}`)
      cleared.push(name)
    },
  }))
  const deps: FactoryResetDeps = {
    cancelNotifications: async (ids) => {
      events.push(`notifications:${ids.join(',')}`)
    },
    resetStores: () => events.push('stores'),
    transaction: async (scope) => {
      events.push('transaction:begin')
      inTransaction = true
      try {
        await scope()
      } finally {
        inTransaction = false
      }
      events.push('transaction:end')
    },
    getTables: () => tables,
    clearStorage: () => events.push('storage'),
    reload: () => events.push('reload'),
  }
  return { deps, events, cleared }
}

describe('performFactoryReset', () => {
  beforeEach(() => {
    memory.clear()
  })

  it('ejecuta el wipe en el orden congelado (D4)', async () => {
    const h = makeHarness()
    await performFactoryReset(h.deps)
    expect(h.events).toEqual([
      'notifications:9601,9602,9603,9604',
      'stores',
      'transaction:begin',
      'transaction:end',
      'storage',
      'reload',
    ])
  })

  it('limpia dentro de una única transacción las 28 tablas reales de Dexie', async () => {
    const h = makeHarness()
    await performFactoryReset(h.deps)
    // La verdad de runtime: db.tables (nunca ALL_TABLES, que es del backup).
    expect(db.tables.map((t) => t.name).sort()).toEqual([...EXPECTED_TABLES].sort())
    expect(h.cleared.slice().sort()).toEqual([...EXPECTED_TABLES].sort())
    expect(h.events.filter((e) => e.startsWith('clear-outside-transaction'))).toEqual([])
  })

  it('usa los ids de notificación y las claves de storage exactas', async () => {
    const h = makeHarness()
    await performFactoryReset(h.deps)
    expect(RESET_NOTIFICATION_IDS).toEqual([9601, 9602, 9603, 9604])
    expect(RESET_LOCAL_STORAGE_KEYS).toEqual([
      'gymLab-activeWorkout',
      'gymlab-goals',
      'gymlab-equipment',
      'gymlab.theme',
      'gymlab.palette',
      'gymlab.recentCalculators',
      'gymlab-pending-photo-angle',
    ])
    expect(RESET_SESSION_STORAGE_KEYS).toEqual(['gymLab-preloadReload'])
  })

  it('si la transacción falla no limpia storage ni recarga (reintentable)', async () => {
    const h = makeHarness()
    h.deps.transaction = async () => {
      throw new Error('boom')
    }
    await expect(performFactoryReset(h.deps)).rejects.toThrow('boom')
    expect(h.events).not.toContain('storage')
    expect(h.events).not.toContain('reload')
  })

  it('si cancelar notificaciones falla no toca la DB (aborta antes)', async () => {
    const h = makeHarness()
    h.deps.cancelNotifications = async () => {
      throw new Error('sin permiso')
    }
    await expect(performFactoryReset(h.deps)).rejects.toThrow('sin permiso')
    expect(h.events).not.toContain('stores')
    expect(h.events).not.toContain('transaction:begin')
  })
})
