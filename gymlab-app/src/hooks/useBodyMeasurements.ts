// Hook que gestiona las medidas corporales registradas por día (cuello, bíceps, cintura, etc.).
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { bodyMeasurementRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { BodyMeasurementEntry, BodyZone } from '@/domain/types'

// Array vacío estable: evita que `useLiveQuery ?? []` cree una referencia nueva en cada render.
const EMPTY_ENTRIES: BodyMeasurementEntry[] = []

// Consulta todos los registros de medidas, expone la entrada de hoy y operaciones de guardar/eliminar.
export const useBodyMeasurements = () => {
  const entries = useLiveQuery(
    () => bodyMeasurementRepo.getAll(),
    [],
  ) ?? EMPTY_ENTRIES

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
