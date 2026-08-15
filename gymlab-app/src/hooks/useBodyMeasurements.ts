// Hook que gestiona las medidas corporales registradas por día (cuello, bíceps, cintura, etc.).
import { useCallback, useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { bodyMeasurementRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { BodyZone } from '@/domain/types'

// Consulta todos los registros de medidas, expone la entrada de hoy y operaciones de guardar/eliminar.
export const useBodyMeasurements = () => {
  const entries = useLiveList(() => bodyMeasurementRepo.getAll())

  // Entrada del día actual, buscada por fecha local para el registro "hoy".
  const today = useMemo(() => {
    const t = toLocalDateStr()
    return entries.find((e) => e.localDate === t)
  }, [entries])

  const saveToday = useCallback(
    async (values: Partial<Record<BodyZone, number>>) => {
      await bodyMeasurementRepo.upsert({ localDate: toLocalDateStr(), values })
    },
    [],
  )

  const saveEntry = useCallback(
    (localDate: string, values: Partial<Record<BodyZone, number>>) =>
      bodyMeasurementRepo.upsert({ localDate, values }),
    [],
  )

  const remove = useCallback((id: number) => bodyMeasurementRepo.delete(id), [])

  return { entries, today, saveToday, saveEntry, remove }
}
