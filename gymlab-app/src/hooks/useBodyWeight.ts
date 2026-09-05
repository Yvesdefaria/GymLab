// Hook que gestiona el registro de peso corporal por día.
import { useCallback, useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { bodyWeightRepo } from '@/data/repositories'
import { track } from '@/lib/telemetry'
import { toLocalDateStr } from '@/domain/dates'

// Consulta todos los pesos registrados, expone el peso de hoy y operaciones de guardar/eliminar.
export const useBodyWeight = () => {
  const entries = useLiveList(() => bodyWeightRepo.getAll())

  // Entrada de peso del día actual, localizada por fecha local.
  const today = useMemo(() => {
    const t = toLocalDateStr()
    return entries.find((e) => e.localDate === t)
  }, [entries])

  const addToday = useCallback(async (weightKg: number) => {
    await bodyWeightRepo.upsert({ localDate: toLocalDateStr(), weightKg })
    track('weight_logged', {})
  }, [])

  const addEntry = useCallback(async (localDate: string, weightKg: number) => {
    await bodyWeightRepo.upsert({ localDate, weightKg })
    track('weight_logged', {})
  }, [])

  const remove = useCallback((id: number) => bodyWeightRepo.delete(id), [])

  return { entries, today, addToday, addEntry, remove }
}
