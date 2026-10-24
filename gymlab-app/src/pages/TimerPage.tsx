// Página del timer de entrenamiento avanzado (F132.2/Q4): header con el modo activo.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { WorkoutTimer } from '@/components/timer/WorkoutTimer'
import type { TimerMode } from '@/domain/roundTimer'

export const TimerPage = () => {
  const { t } = useTranslation()
  const [mode, setMode] = useState<TimerMode>('tabata')
  return (
    <div>
      <AppHeader kicker={t('timer.kicker')} title={t(`timer.modes.${mode}`)} />
      <div className="flex flex-col items-center gap-4 px-4 pt-2 pb-24">
        <BackLink to="/" />
        <WorkoutTimer onModeChange={setMode} />
      </div>
    </div>
  )
}
