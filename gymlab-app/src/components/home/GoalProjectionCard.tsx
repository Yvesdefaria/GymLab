// Proyección de objetivos: muestra fecha estimada de próximo hit por ejercicio.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Target, CheckCircle, Settings2 } from 'lucide-react'
import { useWorkoutSets } from '@/hooks/useWorkoutSets'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { buildGoalProjections } from '@/domain/goalProjection'
import { useGoalStore } from '@/store/goalStore'
import { formatDate, formatNumber } from '@/lib/intl'
import { parseLocalDate } from '@/domain/dates'
import type { AppLanguage } from '@/domain/onboarding'

export const GoalProjectionCard = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { sets } = useWorkoutSets()
  const { exercises } = useExerciseCatalog()
  const goals = useGoalStore((s) => s.goals)

  const projections = useMemo(
    () => buildGoalProjections(sets, exercises, goals),
    [sets, exercises, goals]
  )

  // Siempre mostrar, con fallback si no hay objetivos.
  const hasGoals = Object.keys(goals).length > 0

  // Números y fechas con el locale activo: «112,5», «14 feb 2028» (es).
  const fmtNum = (n: number) => formatNumber(n, lang)
  const fmtEstimatedDate = (dateStr: string) =>
    formatDate(parseLocalDate(dateStr), lang, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex flex-col gap-3">
      <p className="kicker">{t('goals.title')}</p>
      {!hasGoals ? (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-3">
          <p className="text-xs text-muted">{t('goals.none')}</p>
        </div>
      ) : (
      <div className="flex flex-col gap-2">
        {projections.map((p) => (
          <div
            key={p.exerciseId}
            className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
              p.reached
                ? 'border-success/40 bg-success/10'
                : 'border-border/30 bg-bg-elevated/30'
            }`}
          >
            {p.reached ? (
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            ) : (
              <Target className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{p.exerciseName}</p>
              {p.reached ? (
                <p className="mt-1 text-[0.8rem] font-medium text-success">
                  {t('goals.reached', { target: fmtNum(p.targetE1rm) })}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-[0.8rem] font-medium text-fg">
                    {t('goals.current', {
                      current: fmtNum(p.currentE1rm),
                      target: fmtNum(p.targetE1rm),
                    })}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-muted">
                    {t('goals.estimated', {
                      weeks: p.weeksToTarget,
                      date: fmtEstimatedDate(p.estimatedDate!),
                    })}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] text-accent">
                    {t('goals.rate', { rate: fmtNum(p.weeklyImprovementRate) })}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      <Link
        to="/objetivos"
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 text-xs font-medium text-accent transition-colors hover:border-cta"
      >
        <Settings2 className="size-3.5" aria-hidden />
        {t('goalSetter.manage')}
      </Link>
    </div>
  )
}
