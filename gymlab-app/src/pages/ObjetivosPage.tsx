// Página «Objetivos» (/objetivos): gestionar objetivos e1RM por ejercicio + proyecciones.
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { GoalSetter } from '@/components/goals/GoalSetter'
import { GoalProjectionCard } from '@/components/home/GoalProjectionCard'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useAchievementsData } from '@/hooks/useAchievementsData'

// Objetivos de e1rm en página dedicada: formulario arriba y proyecciones en contexto.
// F120/OB-1: un solo useExerciseCatalog para ambos hijos y la proyección se alimenta
// de las series completadas de la capa única (sin useWorkoutSets propio).
export const ObjetivosPage = () => {
  const { t } = useTranslation()
  const { exercises } = useExerciseCatalog()
  const { completedSets } = useAchievementsData()

  return (
    <div>
      <AppHeader title={t('goals.title')} />
      <div className="space-y-4 p-4">
        <BackLink to="/" />
        <GoalSetter exercises={exercises} />
        <GoalProjectionCard sets={completedSets} exercises={exercises} />
      </div>
    </div>
  )
}
