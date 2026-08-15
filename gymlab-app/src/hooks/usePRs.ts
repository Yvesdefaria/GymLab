// Hook que consulta los récords personales (PRs) registrados.
import { useLiveList } from './useLiveList'
import { prRepo } from '@/data/repositories'

// Devuelve los PRs como lista y como Map<exerciseId, PR> para consultas rápidas.
export const usePRs = () => {
  const prs = useLiveList(() => prRepo.getAll())
  const prMap = new Map(prs.map((pr) => [pr.exerciseId, pr]))
  return { prs, prMap }
}
