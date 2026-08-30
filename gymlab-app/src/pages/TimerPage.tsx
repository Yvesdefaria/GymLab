// Página del timer de entrenamiento avanzado.
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { WorkoutTimer } from '@/components/timer/WorkoutTimer'

export const TimerPage = () => {
  const { t } = useTranslation()
  return (
    <div>
      <AppHeader title={t('timer.title')} />
      <div className="flex flex-col items-center gap-4 px-4 pt-2 pb-24">
        <BackLink to="/" />
        <WorkoutTimer />
      </div>
    </div>
  )
}
