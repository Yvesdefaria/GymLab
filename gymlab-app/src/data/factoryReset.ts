// Reset de fábrica (F112, 112.1): devuelve la app a estado de instalación limpia.
// El orden importa (D4): notificaciones → Dexie → stores en memoria → storage → reload.
// Dependencias inyectables (patrón workoutDeletion): los tests las sustituyen por dobles.
import { db } from '@/data/repositories/dexie/db'
import { NOTIFICATION_IDS } from '@/domain/notifications'
import { REST_NOTIFICATION_ID } from '@/domain/restAlert'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useEquipmentStore } from '@/store/equipmentStore'
import { useGoalStore } from '@/store/goalStore'
import { getLocalNotificationsBackend } from './localNotificationsBackend'

// Notificaciones del OS que el reset cancela: descanso (9601) + recordatorios (9602–9604).
export const RESET_NOTIFICATION_IDS: readonly number[] = [
  REST_NOTIFICATION_ID,
  ...Object.values(NOTIFICATION_IDS),
]

// Claves que sobreviven a IndexedDB y no deben sobrevivir al reset (spec §4.3.4).
export const RESET_LOCAL_STORAGE_KEYS: readonly string[] = [
  'gymLab-activeWorkout',
  'gymlab-goals',
  'gymlab-equipment',
  'gymlab.theme',
  'gymlab.palette',
  'gymlab.recentCalculators',
  'gymlab-pending-photo-angle',
]

export const RESET_SESSION_STORAGE_KEYS: readonly string[] = ['gymLab-preloadReload']

// Tabla mínima que el wipe necesita; db.tables las expone en runtime (nunca
// ALL_TABLES, que es la lista del backup y puede estar desactualizada).
export interface ResetTable {
  name: string
  clear: () => Promise<void>
}

export interface FactoryResetDeps {
  cancelNotifications: (ids: readonly number[]) => Promise<void>
  resetStores: () => void
  transaction: (scope: () => Promise<void>) => Promise<void>
  getTables: () => readonly ResetTable[]
  clearStorage: () => void
  reload: () => void
}

export const defaultDeps: FactoryResetDeps = {
  cancelNotifications: async (ids) => {
    // Best-effort total (R3-NOTIFY-BACKEND): si el backend no se puede adquirir
    // (o un cancel falla), el reset no se aborta — mismo criterio que clearStorage.
    try {
      const backend = await getLocalNotificationsBackend()
      await Promise.allSettled(ids.map((id) => backend.cancel(id)))
    } catch {
      // sin backend no hay notificaciones que cancelar.
    }
  },
  resetStores: () => {
    // ANTES de tocar storage: ningún writer debounced debe resucitar estado (D4).
    useActiveWorkoutStore.getState().reset()
    // El persist del entreno activo difiere la escritura 400 ms: sin esto, al
    // limpiar la clave en el paso 4 el timer pendiente la recrearía vacía (112b).
    // `persist.clearStorage()` pasa por el storage debounced, que flushea y
    // cancela el timer en su `removeItem`.
    useActiveWorkoutStore.persist.clearStorage()
    useEquipmentStore.getState().clear()
    useGoalStore.getState().reset()
  },
  // Una única transacción rw sobre TODAS las tablas reales de Dexie.
  transaction: (scope) => db.transaction('rw', db.tables, scope),
  getTables: () => db.tables.map((table) => ({ name: table.name, clear: () => table.clear() })),
  clearStorage: () => {
    // Best-effort (R3-CLEAR-STORAGE-RELOAD): con la DB ya wipeada, un storage que lanza
    // no puede bloquear el reload del paso 5 — quedar a mitad de camino es peor que
    // terminar con alguna clave sin limpiar.
    try {
      for (const key of RESET_LOCAL_STORAGE_KEYS) window.localStorage.removeItem(key)
    } catch {
      // sin localStorage accesible no hay claves que limpiar.
    }
    try {
      for (const key of RESET_SESSION_STORAGE_KEYS) window.sessionStorage.removeItem(key)
    } catch {
      // ídem sessionStorage.
    }
  },
  reload: () => window.location.replace('/'),
}

// Ejecuta el wipe completo en el orden congelado. Un fallo de la transacción se
// propaga sin tocar nada más: los stores en memoria se resetean recién DESPUÉS
// del wipe (R3-PARTIAL-WIPE), así que la UI puede reintentar desde el mismo estado.
export const performFactoryReset = async (deps: FactoryResetDeps = defaultDeps): Promise<void> => {
  // 1) Notificaciones del OS: una alerta pendiente no debe sonar tras el reset.
  await deps.cancelNotifications(RESET_NOTIFICATION_IDS)
  // 2) Dexie: una sola transacción sobre db.tables (las 28 del schema). Si falla,
  //    nada quedó a medias todavía (los stores se resetean después).
  await deps.transaction(async () => {
    for (const table of deps.getTables()) {
      await table.clear()
    }
  })
  // 3) Stores en memoria: recién con la DB wipeada — un fallo de la transacción no
  //    los toca a medias, y ningún writer diferido repuebla storage o Dexie.
  deps.resetStores()
  // 4) Claves de localStorage/sessionStorage que Dexie no toca.
  deps.clearStorage()
  // 5) Reload: providers.boot() re-siembra y el onboarding vuelve solo (spec §4.3.5).
  deps.reload()
}
