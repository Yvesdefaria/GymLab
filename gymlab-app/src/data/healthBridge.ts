// Puente hacia el ecosistema de salud (F84c): impl nativa vía capacitor-health
// (HealthKit iOS / Health Connect Android) bajo Capacitor.isNativePlatform();
// en web devuelve un bridge nulo para que la app siga siendo local-first.
import { Capacitor } from '@capacitor/core'
import { toLocalDateStr } from '@/domain/dates'

export interface HealthDaySample {
  localDate: string
  steps: number
}

export interface HealthBridge {
  isAvailable(): Promise<boolean>
  requestPermission(): Promise<'granted' | 'denied'>
  fetchStepsByDay(from: string, to: string): Promise<HealthDaySample[]>
}

// El plugin devuelve `{ READ_STEPS: true }` — un MAPA —, NO el array de mapas que documenta
// su propio README (`{ [key: string]: boolean }[]`). El código le creyó al README y hacía
// `permissions.some(...)`, así que `requestPermission()` tiraba `TypeError: .some is not a
// function` SIEMPRE: el sync de /pasos fallaba al 100% con «Could not sync steps», incluso
// con el permiso ya concedido. Se aceptan ambas formas por si cambian el contrato.
const isPermissionGranted = (permissions: unknown, key: string): boolean => {
  if (Array.isArray(permissions)) {
    return permissions.some((p) => !!p && typeof p === 'object' && (p as Record<string, boolean>)[key])
  }
  if (permissions && typeof permissions === 'object') {
    return !!(permissions as Record<string, boolean>)[key]
  }
  return false
}

// La impl nativa se carga perezosa: solo importa capacitor-health en runtime nativo,
// para no inflar el bundle web ni romper el tree-shake.
const createNativeBridge = async (): Promise<HealthBridge> => {
  const { Health } = await import('capacitor-health')

  const dayKey = (iso: string): string => toLocalDateStr(new Date(iso))

  return {
    isAvailable: async () => {
      const { available } = await Health.isHealthAvailable()
      return available
    },
    requestPermission: async () => {
      const { permissions } = await Health.requestHealthPermissions({
        permissions: ['READ_STEPS'],
      })
      return isPermissionGranted(permissions, 'READ_STEPS') ? 'granted' : 'denied'
    },
    fetchStepsByDay: async (from, to) => {
      const { aggregatedData } = await Health.queryAggregated({
        startDate: new Date(from + 'T00:00:00').toISOString(),
        endDate: new Date(to + 'T23:59:59').toISOString(),
        dataType: 'steps',
        bucket: 'day',
      })
      // El plugin puede devolver varias muestras por día (bucket horario en iOS):
      // agrupar por localDate y sumar.
      const byDay = new Map<string, number>()
      for (const sample of aggregatedData) {
        // `value` viene AUSENTE (null en Kotlin) cuando el bucket no tiene datos — pasa en
        // cualquier día sin pasos. Sin este guardado se sumaba `undefined` → NaN, que se
        // propagaba a la fusión y a Dexie hasta romper el sync entero: /pasos mostraba
        // «Could not sync steps» en vez de simplemente «sin datos».
        const value = typeof sample.value === 'number' && Number.isFinite(sample.value) ? sample.value : 0
        if (value <= 0) continue
        const key = dayKey(sample.startDate)
        byDay.set(key, (byDay.get(key) ?? 0) + value)
      }
      return [...byDay.entries()].map(([localDate, steps]) => ({ localDate, steps }))
    },
  }
}

const createNullBridge = (): HealthBridge => ({
  isAvailable: async () => false,
  requestPermission: async () => 'denied',
  fetchStepsByDay: async () => [],
})

export const getHealthBridge = async (): Promise<HealthBridge> =>
  Capacitor.isNativePlatform() ? createNativeBridge() : createNullBridge()