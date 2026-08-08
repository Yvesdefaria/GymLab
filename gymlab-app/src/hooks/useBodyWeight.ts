// Hook que gestiona el registro de peso corporal por día.
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { bodyWeightRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'

// Consulta todos los pesos registrados, expone el peso de hoy y operaciones de guardar/eliminar.
export const useBodyWeight = () => {
  const entries = useLiveQuery(
    () => bodyWeightRepo.getAll(),
    [],
  ) ?? []

  // Entrada de peso del día actual, localizada por fecha local.
  const today = useMemo(() => {
    const t = toLocalDateStr()
    return entries.find((e) => e.localDate === t)
  }, [entries])

  const addToday = useCallback(async (weightKg: number) => {
    await bodyWeightRepo.upsert({ localDate: toLocalDateStr(), weightKg })
  }, [])

  const addEntry = useCallback(
    (localDate: string, weightKg: number) => bodyWeightRepo.upsert({ localDate, weightKg }),
    []
  )

  const remove = useCallback((id: number) => bodyWeightRepo.delete(id), [])

  return { entries, today, addToday, addEntry, remove }
}
