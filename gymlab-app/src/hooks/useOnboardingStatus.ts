// Hook que expone el estado del onboarding y los datos que lo condicionan.
import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo, routineRepo, workoutRepo } from '@/data/repositories'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'

// Lee si el onboarding se completó, junto con el nº de workouts y rutinas existentes.
export const useOnboardingStatus = () => {
  const done = useLiveQuery(
    () => metaRepo.getJson<boolean>(ONBOARDING_DONE_META_KEY, false),
    []
  )
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const routines = useLiveQuery(() => routineRepo.getAll(), []) ?? []
  return { done, workouts, routines }
}
