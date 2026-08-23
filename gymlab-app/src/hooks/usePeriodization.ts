import { useLiveQuery } from 'dexie-react-hooks'
import { periodizationRepo } from '@/data/repositories'

export const usePeriodization = () => {
  const plans = useLiveQuery(() => periodizationRepo.getAll(), []) ?? []
  const activePlan = useLiveQuery(() => periodizationRepo.getActive(), []) ?? null
  return { plans, activePlan, periodizationRepo }
}
