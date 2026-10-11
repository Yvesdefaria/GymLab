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

// Stores dobles para ejercitar los defaultDeps reales sin arrastrar el grafo de
// los stores reales (persist + localStorage) al test.
const storeSpies = vi.hoisted(() => ({
  activeReset: vi.fn(),
  persistClearStorage: vi.fn(),
  equipmentClear: vi.fn(),
  goalReset: vi.fn(),
}))
vi.mock('@/store/activeWorkoutStore', () => ({
  useActiveWorkoutStore: {
    getState: () => ({ reset: storeSpies.activeReset }),
    persist: { clearStorage: storeSpies.persistClearStorage },
  },
}))
vi.mock('@/store/equipmentStore', () => ({
  useEquipmentStore: { getState: () => ({ clear: storeSpies.equipmentClear }) },
}))
vi.mock('@/store/goalStore', () => ({
  useGoalStore: { getState: () => ({ reset: storeSpies.goalReset }) },
}))

// Backend de notificaciones controlable (R3-NOTIFY-BACKEND): el dep default debe
// ser best-effort total, incluso si el módulo del backend rechaza al adquirirse.
const notificationsBackend = vi.hoisted(() => ({
  getBackend: vi.fn(),
}))
vi.mock('@/data/localNotificationsBackend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/localNotificationsBackend')>()),
  getLocalNotificationsBackend: notificationsBackend.getBackend,
}))

import type { FactoryResetDeps } from '@/data/factoryReset'

const { db } = await import('@/data/repositories/dexie/db')
const {
  defaultDeps,
  performFactoryReset,
  RESET_LOCAL_STORAGE_KEYS,
  RESET_NOTIFICATION_IDS,
  RESET_SESSION_STORAGE_KEYS,
} = await import('@/data/factoryReset')

// Las 28 tablas del schema Dexie (db.ts v13). El orden replica la declaración de
// db.ts (referencia de auditoría); las aserciones comparan como conjunto (sort),
// así que el orden de esta lista no es normativo. El harness de abajo construye
// las tablas en este orden para ejercitar el wipe sin IndexedDB.
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
    storeSpies.activeReset.mockClear()
    storeSpies.persistClearStorage.mockClear()
    storeSpies.equipmentClear.mockClear()
    storeSpies.goalReset.mockClear()
    notificationsBackend.getBackend.mockReset()
  })

  it('los default deps resetean los stores y limpian el persist del entreno activo (112b)', () => {
    defaultDeps.resetStores()
    expect(storeSpies.activeReset).toHaveBeenCalledTimes(1)
    expect(storeSpies.persistClearStorage).toHaveBeenCalledTimes(1)
    expect(storeSpies.equipmentClear).toHaveBeenCalledTimes(1)
    expect(storeSpies.goalReset).toHaveBeenCalledTimes(1)
    // El reset del store va ANTES de limpiar el persist (así el write diferido se cancela ya).
    expect(storeSpies.activeReset.mock.invocationCallOrder[0]).toBeLessThan(
      storeSpies.persistClearStorage.mock.invocationCallOrder[0],
    )
  })

  it('ejecuta el wipe en el orden congelado (D4)', async () => {
    const h = makeHarness()
    await performFactoryReset(h.deps)
    expect(h.events).toEqual([
      'notifications:9601,9602,9603,9604',
      'transaction:begin',
      'transaction:end',
      'stores',
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

  // R3-PARTIAL-WIPE: los stores se resetean recién DESPUÉS de la transacción; un
  // fallo del wipe no debe dejar nada a medias (el reintento parte del mismo estado).
  it('si la transacción falla no se toca nada (ni stores, ni storage, ni reload)', async () => {
    const h = makeHarness()
    h.deps.transaction = async () => {
      throw new Error('boom')
    }
    await expect(performFactoryReset(h.deps)).rejects.toThrow('boom')
    expect(h.events).not.toContain('stores')
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

  // R3-NOTIFY-BACKEND: en el dep default la cancelación es best-effort total —
  // adquisición del backend incluida — para que una notificación no bloquee el
  // reset (consistente con clearStorage). El test de arriba sigue vigente: con
  // deps inyectadas, un cancel que lanza sí aborta.
  it('cancelNotifications resuelve aunque getLocalNotificationsBackend rechace', async () => {
    notificationsBackend.getBackend.mockRejectedValueOnce(new Error('sin plugin'))
    await expect(defaultDeps.cancelNotifications([9601])).resolves.toBeUndefined()
  })

  it('cancelNotifications resuelve aunque un cancel rechace e intenta todos los ids', async () => {
    const cancel = vi.fn().mockRejectedValue(new Error('sin permiso'))
    notificationsBackend.getBackend.mockResolvedValueOnce({ cancel })
    await expect(defaultDeps.cancelNotifications([9601, 9602])).resolves.toBeUndefined()
    expect(cancel).toHaveBeenCalledTimes(2)
    expect(cancel).toHaveBeenCalledWith(9601)
    expect(cancel).toHaveBeenCalledWith(9602)
  })

  // R3-CLEAR-STORAGE-RELOAD: un storage que lanza no puede bloquear el wipe (la DB ya
  // quedó wipeada en el paso 3; el reload DEBE ocurrir igual).
  it('clearStorage es best-effort: un storage que lanza no rompe el reset', () => {
    const boom = () => {
      throw new Error('storage bloqueado')
    }
    vi.stubGlobal('window', {
      localStorage: { removeItem: boom },
      sessionStorage: { removeItem: boom },
    })
    try {
      expect(() => defaultDeps.clearStorage()).not.toThrow()
    } finally {
      // Solo el stub de este test: el localStorage del archivo queda como estaba.
      vi.unstubAllGlobals()
    }
  })
})
