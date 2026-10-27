// Hook que consulta los récords personales (PRs) registrados.
import { useMemo } from 'react'
import { useLiveList } from './useLiveList'
import { prRepo } from '@/data/repositories'
import type { PRRecord } from '@/domain/types'

// Devuelve:
// - `prs`: todos los récords (uno por ejercicio + reps), para conteos por sesión.
// - `bestPrs`: el mejor por ejercicio según e1RM, para tarjetas y listas.
// - `prMap`: el mismo mejor por ejercicio, indexado por id.
// - `prByKey`: índice `${exerciseId}:${reps}`, para el badge de PR de cada serie.
// - `prMaxWeight`: techo de seguridad por ejercicio (mayor peso levantado).
export const usePRs = () => {
  const prs = useLiveList(() => prRepo.getAll())

  return useMemo(() => {
    const best = new Map<number, PRRecord>()
    const byKey = new Map<string, PRRecord>()
    const maxWeight = new Map<number, number>()

    for (const pr of prs) {
      byKey.set(`${pr.exerciseId}:${pr.reps}`, pr)
      const current = best.get(pr.exerciseId)
      if (!current || pr.estimated1RM > current.estimated1RM) best.set(pr.exerciseId, pr)
      maxWeight.set(pr.exerciseId, Math.max(maxWeight.get(pr.exerciseId) ?? 0, pr.weightKg))
    }

    return {
      prs,
      bestPrs: [...best.values()],
      prMap: best,
      prByKey: byKey,
      prMaxWeight: maxWeight,
    }
  }, [prs])
}
