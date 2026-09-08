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
      // El plugin devuelve un array de mapas (uno por permiso consultado):
      // concedido = cualquier registro con READ_STEPS en true.
      const granted = permissions.some((p) => p['READ_STEPS'])
      return granted ? 'granted' : 'denied'
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
        const key = dayKey(sample.startDate)
        byDay.set(key, (byDay.get(key) ?? 0) + sample.value)
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