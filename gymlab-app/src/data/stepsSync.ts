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

// Caché de sesión (F120/H2): availability, permiso y zancada no cambian entre
// ticks del loop de 3 s de /pasos. El foreground la invalida con
// resetHealthSyncSessionCaches, para revalidar permisos o estatura que el
// usuario pudo cambiar fuera de la app.
let sessionAvailable: boolean | undefined
let sessionPermission: boolean | undefined
let sessionStrideLengthCm: number | undefined

export const resetHealthSyncSessionCaches = (): void => {
  sessionAvailable = undefined
  sessionPermission = undefined
  sessionStrideLengthCm = undefined
}

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
    // En auto los chequeos se cachean por sesión; interactive siempre revalida
    // (el usuario pudo cambiar el permiso y el banner debe poder reconectar).
    if (mode === 'auto' && sessionAvailable !== undefined) {
      if (!sessionAvailable) return { status: 'unavailable' }
    } else {
      sessionAvailable = await active.isAvailable()
      if (!sessionAvailable) return { status: 'unavailable' }
    }
    let granted: boolean
    if (mode === 'auto') {
      if (sessionPermission === undefined) sessionPermission = await active.checkPermission()
      granted = sessionPermission
    } else {
      granted = (await active.requestPermission()) === 'granted'
      // El resultado interactivo actualiza la caché: el tick auto siguiente no
      // vuelve a chequear el permiso recién resuelto.
      sessionPermission = granted
    }
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

    // F120/H1: un único getRange indexado + merge en memoria + un bulk write
    // reemplaza el getByDate/upsert por día (≈180 roundtrips y 90 transacciones
    // en el backfill). Sin muestras no se toca ni el rango ni la zancada.
    let written = 0
    if (samples.length > 0) {
      const existing = await stepRepo.getRange(from, to)
      const dayByDate = new Map(existing.map((row) => [row.localDate, row]))
      const strideLengthCm = (sessionStrideLengthCm ??= await stepRepo.getStrideLengthCm())
      const appliedAt = new Date().toISOString()
      const mergedByDate = new Map<string, DailyStepsEntry>()
      for (const sample of samples) {
        const day = dayByDate.get(sample.localDate)
        const merged = mergeHealthSample(sample.localDate, day, sample.steps, strideLengthCm, appliedAt)
        // Un día repetido en las muestras conserva la última (misma semántica
        // que el upsert secuencial anterior).
        if (merged && !isUnchangedHealthDay(day, merged)) mergedByDate.set(merged.localDate, merged)
      }
      if (mergedByDate.size > 0) {
        await stepRepo.bulkUpsert([...mergedByDate.values()])
        written = mergedByDate.size
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
