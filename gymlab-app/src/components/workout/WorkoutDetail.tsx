// Página de detalle de una sesión del historial: resumen, notas y series agrupadas por ejercicio.
import { Clock, Dumbbell, Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { useWorkout } from '@/hooks/useWorkouts'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatWeight, formatUnits } from '@/domain/settings'
import { workoutDurationMin } from '@/domain/workouts'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

type WorkoutDetailProps = {
  workoutId: number
}

export const WorkoutDetail = ({ workoutId }: WorkoutDetailProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { settings } = useSettings()
  const { workout, sets } = useWorkout(workoutId)
  const { exercises } = useExerciseCatalog()
  // Índice id→nombre para resolver los nombres de ejercicio en el detalle.
  const nameById = new Map(exercises.map((e) => [e.id, e.name]))

  if (!workout) {
    return (
      <div>
        <AppHeader title={t('workout.titulo')} subtitle={t('workout.historial')} />
        <div className="p-4">
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="font-display text-base font-semibold text-fg">{t('workout.noEncontrada')}</p>
            <p className="mt-1 text-sm text-muted">{t('workout.posibleBorrada')}</p>
            <BackLink to="/perfil" label={t('workout.volverHistorial')} className="mt-4 border border-border bg-bg-elevated px-4 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const dateLabel = formatDate(workout.startedAt, lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const durationMin = workoutDurationMin(workout)
  const completedSets = sets.filter((s) => s.completed).length
  // Agrupa las series por ejercicio conservando el orden de aparición en la sesión.
  const setsByExercise = new Map<number, typeof sets>()
  for (const s of sets) {
    const list = setsByExercise.get(s.exerciseId) ?? []
    list.push(s)
    setsByExercise.set(s.exerciseId, list)
  }
  const exerciseIds = Array.from(setsByExercise.keys())

  return (
    <div>
      <AppHeader title={t('workout.titulo')} subtitle={dateLabel} />
      <div className="space-y-4 p-4">
        <BackLink to="/perfil" label={t('workout.historial')} className="min-h-[44px] gap-1.5 text-muted hover:text-accent-soft" />

        <div className="grid grid-cols-3 gap-3">
          <div className="panel rounded-2xl p-3">
            <Clock className="mb-2 size-5 text-muted" />
            <p className="kicker">{t('workout.duracion')}</p>
            <p className="font-display text-lg font-bold text-fg">
              {durationMin !== null ? t('workout.min', { min: durationMin }) : '—'}
            </p>
          </div>
          <div className="panel rounded-2xl p-3">
            <Flame className="mb-2 size-5 text-cta" />
            <p className="kicker">{t('workout.volumen')}</p>
            <p className="font-display text-lg font-bold text-fg">
              {Math.round(applyUnits(workout.totalVolume, settings.units)).toLocaleString()} {formatUnits(settings.units)}
            </p>
          </div>
          <div className="panel rounded-2xl p-3">
            <Dumbbell className="mb-2 size-5 text-accent" />
            <p className="kicker">{t('workout.series')}</p>
            <p className="font-display text-lg font-bold text-fg">
              {completedSets}/{sets.length}
            </p>
          </div>
        </div>

        {workout.notes && (
          <div className="panel-light rounded-2xl p-4">
            <p className="text-sm leading-relaxed text-fg">{workout.notes}</p>
          </div>
        )}

        {exerciseIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">{t('workout.sinEjercicios')}</p>
          </div>
        ) : (
          exerciseIds.map((exerciseId) => {
            const name = nameById.get(exerciseId) ?? t('workout.ejercicioNum', { id: exerciseId })
            const exerciseSets = setsByExercise.get(exerciseId) ?? []
            return (
              <div key={exerciseId} className="panel-light rounded-2xl p-4">
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
                  {name}
                </h2>
                <div className="space-y-1.5">
                  {exerciseSets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex w-8 shrink-0 items-center gap-1 text-xs text-muted">
                        {set.isWarmup ? (
                          <span className="rounded-full border border-cta/40 bg-cta/10 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-soft">
                            CAL
                          </span>
                        ) : (
                          `#${set.setNumber}`
                        )}
                      </span>
                      <span className="min-w-0 flex-1 text-right font-semibold text-fg">
                        {formatWeight(set.weightKg, settings.units)} × {set.reps}
                      </span>
                      {set.rpe !== undefined && (
                        <span className="w-10 shrink-0 text-right text-xs text-muted">
                          {t('workout.rpeValor', { valor: set.rpe })}
                        </span>
                      )}
                      {set.rir !== undefined && (
                        <span className="w-10 shrink-0 text-right text-xs text-muted">
                          {t('workout.rirValor', { valor: set.rir })}
                        </span>
                      )}
                      {set.completed ? (
                        <span className="w-5 shrink-0 text-xs text-success" aria-label={t('workout.completada')}>
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 shrink-0 text-xs text-muted" aria-label={t('workout.sinCompletar')}>
                          –
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
