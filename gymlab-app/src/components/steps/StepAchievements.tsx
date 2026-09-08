// StepAchievements: badges de los logros de pasos ya desbloqueados. Solo
// composición: cada logro se renderiza con StepAchievementCard (variant badge).
import { useTranslation } from 'react-i18next'
import type { StepAchievementDef } from '@/domain/stepAchievements'
import { StepAchievementCard } from './StepAchievementCard'

type StepAchievementsProps = {
  achievements: StepAchievementDef[]
}

export const StepAchievements = ({ achievements }: StepAchievementsProps) => {
  const { t } = useTranslation()

  return (
    <section className="panel rounded-2xl p-4" aria-label={t('steps.achievementsTitle')}>
      <h3 className="text-sm font-bold tracking-wide text-fg">{t('steps.achievementsTitle')}</h3>

      {achievements.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {t('steps.achievementsEmpty')}{' '}
          <span className="text-muted/70">{t('steps.achievementsEmptyText')}</span>
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {achievements.map((achievement) => (
            <StepAchievementCard key={achievement.id} def={achievement} variant="badge" />
          ))}
        </ul>
      )}
    </section>
  )
}