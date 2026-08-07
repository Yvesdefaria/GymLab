import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { skinfoldRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { Sex, SkinfoldSite } from '@/domain/types'

export interface SkinfoldFormData {
  sex: Sex
  age: number
  weightKg: number | null
  sites: Partial<Record<SkinfoldSite, number>>
}

export const useSkinfolds = () => {
  const entries = useLiveQuery(
    () => skinfoldRepo.getAll(),
    [],
  ) ?? []

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
