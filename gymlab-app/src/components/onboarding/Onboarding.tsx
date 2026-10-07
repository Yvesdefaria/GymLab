// Gate liviano del onboarding (F120/ONB-1): decide si el wizard debe mostrarse.
// Antes el cuerpo completo quedaba montado siempre y sus hooks (rutinas, catálogo,
// ajustes) seguían suscritos a Dexie toda la sesión aunque el onboarding ya estuviera
// hecho y el componente no renderizara nada. Acá solo corren las lecturas baratas del
// status (meta + count); el wizard se monta únicamente si de verdad va a mostrarse.
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { OnboardingWizard } from './OnboardingWizard'

export const Onboarding = () => {
  const { done, workoutCount } = useOnboardingStatus()
  // `done === undefined` = Dexie todavía cargando: esperar para no decidir con datos parciales.
  if (done === undefined || done || workoutCount > 0) return null
  return <OnboardingWizard />
}
