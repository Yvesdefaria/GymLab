// Página «Objetivos» (/objetivos): gestionar objetivos e1RM por ejercicio + proyecciones.
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { GoalSetter } from '@/components/goals/GoalSetter'
import { GoalProjectionCard } from '@/components/home/GoalProjectionCard'

// Objetivos de e1rm en página dedicada: formulario arriba y proyecciones en contexto.
export const ObjetivosPage = () => {
  const { t } = useTranslation()

  return (
    <div>
      <AppHeader title={t('goals.title')} />
      <div className="space-y-4 p-4">
        <BackLink to="/" />
        <GoalSetter />
        <GoalProjectionCard />
      </div>
    </div>
  )
}