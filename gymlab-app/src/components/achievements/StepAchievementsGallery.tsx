// StepAchievementsGallery: galería de los 8 logros de pasos en /logros (F84f).
// Solo presentación: el estado (def + unlocked) llega calculado desde el dominio.
import { useTranslation } from 'react-i18next'
import type { DailyStepsEntry } from '@/domain/types'
import { getStepAchievementsWithStatus } from '@/domain/stepAchievements'
import { StepAchievementCard } from '@/components/steps/StepAchievementCard'

type StepAchievementsGalleryProps = {
  days: DailyStepsEntry[]
}

export const StepAchievementsGallery = ({ days }: StepAchievementsGalleryProps) => {
  const { t } = useTranslation()
  const entries = getStepAchievementsWithStatus(days)
  const unlockedCount = entries.filter((e) => e.unlocked).length

  return (
    <div className="mt-8">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-sm font-semibold text-fg">{t('achievements.stepsTitle')}</h2>
        <span className="text-xs text-muted">
          {unlockedCount}/{entries.length}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {entries.map(({ def, unlocked }) => (
          <StepAchievementCard key={def.id} def={def} unlocked={unlocked} variant="tile" />
        ))}
      </div>
    </div>
  )
}