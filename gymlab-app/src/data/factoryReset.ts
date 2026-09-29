// Reset de fábrica (F112, 112.1): devuelve la app a estado de instalación limpia.
// El orden importa (D4): notificaciones → stores en memoria → Dexie → storage → reload.
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

const defaultDeps: FactoryResetDeps = {
  cancelNotifications: async (ids) => {
    const backend = await getLocalNotificationsBackend()
    // Best-effort: una notificación que no existe (o un plugin caído) no bloquea el reset.
    await Promise.allSettled(ids.map((id) => backend.cancel(id)))
  },
  resetStores: () => {
    // ANTES de tocar storage: ningún writer debounced debe resucitar estado (D4).
    useActiveWorkoutStore.getState().reset()
    useEquipmentStore.getState().clear()
    useGoalStore.getState().reset()
  },
  // Una única transacción rw sobre TODAS las tablas reales de Dexie.
  transaction: (scope) => db.transaction('rw', db.tables, scope),
  getTables: () => db.tables.map((table) => ({ name: table.name, clear: () => table.clear() })),
  clearStorage: () => {
    for (const key of RESET_LOCAL_STORAGE_KEYS) window.localStorage.removeItem(key)
    for (const key of RESET_SESSION_STORAGE_KEYS) window.sessionStorage.removeItem(key)
  },
  reload: () => window.location.replace('/'),
}

// Ejecuta el wipe completo en el orden congelado. Cualquier fallo se propaga: la
// transacción es atómica (o se borra todo o nada) y la UI permite reintentar.
export const performFactoryReset = async (deps: FactoryResetDeps = defaultDeps): Promise<void> => {
  // 1) Notificaciones del OS: una alerta pendiente no debe sonar tras el reset.
  await deps.cancelNotifications(RESET_NOTIFICATION_IDS)
  // 2) Stores en memoria: evita que un writer diferido repueble storage o Dexie.
  deps.resetStores()
  // 3) Dexie: una sola transacción sobre db.tables (las 28 del schema).
  await deps.transaction(async () => {
    for (const table of deps.getTables()) {
      await table.clear()
    }
  })
  // 4) Claves de localStorage/sessionStorage que Dexie no toca.
  deps.clearStorage()
  // 5) Reload: providers.boot() re-siembra y el onboarding vuelve solo (spec §4.3.5).
  deps.reload()
}
