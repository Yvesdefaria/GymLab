// Logros extendidos: página de todos los logros (desbloqueados + pendientes)
// como galería de chapas-medalla con metal por tier y contador de veces conseguido.
// Desde F95.3, cada logro y el total llevan barras de progreso accesibles
// (role=progressbar) alimentadas por el mapa declarativo ACHIEVEMENT_PROGRESS.
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, type Achievement } from '@/domain/achievements'
import type { AchievementProgress } from '@/domain/achievementProgress'
import type { DailyStepsEntry } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'
import { formatNumber } from '@/lib/intl'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'
import { StepAchievementsGallery } from '@/components/achievements/StepAchievementsGallery'

interface AchievementsPageProps {
  unlockedIds: string[]
  counts: Record<string, number>
  // Progreso en vivo de las 15 barras (F95.3), una entrada por logro.
  progress: Record<string, AchievementProgress>
  // Galería de logros de pasos (F84f): independiente de useAchievements.
  stepDays?: DailyStepsEntry[]
}

export const AchievementsPage = ({
  unlockedIds,
  counts,
  progress,
  stepDays,
}: AchievementsPageProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id))
  const locked = ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id))

  return (
    <div>
      <AppHeader title={t('achievements.title')} />
      <div className="overflow-hidden px-4 pb-20 pt-2">
        <div className="flex items-center justify-between">
          <BackLink to="/mas" />
          <span className="text-sm text-muted">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>

        {/* Barra general: desbloqueados sobre el total */}
        <div
          role="progressbar"
          data-progress="general"
          aria-label={t('achievements.progress.general', {
            current: unlocked.length,
            total: ACHIEVEMENTS.length,
          })}
          aria-valuenow={unlocked.length}
          aria-valuemin={0}
          aria-valuemax={ACHIEVEMENTS.length}
          className="mt-2 h-2 overflow-hidden rounded-full bg-border/30"
        >
          <div
            className="h-full rounded-full bg-cta transition-[width]"
            style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {/* Desbloqueados */}
          {unlocked.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-fg">{t('achievements.unlocked')}</p>
              {unlocked.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  unlocked
                  count={counts[a.id] ?? 0}
                  progress={progress[a.id]}
                  lang={lang}
                />
              ))}
            </div>
          )}

          {/* Pendientes */}
          {locked.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-fg">{t('achievements.locked')}</p>
              {locked.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  unlocked={false}
                  count={0}
                  progress={progress[a.id]}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </div>

        {stepDays !== undefined && <StepAchievementsGallery days={stepDays} />}
      </div>
    </div>
  )
}

const AchievementCard = ({
  achievement,
  unlocked,
  count,
  progress,
  lang,
}: {
  achievement: Achievement
  unlocked: boolean
  count: number
  progress?: AchievementProgress
  lang: AppLanguage
}) => {
  const { t } = useTranslation()

  return (
    <div className={`rounded-2xl border px-4 py-3 transition-colors ${
      unlocked
        ? 'border-accent/50 bg-accent/10'
        : 'border-border/30 bg-bg-elevated/30 opacity-50'
    }`}>
      <div className="flex items-center gap-3">
        <AchievementMedal achievement={achievement} unlocked={unlocked} count={count} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{t(achievement.titleKey as any)}</p>
          <p className="text-xs text-muted">{t(achievement.descriptionKey as any)}</p>
        </div>
      </div>

      {/* Barra de progreso del logro: se omite si el target es 0 (p. ej.
          guias-completas sin guías disponibles, sin señal de completado). */}
      {progress && progress.target > 0 && (
        <div className="mt-3">
          <div
            role="progressbar"
            data-progress={achievement.id}
            aria-label={t(achievement.titleKey as any)}
            aria-valuenow={progress.current}
            aria-valuemin={0}
            aria-valuemax={progress.target}
            className="h-2 overflow-hidden rounded-full bg-border/30"
          >
            <div
              className="h-full rounded-full bg-cta transition-[width]"
              style={{ width: `${(progress.current / progress.target) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {t('achievements.progress.count', {
              current: formatNumber(progress.current, lang),
              target: formatNumber(progress.target, lang),
            })}
          </p>
        </div>
      )}
    </div>
  )
}