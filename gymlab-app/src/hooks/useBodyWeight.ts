import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { bodyWeightRepo, toLocalDateStr } from '@/data/repositories/dexie/bodyWeightRepo'
import { db } from '@/data/repositories/dexie/db'
import type { BodyWeightEntry } from '@/domain/types'

export const useBodyWeight = () => {
  const entries = useLiveQuery(
    () => bodyWeightRepo.getAll(),
    [],
  ) ?? []

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

export const useBodyWeightRaw = () => {
  return useLiveQuery(() => db.bodyWeight.toArray(), []) as BodyWeightEntry[] | undefined
}
