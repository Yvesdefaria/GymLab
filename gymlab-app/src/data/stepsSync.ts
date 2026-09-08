// Orquestador del sync de pasos de salud (F84c): verifica disponibilidad y
// permiso, trae el rango (backfill 90 días o incremental desde lastHealthSyncAt),
// fusiona por día con la regla del dominio y persiste la meta de última sync.
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import { mergeHealthSample } from '@/domain/stepsFusion'
import { getHealthBridge, type HealthBridge } from './healthBridge'
import { metaRepo, stepRepo } from './repositories'
import { track } from '@/lib/telemetry'

export type SyncStatus = 'unavailable' | 'denied' | 'synced' | 'error'

export interface SyncResult {
  status: SyncStatus
  days?: number
}

const HEALTH_LAST_SYNC_KEY = 'healthLastSyncAt'

export const syncStepsFromHealth = async (bridge?: HealthBridge): Promise<SyncResult> => {
  const active = bridge ?? (await getHealthBridge())

  try {
    if (!(await active.isAvailable())) return { status: 'unavailable' }
    if ((await active.requestPermission()) !== 'granted') return { status: 'denied' }

    // Rango: backfill 90 días si nunca se sincronizó; si no, incremental desde la última.
    const lastSync = await metaRepo.getJson<string>(HEALTH_LAST_SYNC_KEY, '')
    // Normalizar a YYYY-MM-DD: el bridge construye new Date(from + 'T00:00:00'),
    // así que un ISO con hora (como lastSyncAt) rompería el parse.
    const lastParsed = lastSync ? toLocalDateStr(new Date(lastSync)) : ''
    const from = lastParsed || addLocalDays(toLocalDateStr(), -89)
    const to = toLocalDateStr()

    // Si la meta quedó en el pasado (salto de días), lo mejor es volver a cubrir
    // hasta hoy completo; conservamos el «from» original como ancla inclusiva.
    const samples = await active.fetchStepsByDay(from, to)

    const strideLengthCm = await stepRepo.getStrideLengthCm()
    let written = 0
    for (const sample of samples) {
      const day = await stepRepo.getByDate(sample.localDate)
      const merged = mergeHealthSample(sample.localDate, day, sample.steps, strideLengthCm, new Date().toISOString())
      if (merged) {
        await stepRepo.upsert(merged)
        written++
      }
    }

    await metaRepo.setJson(HEALTH_LAST_SYNC_KEY, new Date().toISOString())
    track('steps_synced', { days: written })
    return { status: 'synced', days: written }
  } catch {
    track('steps_sync_failed', { reason: 'error' })
    return { status: 'error' }
  }
}

// Esqueleto documentado: se activa en F84d cuando exista el widget nativo.
// Registra un callback que corra el sync en background; hoy es no-op por YAGNI.
export const registerBackgroundSync = (_handler: () => Promise<void>): void => {
  // no-op intencional hasta F84d
}