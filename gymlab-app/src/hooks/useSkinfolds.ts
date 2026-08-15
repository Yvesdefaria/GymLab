// Hook que gestiona los registros de pliegues cutáneos para el cálculo de grasa corporal.
import { useCallback, useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { skinfoldRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { Sex, SkinfoldSite } from '@/domain/types'

// Datos del formulario de pliegues: sexo, edad, peso y medidas por sitio.
export interface SkinfoldFormData {
  sex: Sex
  age: number
  weightKg: number | null
  sites: Partial<Record<SkinfoldSite, number>>
}

// Consulta todos los registros, expone la entrada de hoy y operaciones de guardar/eliminar.
export const useSkinfolds = () => {
  const entries = useLiveList(() => skinfoldRepo.getAll())

  // Entrada de pliegues del día actual, buscada por fecha local.
  const today = useMemo(() => {
    const t = toLocalDateStr()
    return entries.find((e) => e.localDate === t)
  }, [entries])

  const saveToday = useCallback(async (data: SkinfoldFormData) => {
    await skinfoldRepo.upsert({ localDate: toLocalDateStr(), ...data })
  }, [])

  const saveEntry = useCallback((localDate: string, data: SkinfoldFormData) => {
    return skinfoldRepo.upsert({ localDate, ...data })
  }, [])

  const remove = useCallback((id: number) => skinfoldRepo.delete(id), [])

  return { entries, today, saveToday, saveEntry, remove }
}
