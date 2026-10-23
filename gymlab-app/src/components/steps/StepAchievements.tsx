// Logros de pasos en /pasos (F109.1) con la expresión Nocturno Minimal: fila
// hairline, medallones circulares y conteo. Se muestran solo los conseguidos.
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, STEP_ACHIEVEMENT_IDS } from '@/domain/achievements'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'

type StepAchievementsProps = {
  unlockedIds: string[]
}

export const StepAchievements = ({ unlockedIds }: StepAchievementsProps) => {
  const { t } = useTranslation()
  const medals = ACHIEVEMENTS.filter(
    (achievement) =>
      (STEP_ACHIEVEMENT_IDS as readonly string[]).includes(achievement.id) &&
      unlockedIds.includes(achievement.id),
  )

  return (
    <section
      className="border-t border-border/40 pt-4"
      aria-label={t('steps.achievementsTitle')}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t('steps.achievementsTitle')}
        </h3>
        <span className="text-[10px] tabular-nums text-muted">{medals.length}</span>
      </div>

      {medals.length === 0 ? (
        <p className="mt-2 text-[10px] text-muted">
          {t('steps.achievementsEmpty')}{' '}
          <span className="text-muted/70">{t('steps.achievementsEmptyText')}</span>
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {medals.map((achievement) => (
            <li key={achievement.id}>
              <AchievementMedal achievement={achievement} unlocked count={0} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
