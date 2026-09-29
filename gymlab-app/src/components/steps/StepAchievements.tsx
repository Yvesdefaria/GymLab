// Logros de pasos en /pasos (F109.1): medallones del sistema unificado; se
// muestran solo los conseguidos, igual que antes.
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, STEP_ACHIEVEMENT_IDS } from '@/domain/achievements'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'

type StepAchievementsProps = {
  unlockedIds: string[]
}

export const StepAchievements = ({ unlockedIds }: StepAchievementsProps) => {
  const { t } = useTranslation()
  const medals = ACHIEVEMENTS.filter(
    (a) => (STEP_ACHIEVEMENT_IDS as readonly string[]).includes(a.id) && unlockedIds.includes(a.id)
  )

  return (
    <section className="panel rounded-2xl p-4" aria-label={t('steps.achievementsTitle')}>
      <h3 className="text-sm font-bold tracking-wide text-fg">{t('steps.achievementsTitle')}</h3>

      {medals.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {t('steps.achievementsEmpty')}{' '}
          <span className="text-muted/70">{t('steps.achievementsEmptyText')}</span>
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-3">
          {medals.map((a) => (
            <li key={a.id}>
              <AchievementMedal achievement={a} unlocked count={0} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
