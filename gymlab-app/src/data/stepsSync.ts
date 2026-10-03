// Orquestador del sync de pasos de salud (F84c): verifica disponibilidad y
// permiso, trae el rango (backfill 90 días o incremental desde lastHealthSyncAt),
// fusiona por día con la regla del dominio y persiste la meta de última sync.
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import { mergeHealthSample } from '@/domain/stepsFusion'
import type { DailyStepsEntry } from '@/domain/types'
import { getHealthBridge, type HealthBridge } from './healthBridge'
import { metaRepo, stepRepo } from './repositories'
import { track } from '@/lib/telemetry'
import { logger } from '@/lib/logger'

export type SyncStatus = 'unavailable' | 'denied' | 'synced' | 'error'

// `interactive` (default, uso manual/banner): puede abrir el diálogo de consentimiento.
// `auto` (arranque/primer plano): consulta sin diálogo y nunca lo abre, para no realimentar
// el loop de appStateChange que ya sufrió /pasos en F84c.
export type SyncMode = 'auto' | 'interactive'

export interface SyncResult {
  status: SyncStatus
  days?: number
}

const HEALTH_LAST_SYNC_KEY = 'healthLastSyncAt'

// Tick rápido sin novedades: el día ya vino de salud con las mismas métricas, así que
// reescribirlo solo movería `syncedAt` y despertaría liveQuery en /pasos.
const isUnchangedHealthDay = (day: DailyStepsEntry | undefined, merged: DailyStepsEntry): boolean =>
  day !== undefined &&
  day.source === 'phone' &&
  day.steps === merged.steps &&
  day.distanceKm === merged.distanceKm &&
  day.calories === merged.calories

export const syncStepsFromHealth = async (
  bridge?: HealthBridge,
  mode: SyncMode = 'interactive',
): Promise<SyncResult> => {
  const active = bridge ?? (await getHealthBridge())

  try {
    if (!(await active.isAvailable())) return { status: 'unavailable' }
    const granted =
      mode === 'auto'
        ? await active.checkPermission()
        : (await active.requestPermission()) === 'granted'
    if (!granted) return { status: 'denied' }

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
      if (merged && !isUnchangedHealthDay(day, merged)) {
        await stepRepo.upsert(merged)
        written++
      }
    }

    // La meta solo se reescribe cuando cambia la fecha: la relectura del mismo día en
    // cada tick no debe tocar `meta` (dispararía re-render por liveQuery).
    if (lastParsed !== to) {
      await metaRepo.setJson(HEALTH_LAST_SYNC_KEY, new Date().toISOString())
    }
    // Sin días escritos no hay evento: el tick rápido lo emitiría ~20 veces/min.
    if (written > 0) track('steps_synced', { days: written })
    return { status: 'synced', days: written }
  } catch (error) {
    // El fallo queda en consola (logcat en el dispositivo) manteniendo el retorno de error.
    logger.error('stepsSync', 'fallo al sincronizar pasos de salud', { error })
    track('steps_sync_failed', { reason: 'error' })
    return { status: 'error' }
  }
}