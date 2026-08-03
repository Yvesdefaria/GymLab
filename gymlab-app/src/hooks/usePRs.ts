import { useLiveQuery } from 'dexie-react-hooks'
import { prRepo } from '@/data/repositories'

export const usePRs = () => {
  const prs = useLiveQuery(() => prRepo.getAll(), []) ?? []
  const prMap = new Map(prs.map((pr) => [pr.exerciseId, pr]))
  return { prs, prMap }
}
