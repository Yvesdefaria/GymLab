// Hook que consulta los récords personales (PRs) registrados.
import { useLiveQuery } from 'dexie-react-hooks'
import { prRepo } from '@/data/repositories'

// Devuelve los PRs como lista y como Map<exerciseId, PR> para consultas rápidas.
export const usePRs = () => {
  const prs = useLiveQuery(() => prRepo.getAll(), []) ?? []
  const prMap = new Map(prs.map((pr) => [pr.exerciseId, pr]))
  return { prs, prMap }
}
