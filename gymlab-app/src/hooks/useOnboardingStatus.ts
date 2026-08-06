import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo, routineRepo, workoutRepo } from '@/data/repositories'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'

export const useOnboardingStatus = () => {
  const done = useLiveQuery(
    () => metaRepo.getJson<boolean>(ONBOARDING_DONE_META_KEY, false),
    []
  )
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const routines = useLiveQuery(() => routineRepo.getAll(), []) ?? []
  return { done, workouts, routines }
}
