import { db } from './repositories/dexie/db'

export interface BackupFile {
  app: string
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

const ALL_TABLES = [
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
  'bodyMeasurements',
  'skinfolds',
  'exerciseNotes',
] as const

export const exportBackup = async (): Promise<BackupFile> => {
  const tables: Record<string, unknown[]> = {}
  for (const name of ALL_TABLES) {
    tables[name] = await db.table(name).toArray()
  }
  return {
    app: 'GymLab',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
  }
}

export const downloadBackup = (backup: BackupFile) => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gymlab-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const parseBackup = (text: string): BackupFile | null => {
  try {
    const data = JSON.parse(text) as BackupFile
    if (data.app !== 'GymLab' || !data.tables || typeof data.tables !== 'object') return null
    return data
  } catch {
    return null
  }
}

export const importBackup = async (backup: BackupFile): Promise<number> => {
  let imported = 0
  await db.transaction('rw', ALL_TABLES, async () => {
    for (const name of ALL_TABLES) {
      const rows = backup.tables[name] ?? []
      if (rows.length === 0) continue
      await db.table(name).clear()
      await db.table(name).bulkAdd(rows as never[])
      imported += rows.length
    }
  })
  return imported
}
