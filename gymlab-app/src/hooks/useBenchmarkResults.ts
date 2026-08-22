// Hook que consulta los resultados de benchmark tests de fuerza.
import { useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { benchmarkRepo } from '@/data/repositories'

export const useBenchmarkResults = () => {
  const results = useLiveList(() => benchmarkRepo.getAll())
  const byExercise = useMemo(
    () => {
      const map = new Map<string, typeof results>()
      for (const r of results) {
        const arr = map.get(r.exercise) ?? []
        arr.push(r)
        map.set(r.exercise, arr)
      }
      return map
    },
    [results],
  )
  return { results, byExercise }
}
