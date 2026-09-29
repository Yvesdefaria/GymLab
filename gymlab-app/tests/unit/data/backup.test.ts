// Backup (F27 → F112 §6): exporta las 28 tablas del schema, importa archivos
// viejos de 19 tablas sin romper, no toca tablas vacías/ausentes y entrega en
// nativo escribiendo en Cache (UTF-8) + share sheet.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// db doble: registra toArray/clear/bulkAdd por tabla y ejecuta el scope de la transacción.
const dbMock = vi.hoisted(() => {
  const state = {
    rows: {} as Record<string, unknown[]>,
    cleared: [] as string[],
    added: {} as Record<string, unknown[]>,
  }
  return {
    state,
    db: {
      table: (name: string) => ({
        toArray: async () => state.rows[name] ?? [],
        clear: async () => {
          state.cleared.push(name)
        },
        bulkAdd: async (rows: unknown[]) => {
          state.added[name] = rows
        },
      }),
      transaction: async (_mode: string, _tables: unknown, scope: () => Promise<void>) => scope(),
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => true) },
}))
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { writeFile: vi.fn(async () => ({ uri: 'file:///data/cache/gymlab-backup.json' })) },
}))
vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn(async () => ({})) },
}))

import type { BackupFile } from '@/data/backup'

const { ALL_TABLES, downloadBackup, exportBackup, importBackup } = await import('@/data/backup')
const { Filesystem } = await import('@capacitor/filesystem')
const { Share } = await import('@capacitor/share')

// Las 28 tablas del schema Dexie (db.ts v13), en orden de declaración.
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

const backupWith = (tables: Record<string, unknown[]>): BackupFile => ({
  app: 'GymLab',
  version: 1,
  exportedAt: '2026-09-29T10:00:00.000Z',
  tables,
})

const writeFile = Filesystem.writeFile as unknown as ReturnType<typeof vi.fn>
const share = Share.share as unknown as ReturnType<typeof vi.fn>

describe('backup (F112 §6)', () => {
  beforeEach(() => {
    dbMock.state.rows = {}
    dbMock.state.cleared = []
    dbMock.state.added = {}
    writeFile.mockClear()
    share.mockClear()
  })

  it('ALL_TABLES cubre exactamente las 28 tablas del schema', () => {
    expect(ALL_TABLES).toHaveLength(28)
    expect([...ALL_TABLES].sort()).toEqual([...EXPECTED_TABLES].sort())
  })

  it('exportBackup vuelca las 28 tablas aunque estén vacías', async () => {
    const backup = await exportBackup()
    expect(Object.keys(backup.tables).sort()).toEqual([...EXPECTED_TABLES].sort())
    expect(backup.app).toBe('GymLab')
    expect(backup.version).toBe(1)
  })

  it('importBackup de un archivo viejo (19 tablas) no rompe y solo toca las presentes', async () => {
    const count = await importBackup(
      backupWith({ workouts: [{ id: 1 }], meta: [{ key: 'a', value: '1' }] }),
    )
    expect(count).toBe(2)
    expect(dbMock.state.cleared).toEqual(['workouts', 'meta'])
    expect(dbMock.state.added['workouts']).toEqual([{ id: 1 }])
  })

  it('las tablas ausentes o vacías no se limpian', async () => {
    await importBackup(backupWith({ workouts: [], foods: [{ id: 7 }] }))
    expect(dbMock.state.cleared).toEqual(['foods'])
  })

  it('en nativo escribe el JSON en Cache (UTF-8) y abre el share sheet con el archivo', async () => {
    await downloadBackup(backupWith({ workouts: [{ id: 1 }] }))
    expect(writeFile).toHaveBeenCalledTimes(1)
    const args = writeFile.mock.calls[0][0] as {
      path: string
      data: string
      directory: string
      encoding: string
    }
    expect(args.directory).toBe('CACHE')
    expect(args.encoding).toBe('utf8')
    expect(args.path).toMatch(/^gymlab-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(args.data).toContain('"app": "GymLab"')
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///data/cache/gymlab-backup.json'] }),
    )
  })
})
