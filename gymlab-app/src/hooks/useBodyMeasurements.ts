import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { bodyMeasurementRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { BodyZone } from '@/domain/types'

export const useBodyMeasurements = () => {
  const entries = useLiveQuery(
    () => bodyMeasurementRepo.getAll(),
    [],
  ) ?? []

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
