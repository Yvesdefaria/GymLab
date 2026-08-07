import { useLiveQuery } from 'dexie-react-hooks'
import { profileRepo } from '@/data/repositories'

export const useProfile = () => {
  return useLiveQuery(() => profileRepo.get(), []) ?? undefined
}
