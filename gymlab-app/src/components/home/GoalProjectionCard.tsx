// Proyección de objetivos: muestra fecha estimada de próximo hit por ejercicio.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, CheckCircle } from 'lucide-react'
import { useWorkoutSets } from '@/hooks/useWorkoutSets'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { buildGoalProjections } from '@/domain/goalProjection'
import { useGoalStore } from '@/store/goalStore'

export const GoalProjectionCard = () => {
  const { t } = useTranslation()
  const { sets } = useWorkoutSets()
  const { exercises } = useExerciseCatalog()
  const { goals } = useGoalStore()

  const projections = useMemo(
    () => buildGoalProjections(sets, exercises, goals),
    [sets, exercises, goals]
  )

  // Siempre mostrar, con fallback si no hay objetivos.
  const hasGoals = Object.keys(goals).length > 0

  return (
    <div className="flex flex-col gap-3">
      <p className="kicker">{t('goals.title')}</p>
      {!hasGoals ? (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
          <p className="text-xs text-muted">{t('goals.none')}</p>
        </div>
      ) : (
      <div className="flex flex-col gap-2">
        {projections.map((p) => (
          <div
            key={p.exerciseId}
            className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
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
              <p className="text-xs font-semibold text-fg">{p.exerciseName}</p>
              {p.reached ? (
                <p className="mt-0.5 text-[0.65rem] text-success">
                  {t('goals.reached', { target: p.targetE1rm })}
                </p>
              ) : (
                <>
                  <p className="mt-0.5 text-[0.65rem] text-muted">
                    {t('goals.current', { current: p.currentE1rm, target: p.targetE1rm })}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] text-muted">
                    {t('goals.estimated', { weeks: p.weeksToTarget, date: p.estimatedDate })}
                  </p>
                  <p className="mt-0.5 text-[0.6rem] text-accent">
                    {t('goals.rate', { rate: p.weeklyImprovementRate })}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
