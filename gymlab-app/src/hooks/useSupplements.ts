import { useLiveQuery } from 'dexie-react-hooks'
import { supplementRepo } from '@/data/repositories'

export const useSupplements = () => {
  const supplements = useLiveQuery(() => supplementRepo.getAll(), []) ?? []
  return { supplements, supplementRepo }
}
