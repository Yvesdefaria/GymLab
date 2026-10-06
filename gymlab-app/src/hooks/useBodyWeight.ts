// Hook que gestiona el registro de peso corporal por día.
import { useCallback, useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { bodyWeightRepo } from '@/data/repositories'
import { track } from '@/lib/telemetry'
import { toLocalDateStr } from '@/domain/dates'

// Mutaciones de peso corporal (sin liveQuery propia): para pantallas que ya leen las
// entradas de la capa única (F120/PC-2, p. ej. PesoCorporalPage).
export const useBodyWeightMutations = () => {
  const addToday = useCallback(async (weightKg: number) => {
    await bodyWeightRepo.upsert({ localDate: toLocalDateStr(), weightKg })
    track('weight_logged', {})
  }, [])

  const addEntry = useCallback(async (localDate: string, weightKg: number) => {
    await bodyWeightRepo.upsert({ localDate, weightKg })
    track('weight_logged', {})
  }, [])

  const remove = useCallback((id: number) => bodyWeightRepo.delete(id), [])

  return { addToday, addEntry, remove }
}

// Consulta todos los pesos registrados, expone el peso de hoy y operaciones de guardar/eliminar.
// Sigue siendo la vía para las pantallas que sí necesitan la lectura completa.
export const useBodyWeight = () => {
  const entries = useLiveList(() => bodyWeightRepo.getAll())

  // Entrada de peso del día actual, localizada por fecha local.
  const today = useMemo(() => {
    const t = toLocalDateStr()
    return entries.find((e) => e.localDate === t)
  }, [entries])
  const mutations = useBodyWeightMutations()

  return { entries, today, ...mutations }
}
