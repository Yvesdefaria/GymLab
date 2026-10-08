// Backup (F27 → F112 §6): exporta las 28 tablas del schema, importa archivos
// viejos de 19 tablas sin romper, no toca tablas vacías/ausentes y entrega en
// nativo escribiendo en Cache (UTF-8) + share sheet.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// db doble: registra toArray/clear/bulkAdd/update por tabla y ejecuta el scope de la transacción.
const dbMock = vi.hoisted(() => {
  const state = {
    rows: {} as Record<string, unknown[]>,
    cleared: [] as string[],
    added: {} as Record<string, unknown[]>,
    updates: [] as Array<{ table: string; id: number; changes: Record<string, unknown> }>,
  }
  const db = {
    table: (name: string) => ({
      toArray: async () => state.rows[name] ?? [],
      get: async (id: number) => (state.rows[name] ?? []).find((r) => (r as { id: number }).id === id),
      update: async (id: number, changes: Record<string, unknown>) => {
        state.updates.push({ table: name, id, changes })
      },
      clear: async () => {
        state.cleared.push(name)
        state.rows[name] = []
      },
      bulkAdd: async (rows: unknown[]) => {
        state.added[name] = rows
        state.rows[name] = rows
      },
    }),
    transaction: async (
      _mode: string,
      _tables: unknown,
      scope: (tx: unknown) => Promise<void>,
    ) => scope(db),
  }
  return { state, db }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))
// Flag mutable de plataforma: los tests nativos lo prenden y el afterEach lo
// apaga para no filtrar estado entre tests.
const nativeState = vi.hoisted(() => ({ value: false }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => nativeState.value },
}))
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: {
    writeFile: vi.fn(async () => ({ uri: 'file:///data/cache/gymlab-backup.json' })),
    deleteFile: vi.fn(async () => undefined),
    readdir: vi.fn(),
  },
}))
vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn(async () => ({})) },
}))

import type { BackupFile } from '@/data/backup'

const { ALL_TABLES, downloadBackup, exportBackup, importBackup } = await import('@/data/backup')
const { Filesystem } = await import('@capacitor/filesystem')
const { Share } = await import('@capacitor/share')

// Las 28 tablas del schema Dexie (db.ts v13). El orden replica la declaración de
// db.ts (referencia de auditoría); las aserciones comparan como conjunto (sort),
// así que el orden de esta lista no es normativo.
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
const deleteFile = Filesystem.deleteFile as unknown as ReturnType<typeof vi.fn>
const readdir = Filesystem.readdir as unknown as ReturnType<typeof vi.fn>
const share = Share.share as unknown as ReturnType<typeof vi.fn>

describe('backup (F112 §6)', () => {
  beforeEach(() => {
    dbMock.state.rows = {}
    dbMock.state.cleared = []
    dbMock.state.added = {}
    dbMock.state.updates = []
    // Los tests existentes y los nativos nuevos asumen Capacitor nativo por defecto.
    nativeState.value = true
    writeFile.mockClear()
    deleteFile.mockReset()
    deleteFile.mockResolvedValue(undefined)
    // Sweep por defecto: Cache sin exports viejos; cada test lo sobreescribe si lo necesita.
    readdir.mockReset()
    readdir.mockResolvedValue({ files: [] })
    share.mockClear()
  })

  afterEach(() => {
    nativeState.value = false
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

  it('importBackup normaliza notas de journal de backups viejos (F84)', async () => {
    await importBackup(
      backupWith({
        workouts: [{ id: 1, notes: 'durante' }],
        sessionJournals: [{ id: 5, workoutId: 1, note: 'después', energy: 3 }],
      }),
    )
    expect(dbMock.state.updates).toStrictEqual([
      { table: 'workouts', id: 1, changes: { notes: 'durante\n\ndespués' } },
      { table: 'sessionJournals', id: 5, changes: { note: undefined } },
    ])
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
    expect(args.data).toContain('"app":"GymLab"')
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///data/cache/gymlab-backup.json'] }),
    )
  })

  it('nativo: barre los exports viejos ANTES de escribir el nuevo y no borra tras el share (R3-BACKUP-CLEANUP)', async () => {
    nativeState.value = true
    readdir.mockResolvedValue({
      files: [{ name: 'gymlab-backup-2025-12-31.json' }, { name: 'otra-cosa.txt' }],
    })
    const backup = backupWith({ workouts: [{ id: 1 }] })
    await downloadBackup(backup)

    // Compacto (sin indentar) y sin saltos de línea.
    const args = writeFile.mock.calls[0][0] as { data: string }
    expect(args.data).toBe(JSON.stringify(backup))
    expect(args.data).not.toContain('\n')

    // El barrido corre antes de escribir y solo toca los backups.
    expect(readdir).toHaveBeenCalledWith({ path: '', directory: 'CACHE' })
    expect(deleteFile).toHaveBeenCalledTimes(1)
    expect(deleteFile).toHaveBeenCalledWith({
      path: 'gymlab-backup-2025-12-31.json',
      directory: 'CACHE',
    })
    expect(deleteFile.mock.invocationCallOrder[0]).toBeLessThan(writeFile.mock.invocationCallOrder[0])
    // El único borrado es anterior al share: no queda limpieza tras compartir.
    expect(deleteFile.mock.invocationCallOrder[0]).toBeLessThan(share.mock.invocationCallOrder[0])
  })

  it('nativo: si el barrido falla, la entrega no rompe (best-effort)', async () => {
    nativeState.value = true
    readdir.mockRejectedValueOnce(new Error('sin acceso'))
    await expect(downloadBackup(backupWith({}))).resolves.toBeUndefined()
    expect(writeFile).toHaveBeenCalledTimes(1)
    expect(share).toHaveBeenCalledTimes(1)
    expect(deleteFile).not.toHaveBeenCalled()
  })
})
