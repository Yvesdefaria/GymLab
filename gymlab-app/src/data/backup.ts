// Backup/restore completo de la base (IndexedDB) a un archivo JSON.
// La entrega ramifica: en nativo se escribe en Cache y se abre el share sheet
// del sistema (el WebView de Android no maneja descargas ni navigator.share);
// en web se mantiene el <a download> de siempre.
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { db } from './repositories/dexie/db'
import { migrateJournalNotesToWorkouts } from './sessionNoteMigration'
import { rebuildPrsAndVolumes } from './migrations/rebuildPrsAndVolumes'
import { logger } from '@/lib/logger'
import { SETTINGS_META_KEY } from '@/domain/settings'
import type { WorkoutSet } from '@/domain/types'

export interface BackupFile {
  app: string
  version: number
  // Versión de schema con la que se exportó. Opcional en backups viejos.
  schemaVersion?: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

// Lista explícita de tablas incluidas en el backup: las 29 del schema Dexie
// (F112 §6 + alias de ejercicios). Al agregar una tabla al schema, sumarla acá:
// exportBackup la cubre y las tablas ausentes de un backup viejo se ignoran al importar.
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
  'exerciseAlias',
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
    schemaVersion: db.verno,
    exportedAt: new Date().toISOString(),
    tables,
  }
}

const backupFileName = (): string =>
  `gymlab-backup-${new Date().toISOString().slice(0, 10)}.json`

// Barrido de exports anteriores: la limpieza se difiere al PRÓXIMO export para no
// correr carrera con la app receptora (R3-BACKUP-CLEANUP: borrar justo después de
// `Share.share` puede dejar sin archivo a quien todavía lo está leyendo). El
// archivo recién compartido queda en Cache hasta el siguiente barrido.
const clearStaleBackupExports = async (): Promise<void> => {
  try {
    const { files } = await Filesystem.readdir({ path: '', directory: Directory.Cache })
    await Promise.all(
      files
        .filter((file) => file.name.startsWith('gymlab-backup-') && file.name.endsWith('.json'))
        .map((file) =>
          Filesystem.deleteFile({ path: file.name, directory: Directory.Cache }).catch(() => {}),
        ),
    )
  } catch {
    // Best-effort: un listado fallido no bloquea la entrega.
  }
}

// Nativo: escribe el JSON como texto UTF-8 en Cache (compartible por el
// FileProvider por defecto) y abre el share sheet para guardar/compartir.
const downloadNative = async (json: string): Promise<void> => {
  // Antes de escribir el nuevo: los exports viejos ya no están en uso (sus shares
  // resolvieron hace rato y el nombre es único por día).
  await clearStaleBackupExports()
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
  // Compacto: los backups con fotos crecen y la indentación no aporta nada.
  const json = JSON.stringify(backup)
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
// Rechaza un backup de un schema futuro que esta app no puede entender.
export const parseBackup = (text: string): BackupFile | null => {
  try {
    const data = JSON.parse(text) as BackupFile
    if (data.app !== 'GymLab' || !data.tables || typeof data.tables !== 'object') return null
    if (typeof data.version !== 'number') return null
    if (
      typeof data.schemaVersion === 'number' &&
      typeof db.verno === 'number' &&
      data.schemaVersion > db.verno
    ) {
      logger.warn('backup', 'backup de un schema futuro', { schemaVersion: data.schemaVersion })
      return null
    }
    return data
  } catch (error) {
    logger.warn('backup', 'backup ilegible: JSON inválido', { error })
    return null
  }
}

type MetaRow = { key?: unknown; value?: unknown }

// El consentimiento de telemetría es una decisión actual del usuario, no un dato
// portable: un backup no debe otorgarlo (ni revocarlo). Se lee el valor vigente
// antes de que el archivo reemplace `meta` y se vuelve a fijar en las filas.
const parseTelemetryConsent = (row: MetaRow | undefined): boolean => {
  if (!row || typeof row.value !== 'string') return false
  try {
    const parsed: unknown = JSON.parse(row.value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
    return (parsed as { telemetry?: unknown }).telemetry === true
  } catch {
    return false
  }
}

const pinTelemetryConsent = (rows: unknown[], consent: boolean): unknown[] =>
  rows.map((row) => {
    if (!row || typeof row !== 'object') return row
    const record = row as Record<string, unknown>
    if (record.key !== SETTINGS_META_KEY || typeof record.value !== 'string') return row
    let stored: unknown
    try {
      stored = JSON.parse(record.value)
    } catch {
      return row
    }
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return row
    return {
      ...record,
      value: JSON.stringify({ ...(stored as Record<string, unknown>), telemetry: consent }),
    }
  })

// Restaura el backup en una única transacción atómica.
// - `replace` (default): una tabla presente en el archivo reemplaza la actual, incluso
//   si viene vacía. Una tabla ausente (backup viejo) no se toca.
// - `merge`: agrega/actualiza filas sin borrar las actuales.
// Los PRs no se importan: son derivados y se reconstruyen desde `workoutSets`.
export const importBackup = async (
  backup: BackupFile,
  options: { mode?: 'replace' | 'merge' } = {}
): Promise<number> => {
  const mode = options.mode ?? 'replace'
  let imported = 0
  await db.transaction('rw', ALL_TABLES, async (tx) => {
    // Antes de tocar nada: el consentimiento que el usuario tiene hoy.
    const metaRows = (await tx.table('meta').toArray()) as MetaRow[]
    const currentConsent = parseTelemetryConsent(
      metaRows.find((row) => row.key === SETTINGS_META_KEY),
    )

    for (const name of ALL_TABLES) {
      if (name === 'prs') continue
      const hasTable = Object.prototype.hasOwnProperty.call(backup.tables, name)
      if (!hasTable) continue
      let rows = backup.tables[name] ?? []
      // La telemetría jamás se restaura: manda el consentimiento actual.
      if (name === 'meta') rows = pinTelemetryConsent(rows, currentConsent)
      if (mode === 'replace') {
        await db.table(name).clear()
        if (rows.length > 0) await db.table(name).bulkAdd(rows as never[])
      } else if (rows.length > 0) {
        await db.table(name).bulkPut(rows as never[])
      }
      imported += rows.length
    }

    // PRs derivados: mejor peso por ejercicio+reps de las series que quedaron.
    const sets = (await db.table('workoutSets').toArray()) as WorkoutSet[]
    const { prs } = rebuildPrsAndVolumes(sets)
    const prsTable = db.table('prs')
    await prsTable.clear()
    if (prs.length > 0) await prsTable.bulkAdd(prs as never[])

    // F84: un backup previo a la unificación puede traer notas de journal;
    // se mueven a workouts.notes y se limpia el campo viejo.
    await migrateJournalNotesToWorkouts(tx)
  })
  return imported
}
