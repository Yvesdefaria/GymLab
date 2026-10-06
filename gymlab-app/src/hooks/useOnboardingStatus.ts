// Hook que expone el estado del onboarding y los datos que lo condicionan.
import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo, workoutRepo } from '@/data/repositories'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'

// Lee si el onboarding se completó y cuántos workouts existen. F120/H3: el conteo
// es liviano (repo.count(), sin clonar la tabla) y ya no lee routines — el wizard
// que sí necesita el catálogo completo lo pide aparte con useRoutines().
export const useOnboardingStatus = () => {
  const done = useLiveQuery(
    () => metaRepo.getJson<boolean>(ONBOARDING_DONE_META_KEY, false),
    []
  )
  const workoutCount = useLiveQuery(() => workoutRepo.count(), [], 0) ?? 0
  return { done, workoutCount }
}
