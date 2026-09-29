// Backup/restore completo de la base (IndexedDB) a un archivo JSON.
// La entrega ramifica: en nativo se escribe en Cache y se abre el share sheet
// del sistema (el WebView de Android no maneja descargas ni navigator.share);
// en web se mantiene el <a download> de siempre.
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { db } from './repositories/dexie/db'
import { logger } from '@/lib/logger'

export interface BackupFile {
  app: string
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

// Lista explícita de tablas incluidas en el backup: las 28 del schema Dexie
// (F112 §6). Al agregar una tabla al schema, sumarla acá: exportBackup la cubre
// y las tablas ausentes de un backup viejo se ignoran al importar (?? []).
export const ALL_TABLES = [
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
  'dailySteps',
  'sessionJournals',
  'benchmarkResults',
  'foods',
  'mealEntries',
  'supplements',
  'progressPhotos',
  'workoutTemplates',
  'periodizationPlans',
] as const

// Vuelca todas las tablas conocidas a un objeto { tabla: filas } para el backup.
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

const backupFileName = (): string =>
  `gymlab-backup-${new Date().toISOString().slice(0, 10)}.json`

// Nativo: escribe el JSON como texto UTF-8 en Cache (compartible por el
// FileProvider por defecto) y abre el share sheet para guardar/compartir.
const downloadNative = async (json: string): Promise<void> => {
  const { uri } = await Filesystem.writeFile({
    path: backupFileName(),
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  await Share.share({ title: 'GymLab', dialogTitle: 'GymLab', files: [uri] })
}

// Entrega del backup: ramifica por plataforma. La entrega NO se verifica; el
// copy del flujo pide guardar el archivo antes de continuar (spec §4.2).
export const downloadBackup = async (backup: BackupFile): Promise<void> => {
  const json = JSON.stringify(backup, null, 2)
  if (Capacitor.isNativePlatform()) {
    await downloadNative(json)
    return
  }
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Valida que el JSON sea un backup de GymLab (app + tabla de tablas) antes de importar.
export const parseBackup = (text: string): BackupFile | null => {
  try {
    const data = JSON.parse(text) as BackupFile
    if (data.app !== 'GymLab' || !data.tables || typeof data.tables !== 'object') return null
    return data
  } catch (error) {
    logger.warn('backup', 'backup ilegible: JSON inválido', { error })
    return null
  }
}

// Restaura el backup: limpia y rellena cada tabla en una única transacción atómica.
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
